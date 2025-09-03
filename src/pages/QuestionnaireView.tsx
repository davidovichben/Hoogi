import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rpcGetPublicQuestionnaire, rpcGetPublicBranding, rpcQaQuestions, rpcSubmitResponse } from "@/lib/rpc";
import { normalizePublicQuestionnaire, normalizeQuestions, type NormalizedQuestion } from "@/lib/normalizePublicQuestionnaire";
import { applyBrandingVars, resolveLogoUrl, sanitizeHex } from "@/lib/branding";
import { validateRequired, toSerializableAnswers } from "@/lib/answers";
import { safeToast } from "@/lib/toast";

// The dynamic import for an optional external renderer was removed as it caused a build error.
// The local fallback renderer will be used instead.
const ExternalQuestionRenderer: any = null;

export default function QuestionnaireView() {
  const { token, id } = useParams();         // public: /q/:token, preview: /q/preview/:id
  const [search] = useSearchParams();
  const lang = (search.get("lang") || "he") as "he" | "en";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) מיתוג
        if (token) {
          const b = await rpcGetPublicBranding(token);
          if (b?.brand_primary || b?.brand_secondary) {
            applyBrandingVars({
              primary: sanitizeHex(b.brand_primary || ""),
              secondary: sanitizeHex(b.brand_secondary || ""),
            });
          }
          if (b?.brand_logo_path) {
            setLogoUrl(await resolveLogoUrl(b.brand_logo_path));
          }
        } else if (id) {
          // Preview: משוך מיתוג מהפרופיל של המשתמש המחובר – בלי לשנות DB
          const { data: prof } = await supabase
            .from("profiles")
            .select("brand_primary,brand_secondary,brand_logo_path")
            .limit(1)
            .single();
          if (prof) {
            applyBrandingVars({
              primary: sanitizeHex(prof.brand_primary || ""),
              secondary: sanitizeHex(prof.brand_secondary || ""),
            });
            if (prof.brand_logo_path) {
              setLogoUrl(await resolveLogoUrl(prof.brand_logo_path));
            }
          }
        }

        // 2) שאלות
        if (token) {
          const pub = await rpcGetPublicQuestionnaire(token);
          setTitle(pub?.title || "");
          // pub.questions יכול להיות JSON או שדה טקסט – הנרמול נעשה פה:
          const list = Array.isArray(pub?.questions)
            ? pub!.questions
            : (() => {
                try { return JSON.parse(pub?.questions || "[]"); }
                catch { return []; }
              })();
          setQuestions(normalizeQuestions(list));
        } else if (id) {
          // צידו של Preview – להשתמש ב-qa_questions(qid) שהכנו מראש
          const rows = await rpcQaQuestions(id);
          setTitle(rows?.[0]?.questionnaire_title || "");
          setQuestions(normalizeQuestions(rows || []));
        } else {
          setQuestions([]);
        }
      } catch (e: any) {
        console.error(e);
        setError("טעינת התצוגה נכשלה.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token, id]);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // בטיוטה לא שולחים – רק מידע
    if (!token) {
      safeToast({ title: "שליחה פעילה רק אחרי פרסום השאלון", description: "" });
      return;
    }
    try {
      const missing = validateRequired(questions, answers);
      if (missing.length) {
        safeToast({ title: "יש למלא את כל השדות החובה", description: "" });
        return;
      }
      const payload = toSerializableAnswers(questions, answers);
      // חילוץ אימייל/טלפון אם קיימים בשאלון
      const email = payload.contact_email || null;
      const phone = payload.contact_phone || null;
      await rpcSubmitResponse(token, payload, email, phone, lang, "landing");
      safeToast({ title: "נשלח בהצלחה", description: "" });
    } catch (err) {
      console.error(err);
      safeToast({ title: "שליחה נכשלה", description: "" });
    }
  };

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
        {title && <h2 style={{ margin: 0, color: "hsl(var(--brand-primary))" }}>{title}</h2>}
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
        <button
          className="btn"
          style={{ background: "hsl(var(--brand-primary))", color: "white" }}
          onClick={onSubmit}
        >
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
      borderColor: "hsl(var(--brand-primary))",
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
                  style={{ accentColor: "hsl(var(--brand-primary))" }}
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
                    style={{ accentColor: "hsl(var(--brand-primary))" }}
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
  background: "hsl(var(--brand-primary))",
  color: "white",
  cursor: "pointer",
};
