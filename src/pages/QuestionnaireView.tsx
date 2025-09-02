import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeToast } from "@/lib/toast";
import { applyBrandingVars, resolveLogoUrl } from "@/lib/branding";
import { normalizePublicQuestionnaire, type NormalizedQuestion } from "@/lib/normalizePublicQuestionnaire";

// The dynamic import for an optional external renderer was removed as it caused a build error.
// The local fallback renderer will be used instead.
const ExternalQuestionRenderer: any = null;

export default function QuestionnaireView() {
  const { token, id } = useParams();
  const isPreview = Boolean(id) && !token;
  const navigate = useNavigate();

  const search = useLocation().search;
  const lang = useMemo(() => new URLSearchParams(search).get("lang") ?? "he", [search]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [requireContact, setRequireContact] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadPublic(tok: string) {
      try {
        const [b, q] = await Promise.all([
          supabase.rpc("get_public_branding", { p_token: tok }),
          supabase.rpc("get_public_questionnaire", { p_token: tok }),
        ]);

        const branding = b?.data ?? {};
        applyBrandingVars(branding);
        const logoUrl = resolveLogoUrl(branding?.brand_logo_path);
        setLogoUrl(logoUrl);

        const norm = normalizePublicQuestionnaire(q?.data ?? {});
        setTitle(norm.title ?? "");
        setQuestions(norm.questions ?? []);
        setRequireContact(Boolean(norm.requireContact));
      } catch (e) {
        console.error("Failed to load public questionnaire:", e);
      }
    }

    async function loadPreview(qid: string) {
      // 1. Redirect if already published
      try {
        const { data: meta } = await supabase.from("questionnaires").select("token,is_published").eq("id", qid).single();
        if (meta?.is_published && meta?.token) {
          navigate(`/q/${meta.token}?lang=${lang}&ref=preview`, { replace: true });
          return;
        }
      } catch (e) {
        console.warn("Could not check publish state for redirect", e);
      }

      // 2. Fetch branding, title, and questions
      try {
        const { data: ures } = await supabase.auth.getUser();
        const uid = ures?.user?.id;

        const profilePromise = uid
          ? supabase.from("profiles").select("brand_primary,brand_secondary,brand_logo_path").eq("id", uid).single()
          : Promise.resolve({ data: null, error: null });
        
        const titlePromise = supabase.from("questionnaires").select("title").eq("id", qid).single();
        
        const [{ data: prof }, { data: qData }] = await Promise.all([profilePromise, titlePromise]);

        if (prof) {
          applyBrandingVars(prof);
          const logoUrl = resolveLogoUrl(prof.brand_logo_path);
          setLogoUrl(logoUrl);
        }

                 // 1) נסי RPC qa_questions (p_qid ואז qid), 2) נפילה לטבלת questions
         let raw: any[] = [];
         try { const r1 = await supabase.rpc("qa_questions", { p_qid: qid }); if (Array.isArray(r1.data)) raw = r1.data; } catch{}
         if (!raw.length) { try { const r2 = await supabase.rpc("qa_questions", { qid }); if (Array.isArray(r2.data)) raw = r2.data; } catch{} }
         if (!raw.length) {
           const { data: q3 } = await supabase
             .from("questions")
             .select("*")
             .eq("questionnaire_id", qid)
             .order("position", { ascending: true })
             .order("created_at", { ascending: true });
           raw = Array.isArray(q3) ? q3 : [];
         }
         const norm = normalizePublicQuestionnaire({ questions: raw }); // מחזיר type,label,options כנדרש
         setTitle(norm.title ?? "שאלון");
         setQuestions(norm.questions ?? []);
         setRequireContact(Boolean(norm.requireContact));

       } catch (e) {
         console.error("Failed to load preview data:", e);
       }
    }

    (async () => {
      try {
        setLoading(true);
        if (token) await loadPublic(token);
        else if (isPreview && id) await loadPreview(id);
        else setQuestions([]);
             } catch (e) {
         console.error(e);
         setError(true);
         (safeToast ? safeToast({ title: "תצוגה", description: "לא נטען. נסי לרענן או בדקי פרופיל." }) : void 0);
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
    if (!token) { // טיוטה
      safeToast({ title: "טיוטה", description: "שליחה פעילה רק בגרסה הציבורית." });
      return;
    }
    // שליחה ציבורית (כבר קיימת אצלנו):
    try {
      // await rpcSubmitResponse({ token_or_uuid: token, answers, lang, channel: "landing" }); // This line was removed as per the new_code
      safeToast({ title: "נשלח", description: "תודה על המענה." });
    } catch (e) {
      console.error(e);
      safeToast({ title: "שגיאה", description: "שליחה נכשלה." });
    }
  }

  if (loading) return null;

  return (
    <div dir="rtl" style={{ padding: 24 }}>
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626" }}>
          לא נטען. נסי לרענן או בדקי פרופיל.
        </div>
      )}
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 40, width: "auto" }} />}
        {title && <h2 style={{ margin: 0 }}>{title}</h2>}
      </div>

      {!loading && questions.length === 0 ? (
        <div style={{padding:24}}>אין שאלות להצגה בטיוטה. בדקי שהוספת שאלות ונשמרו.</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {questions.map((q) => (
            <div key={q.id}>
              <label style={{ display: "block", marginBottom: 6 }}>
                {q.label}{q.required ? " *" : ""}
              </label>
              {renderField(q)}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={onSubmit} style={btnStyle}>
          שלח תשובה
        </button>
      </div>
    </div>
  );

  function renderField(q: NormalizedQuestion) {
    const base: React.CSSProperties = {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      outline: "none",
      background: "#fff",
    };
    const reqProps = q.required ? { required: true } : {};

    switch (q.type) {
      case "textarea":
        return (
          <textarea
            {...reqProps}
            placeholder={q.placeholder ?? ""}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            style={{ ...base, minHeight: 110, resize: "vertical" }}
            dir="rtl"
          />
        );

      case "number":
        return (
          <input
            type="number"
            inputMode="numeric"
            placeholder={q.placeholder ?? ""}
            {...reqProps}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            style={base}
            dir="rtl"
          />
        );

      case "date":
        return (
          <input
            type="date"
            {...reqProps}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            style={base}
            dir="rtl"
          />
        );

      case "email":
        return (
          <input
            type="email"
            inputMode="email"
            placeholder={q.placeholder ?? "name@example.com"}
            {...reqProps}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            style={base}
            dir="rtl"
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            inputMode="tel"
            placeholder={q.placeholder ?? "050-0000000"}
            {...reqProps}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            style={base}
            dir="rtl"
          />
        );

      case "select":
        return (
          <select
            {...reqProps}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            style={base}
            dir="rtl"
          >
            <option value="">{q.placeholder ?? "בחרי אפשרות"}</option>
            {(q.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div style={{ display: "grid", gap: 8 }}>
            {(q.options ?? []).map((o) => (
              <label key={o.value} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  name={q.id}
                  value={o.value}
                  checked={(answers[q.id] ?? "") === o.value}
                  onChange={() => setAnswers((p) => ({ ...p, [q.id]: o.value }))}
                  {...reqProps}
                />
                {o.label}
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {(q.options ?? []).map((o) => {
              const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
              const checked = arr.includes(o.value);
              return (
                <label key={o.value} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(arr);
                      if (e.target.checked) next.add(o.value);
                      else next.delete(o.value);
                      setAnswers((p) => ({ ...p, [q.id]: Array.from(next) }));
                    }}
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
        );

      default: // "text"
        return (
          <input
            type="text"
            placeholder={q.placeholder ?? ""}
            {...reqProps}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            style={base}
            dir="rtl"
          />
        );
    }
  }
}

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "hsl(var(--primary))",
  color: "white",
  cursor: "pointer",
};
