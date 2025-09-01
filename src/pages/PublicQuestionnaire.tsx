import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { rpcGetPublicBranding, rpcGetPublicQuestionnaire, rpcSubmitResponse, safeToast } from "@/lib/rpc";
import { normalizePublicQuestionnaire, applyBranding, type NormalizedQuestion } from "@/lib/normalizePublicQuestionnaire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PublicQuestionnaire() {
  const { token = "" } = useParams();
  const navigate = useNavigate();

  const [branding, setBranding] = useState<any>(null);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [requireContact, setRequireContact] = useState<boolean>(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [b, raw] = await Promise.all([
          rpcGetPublicBranding(token),
          rpcGetPublicQuestionnaire(token),
        ]);

        if (!alive) return;

        setBranding(b);
        applyBranding(b);

        const norm = normalizePublicQuestionnaire(raw);
        setTitle(norm.title ?? "");
        setDescription(norm.description ?? "");
        setQuestions(norm.questions);
        setRequireContact(Boolean(norm.requireContact));
      } catch (e) {
        console.error(e);
        safeToast({ title: "השאלון לא נמצא", description: "ודאי שהקישור נכון ושהשאלון פורסם." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await rpcSubmitResponse({
        token_or_uuid: token,
        answers,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        lang: "he",
        channel: "landing",
      });
      navigate("/thank-you");
    } catch (e) {
      console.error(e);
      safeToast({ title: "שגיאה בשליחה", description: "נסו שוב בעוד רגע." });
    }
  }
  
  const handleContactChange = (field: string, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  const renderQuestion = (q: NormalizedQuestion) => {
    const commonProps = {
      required: q.required,
      placeholder: q.placeholder ?? "",
      value: answers[q.id] ?? "",
      onChange: (e: any) => {
        const val = e?.target?.value ?? e;
        setAnswers(prev => ({ ...prev, [q.id]: val }));
      }
    };

    switch (q.type) {
      case "textarea":
        return <Textarea {...commonProps} rows={4} />;
      case "select":
        return (
          <select {...commonProps} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{q.placeholder ?? "בחר/י"}</option>
            {(q.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {(q.options ?? []).map((o) => (
              <label key={o.value} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name={q.id}
                  value={o.value}
                  checked={answers[q.id] === o.value}
                  onChange={() => setAnswers(prev => ({ ...prev, [q.id]: o.value }))}
                  required={q.required}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{o.label}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
         return (
          <div className="space-y-2">
            {(q.options ?? []).map((o) => {
              const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
              const checked = arr.includes(o.value);
              return (
                <label key={o.value} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(arr);
                      if (e.target.checked) next.add(o.value); else next.delete(o.value);
                      setAnswers(prev => ({ ...prev, [q.id]: Array.from(next) }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              );
            })}
          </div>
        );
      case "number":
        return <Input type="number" min={q.min} max={q.max} {...commonProps} />;
      default:
        return <Input type="text" {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">טוען...</p>
        </div>
      </div>
    );
  }
  
  if (!loading && questions.length === 0) {
     return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">שאלון לא נמצא</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {branding?.brand_logo_url && (
              <img src={branding.brand_logo_url} alt="Logo" className="h-12" />
            )}
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {description && (
                <p className="text-gray-600 text-sm">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={onSubmit} className="space-y-6">
          {requireContact && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">פרטי קשר</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
                  <Input type="text" value={contact.name} onChange={(e) => handleContactChange("name", e.target.value)} placeholder="הכנס את שמך" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                  <Input type="email" value={contact.email} onChange={(e) => handleContactChange("email", e.target.value)} placeholder="הכנס את האימייל שלך" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                  <Input type="tel" value={contact.phone} onChange={(e) => handleContactChange("phone", e.target.value)} placeholder="הכנס את הטלפון שלך" />
                </div>
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">שאלות</h2>
              <div className="space-y-6">
                {questions.map((q) => (
                  <div key={q.id} className="space-y-3">
                    <label className="block text_sm font-medium text-gray-700">
                      {q.label}
                      {q.required && <span className="text-red-500 mr-1">*</span>}
                    </label>
                    {renderQuestion(q)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button type="submit" size="lg" className="px-8 py-3" style={{ backgroundColor: branding?.brand_primary_color || undefined }}>
              שלח תשובה
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
 