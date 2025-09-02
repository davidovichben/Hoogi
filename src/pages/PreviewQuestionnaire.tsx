// src/pages/PreviewQuestionnaire.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeToast } from "@/lib/rpc";
import { normalizePublicQuestionnaire, applyBranding, type NormalizedQuestion } from "@/lib/normalizePublicQuestionnaire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPublishState, openPublic } from "@/lib/preview";
import { useNavigate } from 'react-router-dom';

const renderPreviewQuestion = (q: NormalizedQuestion) => {
  const commonProps = {
    required: q.required,
    placeholder: q.placeholder ?? "תצוגה מקדימה",
    disabled: true,
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
            <label key={o.value} className="flex items-center space-x-3 opacity-70">
              <input type="radio" name={q.id} value={o.value} required={q.required} disabled className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
              <span className="text-sm text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      );
    case "checkbox":
       return (
        <div className="space-y-2">
          {(q.options ?? []).map((o) => (
            <label key={o.value} className="flex items-center space-x-3 opacity-70">
              <input type="checkbox" disabled className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      );
    case "number":
      return <Input type="number" min={q.min} max={q.max} {...commonProps} />;
    default:
      return <Input type="text" {...commonProps} />;
  }
};

export default function PreviewQuestionnaire() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [branding, setBranding] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // First, check if the questionnaire is already published.
        const state = await getPublishState(id);
        if (state?.is_published && state.token) {
          // If so, redirect to the public page instead of showing a draft.
          openPublic(state.token);
          if (alive) setLoading(false);
          return;
        }

        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes?.user?.id;
        let b: any = {};
        if (uid) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("brand_primary,brand_secondary,brand_logo_url")
            .eq("id", uid)
            .single();
          b = prof;
          setBranding(prof);
          applyBranding(prof);
        }

        let raw: any[] = [];
        const res = await supabase.from("questionnaires").select("*, questions(*)").eq("id", id).single();
        if (res.error) throw res.error;
        
        setTitle(res.data.title ?? "תצוגה מקדימה");
        const norm = normalizePublicQuestionnaire({ questions: res.data.questions });
        
        if (!alive) return;
        setQuestions(norm.questions);

      } catch (e) {
        console.error(e);
        safeToast({ title: "תצוגה", description: "לא ניתן לטעון תצוגת טיוטה." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
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
              <p className="text-gray-600 text-sm">תצוגת טיוטה (לא לשליחה)</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
           {questions.length > 0 ? (
            questions.map((q) => (
              <div key={q.id} className="space-y-3">
                <label className="block text_sm font-medium text-gray-700">
                  {q.label}
                  {q.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {renderPreviewQuestion(q)}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">לא נמצאו שאלות בטיוטה זו.</p>
          )}
        </div>
      </div>
    </div>
  );
}
