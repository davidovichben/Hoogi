import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { rpcGetPublicBranding, rpcGetPublicQuestionnaire, rpcSubmitResponse, safeToast } from "@/lib/rpc";

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  required?: boolean;
  order: number;
}

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  default_lang: "he" | "en";
  meta: {
    brand_logo_url?: string;
    brand_primary_color?: string;
    brand_secondary_color?: string;
  };
}

interface LeadSubmission {
  questionnaire_id: string;
  lang: "he" | "en";
  details: {
    ref?: string;
    contact?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    answers: Record<string, any>;
    meta: {
      user_agent: string;
    };
  };
}

export default function PublicQuestionnaire() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [branding, setBranding] = useState<any>(null);
  const [schema, setSchema] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  
  const lang = (searchParams.get("lang") as "he" | "en") || "he";
  const ref = searchParams.get("ref") || "";
  
  const isRTL = lang === "he";
  const dir = isRTL ? "rtl" : "ltr";

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    };
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [b, q] = await Promise.all([
          rpcGetPublicBranding(token),
          rpcGetPublicQuestionnaire(token),
        ]);
        if (!mounted) return;
        setBranding(b);
        setSchema(q);
      } catch (e) {
        console.error(e);
        safeToast({ title: "השאלון לא נמצא", description: "ודאי שפורסם ויש טוקן" });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    }
  }, [token]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleContactChange = (field: string, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await rpcSubmitResponse({ 
        token_or_uuid: token, 
        answers, 
        email: contact.email || undefined, 
        phone: contact.phone || undefined, 
        lang, 
        channel: "landing" 
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      safeToast({ title: "שגיאה בשליחה", description: "נסי שוב" });
    }
  }

  const switchLanguage = (newLang: "he" | "en") => {
    const params = new URLSearchParams(searchParams);
    params.set("lang", newLang);
    navigate(`?${params.toString()}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">{lang === "he" ? "טוען..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={dir}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {branding?.brand_logo_url && (
            <img 
              src={branding.brand_logo_url} 
              alt="Logo" 
              className="h-16 mx-auto mb-6"
            />
          )}
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            {lang === "he" ? "תודה רבה!" : "Thank You!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "he" 
              ? "התשובה שלך נשלחה בהצלחה. נציג יצור איתך קשר בקרוב." 
              : "Your response has been submitted successfully. A representative will contact you soon."}
          </p>
          <Button 
            onClick={() => window.close()}
            className="w-full"
          >
            {lang === "he" ? "סגור" : "Close"}
          </Button>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">
            {lang === "he" ? "שאלון לא נמצא" : "Questionnaire not found"}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {branding?.brand_logo_url && (
              <img 
                src={branding.brand_logo_url} 
                alt="Logo" 
                className="h-12"
              />
            )}
            <div>
              <h1 className="text-xl font-semibold">{schema?.title}</h1>
              {schema?.description && (
                <p className="text-gray-600 text-sm">{schema.description}</p>
              )}
            </div>
          </div>
          
          {/* Language Switcher */}
          <div className="flex space-x-2">
            <Button
              variant={lang === "he" ? "default" : "outline"}
              size="sm"
              onClick={() => switchLanguage("he")}
            >
              עברית
            </Button>
            <Button
              variant={lang === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => switchLanguage("en")}
            >
              English
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">
              {lang === "he" ? "פרטי קשר" : "Contact Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === "he" ? "שם מלא" : "Full Name"}
                </label>
                <Input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleContactChange("name", e.target.value)}
                  placeholder={lang === "he" ? "הכנס את שמך" : "Enter your name"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === "he" ? "אימייל" : "Email"}
                </label>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange("email", e.target.value)}
                  placeholder={lang === "he" ? "הכנס את האימייל שלך" : "Enter your email"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === "he" ? "טלפון" : "Phone"}
                </label>
                <Input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => handleContactChange("phone", e.target.value)}
                  placeholder={lang === "he" ? "הכנס את הטלפון שלך" : "Enter your phone"}
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          {schema?.questions?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                {lang === "he" ? "שאלות" : "Questions"}
              </h2>
              <div className="space-y-6">
                {schema.questions.map((question: Question) => (
                  <div key={question.id} className="space-y-3">
                    <label className="block text_sm font-medium text-gray-700">
                      {question.text}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    
                    {question.type === "text" && (
                      <Input
                        type="text"
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        required={question.required}
                        placeholder={lang === "he" ? "הכנס תשובה" : "Enter your answer"}
                      />
                    )}
                    
                    {question.type === "textarea" && (
                      <Textarea
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        required={question.required}
                        placeholder={lang === "he" ? "הכנס תשובה מפורטת" : "Enter detailed answer"}
                        rows={4}
                      />
                    )}
                    
                    {question.type === "select" && question.options && (
                      <select
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        required={question.required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">
                          {lang === "he" ? "בחר אפשרות" : "Select an option"}
                        </option>
                        {question.options.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {question.type === "radio" && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, index) => (
                          <label key={index} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={answers[question.id] === option}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              required={question.required}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === "checkbox" && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, index) => (
                          <label key={index} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              value={option}
                              checked={Array.isArray(answers[question.id]) && answers[question.id].includes(option)}
                              onChange={(e) => {
                                const currentAnswers = Array.isArray(answers[question.id]) ? answers[question.id] : [];
                                if (e.target.checked) {
                                  handleAnswerChange(question.id, [...currentAnswers, option]);
                                } else {
                                  handleAnswerChange(question.id, currentAnswers.filter(a => a !== option));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="px-8 py-3"
              style={{
                backgroundColor: branding?.brand_primary_color || undefined
              }}
            >
              {lang === "he" ? "שלח תשובה" : "Submit Response"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
 