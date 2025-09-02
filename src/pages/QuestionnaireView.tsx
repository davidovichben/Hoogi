import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeToast, rpcSubmitResponse } from "@/lib/rpc";
import {
  normalizePublicQuestionnaire,
  applyBranding,
  type NormalizedQuestion,
} from "@/lib/normalizePublicQuestionnaire";

/**
 * Unified questionnaire view:
 * - Public:   /q/:token        (loads branding+questions via public RPC)
 * - Preview:  /q/preview/:id   (loads draft by qid, branding from profile)
 */
export default function QuestionnaireView() {
  const { token, id } = useParams();
  const isPreview = Boolean(id) && !token;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>("");
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [requireContact, setRequireContact] = useState(true);

  const search = useLocation().search;
  const lang = useMemo(() => new URLSearchParams(search).get("lang") ?? "he", [search]);

  useEffect(() => {
    let alive = true;

    async function loadBrandingPreviewUser() {
      try {
        const { data: ures } = await supabase.auth.getUser();
        const uid = ures?.user?.id;
        if (!uid) return;
        const { data: prof } = await supabase
          .from("profiles")
          .select("brand_primary,brand_secondary,brand_logo_url,brand_logo_path")
          .eq("id", uid)
          .single();
        if (prof) applyBranding(prof);
      } catch {}
    }

    async function loadPublicByToken(tok: string) {
      try {
        const b = await supabase.rpc("get_public_branding", { p_token: tok });
        if (b?.data) applyBranding(b.data);
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

    async function loadDraftById(qid: string) {
      // redirect to public if already published
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

      // branding from profile
      await loadBrandingPreviewUser();

      // try RPC qa_questions with different param names
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
        try {
          const { data: q3 } = await supabase
            .from("questions")
            .select("*")
            .eq("questionnaire_id", qid)
            .order("position", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: true });
          raw = Array.isArray(q3) ? q3 : [];
        } catch {}
      }

      const norm = normalizePublicQuestionnaire({ questions: raw });
      setTitle(norm.title ?? "");
      setQuestions(norm.questions ?? []);
      setRequireContact(Boolean(norm.requireContact));
    }

    (async () => {
      try {
        if (isPreview && id) await loadDraftById(id);
        else if (token) await loadPublicByToken(token);
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
    try {
      if (!token) {
        safeToast({ title: "טיוטה", description: "שליחה פעילה רק בגרסה הציבורית." });
        return;
      }
      await rpcSubmitResponse({
        token_or_uuid: token,
        answers,
        lang,
        channel: "landing",
      });
      safeToast({ title: "נשלח", description: "תודה על המענה." });
    } catch (e) {
      console.error(e);
      safeToast({ title: "שגיאה", description: "שליחה נכשלה." });
    }
  }

  if (loading) return null;

  return (
    <div dir="rtl">
      {title && <h2>{title}</h2>}

      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 16 }}>
          <label>
            {q.label}
            {q.required ? " *" : ""}
          </label>
          {renderField(q)}
        </div>
      ))}

      {requireContact && <div style={{ marginTop: 24 }} />}

      <button onClick={onSubmit}>שלח תשובה</button>
    </div>
  );

  function renderField(q: NormalizedQuestion) {
    switch (q.type) {
      case "textarea":
        return (
          <textarea required={q.required} placeholder={q.placeholder ?? ""} {...bindValue(q)} />
        );
      case "select":
        return (
          <select required={q.required} {...(bindValue(q) as any)}>
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
          <div>
            {(q.options ?? []).map((o) => (
              <label key={o.value} style={{ marginInlineEnd: 12 }}>
                <input
                  type="radio"
                  name={q.id}
                  value={o.value}
                  checked={answers[q.id] === o.value}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.value }))}
                  required={q.required}
                />{" "}
                {o.label}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div>
            {(q.options ?? []).map((o) => {
              const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
              const checked = arr.includes(o.value);
              return (
                <label key={o.value} style={{ marginInlineEnd: 12 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(arr);
                      if (e.target.checked) next.add(o.value);
                      else next.delete(o.value);
                      setAnswers((prev) => ({ ...prev, [q.id]: Array.from(next) }));
                    }}
                  />{" "}
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
            {...bindValue(q)}
          />
        );
      default:
        return (
          <input
            type="text"
            required={q.required}
            placeholder={q.placeholder ?? ""}
            {...bindValue(q)}
          />
        );
    }
  }
}
