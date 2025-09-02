import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeToast, rpcSubmitResponse } from "@/lib/rpc";
import { normalizePublicQuestionnaire, type NormalizedQuestion } from "@/lib/normalizePublicQuestionnaire";
import { applyBrandingVars, resolveLogoUrl } from "@/lib/theme";

let ExternalQuestionRenderer: any = null;
try {
  // Optional external renderer if exists
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ExternalQuestionRenderer = (await import("@/components/question/Question")).default;
} catch {}

export default function QuestionnaireView() {
  const { token, id } = useParams();
  const isPreview = Boolean(id) && !token;
  const navigate = useNavigate();

  const search = useLocation().search;
  const lang = useMemo(() => new URLSearchParams(search).get("lang") ?? "he", [search]);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [requireContact, setRequireContact] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadPublic(tok: string) {
      try {
        const b = await supabase.rpc("get_public_branding", { p_token: tok });
        const branding = b?.data ?? {};
        applyBrandingVars(branding);
        setLogoUrl(resolveLogoUrl(branding?.brand_logo_path));
      } catch {}
      try {
        const q = await supabase.rpc("get_public_questionnaire", { p_token: tok });
        const norm = normalizePublicQuestionnaire(q?.data ?? {});
        setTitle(norm.title ?? "");
        setQuestions(norm.questions ?? []);
        setRequireContact(Boolean(norm.requireContact));
      } catch (e) {
        console.error(e);
      }
    }

    async function loadPreview(qid: string) {
      try {
        const { data: meta } = await supabase
          .from("questionnaires")
          .select("token,is_published")
          .eq("id", qid)
          .single();
        if (meta?.is_published && meta?.token) {
          navigate(`/q/${meta.token}?lang=${lang}&ref=preview`, { replace: true });
          return;
        }
      } catch {}

      try {
        const { data: ures } = await supabase.auth.getUser();
        const uid = ures?.user?.id;
        if (uid) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("brand_primary,brand_secondary,brand_logo_path")
            .eq("id", uid)
            .single();
          applyBrandingVars(prof ?? {});
          setLogoUrl(resolveLogoUrl(prof?.brand_logo_path));
        }
      } catch {}

      let raw: any[] = [];
      try {
        const r1 = await supabase.rpc("qa_questions", { p_qid: qid });
        if (Array.isArray(r1.data) && r1.data.length) raw = r1.data as any[];
      } catch {}
      if (!raw.length) {
        try {
          const r2 = await supabase.rpc("qa_questions", { qid: qid });
          if (Array.isArray(r2.data) && r2.data.length) raw = r2.data as any[];
        } catch {}
      }
      if (!raw.length) {
        const { data: q3 } = await supabase
          .from("questions")
          .select("*")
          .eq("questionnaire_id", qid)
          .order("position", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true });
        raw = Array.isArray(q3) ? q3 : [];
      }

      const norm = normalizePublicQuestionnaire({ questions: raw });
      setTitle(norm.title ?? "");
      setQuestions(norm.questions ?? []);
      setRequireContact(Boolean(norm.requireContact));
    }

    (async () => {
      try {
        if (token) await loadPublic(token);
        else if (isPreview && id) await loadPreview(id);
        else setQuestions([]);
      } catch (e) {
        console.error(e);
        safeToast({ title: "תצוגה", description: "לא ניתן לטעון את השאלון." });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, id, isPreview, lang, navigate]);

  function bindValue(q: NormalizedQuestion) {
    const v = answers[q.id] ?? "";
    return {
      value: v,
      onChange: (e: any) => {
        const val = e?.target?.value ?? e;
        setAnswers((prev) => ({ ...prev, [q.id]: val }));
      },
    } as any;
  }

  async function onSubmit() {
    if (!token) {
      safeToast({ title: "טיוטה", description: "שליחה פעילה רק בגרסה הציבורית." });
      return;
    }
    try {
      await rpcSubmitResponse({ token_or_uuid: token, answers, lang, channel: "landing" });
      safeToast({ title: "נשלח", description: "תודה על המענה." });
    } catch (e) {
      console.error(e);
      safeToast({ title: "שגיאה", description: "שליחה נכשלה." });
    }
  }

  if (loading) return null;

  return (
    <div dir="rtl" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 40, width: "auto" }} />}
        {title && <h2 style={{ margin: 0 }}>{title}</h2>}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {questions.map((q) => (
          <div key={q.id} className="qv-field">
            <label style={{ display: "block", marginBottom: 6 }}>
              {q.label}
              {q.required ? " *" : ""}
            </label>
            {ExternalQuestionRenderer ? (
              <ExternalQuestionRenderer
                question={q}
                value={answers[q.id]}
                onChange={(val: any) => setAnswers((p) => ({ ...p, [q.id]: val }))}
              />
            ) : (
              renderFallbackField(q)
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={onSubmit} style={btnStyle}>
          שלח תשובה
        </button>
      </div>
    </div>
  );

  function renderFallbackField(q: NormalizedQuestion) {
    const base = { ...inputBaseStyle, ...(q.required ? { borderColor: "hsl(var(--primary))" } : {}) };
    switch (q.type) {
      case "textarea":
        return (
          <textarea
            required={q.required}
            placeholder={q.placeholder ?? ""}
            {...(bindValue(q) as any)}
            style={{ ...base, minHeight: 96 }}
          />
        );
      case "select":
        return (
          <select required={q.required} {...(bindValue(q) as any)} style={base}>
            <option value="">{q.placeholder ?? ""}</option>
            {(q.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {(q.options ?? []).map((o) => (
              <label key={o.value} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="radio"
                  name={q.id}
                  value={o.value}
                  checked={answers[q.id] === o.value}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.value }))}
                  required={q.required}
                />
                {o.label}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {(q.options ?? []).map((o) => {
              const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
              const checked = arr.includes(o.value);
              return (
                <label key={o.value} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(arr);
                      if (e.target.checked) next.add(o.value);
                      else next.delete(o.value);
                      setAnswers((prev) => ({ ...prev, [q.id]: Array.from(next) }));
                    }}
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
        );
      case "number":
        return (
          <input
            type="number"
            required={q.required}
            placeholder={q.placeholder ?? ""}
            {...(bindValue(q) as any)}
            style={inputBaseStyle}
          />
        );
      default:
        return (
          <input
            type="text"
            required={q.required}
            placeholder={q.placeholder ?? ""}
            {...(bindValue(q) as any)}
            style={inputBaseStyle}
          />
        );
    }
  }
}

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "hsl(var(--primary))",
  color: "white",
  cursor: "pointer",
};
