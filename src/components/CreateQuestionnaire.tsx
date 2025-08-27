import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";

// --- תמיכה בדו-שפות מלאה ---
const tr = {
  he: {
    title: "יצירת שאלון חדש",
    name: "שם השאלון",
    category: "קטגוריה",
    language: "שפת השאלון",
    design: "הגדרות עיצוב",
    logo: "לוגו",
    colors: "צבעים",
    primary: "צבע ראשי",
    secondary: "צבע משני", 
    background: "צבע רקע",
    step: "שלב",
    question: "שאלה",
    type: "סוג שאלה",
    required: "חובה",
    options: "אפשרויות",
    addOption: "הוסף אפשרות",
    addQuestion: "הוסף שאלה",
    addStep: "הוסף שלב",
    save: "שמור שאלון",
    cancel: "בטל",
    remove: "מחק",
    placeholder: "טקסט לדוגמה",
    helpText: "טקסט עזרה",
    minLength: "אורך מינימלי",
    maxLength: "אורך מקסימלי",
    allowAudio: "אפשר הקלטה",
    fileTypes: "סוגי קבצים מותרים",
    maxFileSize: "גודל קובץ מקסימלי (MB)",
    ratingScale: "סולם דירוג",
    success: "השאלון נשמר בהצלחה!",
    error: "שגיאה ביצירת השאלון",
    languages: {
      he: "עברית",
      en: "אנגלית", 
      es: "ספרדית",
      fr: "צרפתית",
      ru: "רוסית",
      ar: "ערבית"
    },
    categories: {
      real_estate: "נדל\"ן",
      healthcare: "בריאות",
      education: "חינוך",
      business: "עסקים",
      personal: "אישי",
      other: "אחר"
    },
    questionTypes: {
      text: "טקסט",
      textarea: "תיבת טקסט",
      single_choice: "בחירה יחידה",
      multi_choice: "בחירה מרובה", 
      file: "העלאת קובץ",
      audio: "הקלטה",
      color: "בחירת צבע",
      date: "תאריך",
      rating: "דירוג",
      email: "אימייל",
      phone: "טלפון"
    }
  },
  en: {
    title: "Create New Questionnaire",
    name: "Questionnaire Name",
    category: "Category", 
    language: "Questionnaire Language",
    design: "Design Settings",
    logo: "Logo",
    colors: "Colors",
    primary: "Primary Color",
    secondary: "Secondary Color",
    background: "Background Color", 
    step: "Step",
    question: "Question",
    type: "Question Type",
    required: "Required",
    options: "Options",
    addOption: "Add Option",
    addQuestion: "Add Question",
    addStep: "Add Step", 
    save: "Save Questionnaire",
    cancel: "Cancel",
    remove: "Remove",
    placeholder: "Placeholder Text",
    helpText: "Help Text",
    minLength: "Minimum Length",
    maxLength: "Maximum Length",
    allowAudio: "Allow Audio",
    fileTypes: "Allowed File Types",
    maxFileSize: "Max File Size (MB)",
    ratingScale: "Rating Scale",
    success: "Questionnaire saved successfully!",
    error: "Error creating questionnaire",
    languages: {
      he: "Hebrew",
      en: "English",
      es: "Spanish", 
      fr: "French",
      ru: "Russian",
      ar: "Arabic"
    },
    categories: {
      real_estate: "Real Estate",
      healthcare: "Healthcare",
      education: "Education",
      business: "Business",
      personal: "Personal",
      other: "Other"
    },
    questionTypes: {
      text: "Text Input",
      textarea: "Text Area",
      single_choice: "Single Choice",
      multi_choice: "Multiple Choice",
      file: "File Upload", 
      audio: "Audio Recording",
      color: "Color Picker",
      date: "Date Picker",
      rating: "Rating Scale",
      email: "Email",
      phone: "Phone Number"
    }
  }
};

// --- קטגוריות וסוגי שאלות ---
const CATEGORIES = ["real_estate", "healthcare", "education", "business", "personal", "other"];
const LANGUAGES = ["he", "en", "es", "fr", "ru", "ar"];
const QUESTION_TYPES = ["text", "textarea", "single_choice", "multi_choice", "file", "audio", "color", "date", "rating", "email", "phone"];

interface CreateQuestionnaireProps {
  lang?: "he" | "en";
  userId: string;
  onSuccess?: (questionnaireId: string) => void;
}

export default function CreateQuestionnaire({ lang = "he", userId, onSuccess }: CreateQuestionnaireProps) {
  const t = tr[lang];
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [customizeBrand, setCustomizeBrand] = useState(false);
  const [customizeCategory, setCustomizeCategory] = useState(false);

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      title: { [lang]: "" },
      category: "business",
      language: lang,
      design: {
        colors: {
          primary: "#2C85F7",
          secondary: "#F5A623", 
          background: "#F8F9FA"
        },
        logo_url: ""
      },
      ai_settings: {
        auto_reply_enabled: true,
        reply_prompt: { [lang]: "" }
      },
      steps: [
        {
          title: { [lang]: "" },
          questions: [
            {
              question_text: { [lang]: "" },
              type: "text",
              is_required: false,
              order_num: 1,
              is_active: true,
              placeholder: { [lang]: "" },
              help_text: { [lang]: "" },
              options: []
            }
          ]
        }
      ]
    }
  });

  // משיכת פרופיל למילוי ברירות מחדל
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        // עדכון ברירות מחדל מהפרופיל
        reset((prev:any)=>({
          ...prev,
          category: data.business_category || prev.category,
          design: {
            colors: {
              primary: data.brand_primary || prev.design.colors.primary,
              secondary: data.brand_secondary || prev.design.colors.secondary,
              background: prev.design.colors.background,
            },
            logo_url: data.logo_url || prev.design.logo_url,
          },
        }));
      }
    })();
  }, [reset]);

  const { fields: stepFields, append: addStep, remove: removeStep } = useFieldArray({ 
    control, 
    name: "steps" 
  });

  // --- פונקציה לשמירת שאלון ל-Supabase ---
  async function onSubmit(data: any) {
    setIsSubmitting(true);
    
    try {
      // יצירת מבנה השאלון
      const questionnaireData = {
        title: data.title[data.language] || Object.values(data.title)[0],
        category: customizeCategory ? data.category : (profile?.business_category || data.category),
        user_id: userId,
        owner: userId,
        brand_color: customizeBrand ? data.design.colors.primary : (profile?.brand_primary || data.design.colors.primary),
        logo_url: customizeBrand ? (data.design.logo_url || null) : (profile?.logo_url || data.design.logo_url || null),
        business_category: profile?.business_category || null,
        business_subcategory: profile?.business_subcategory || null,
        business_other: profile?.business_other || null,
        company: profile?.company || null,
        description: `${t.categories[data.category as keyof typeof t.categories]} questionnaire`,
        is_active: true
      };

      // שמירה ב-questionnaires
      const { data: questionnaire, error } = await supabase
        .from("questionnaires")
        .insert([questionnaireData])
        .select()
        .single();

      if (error) throw error;

      // שמירת השאלות
      let globalOrder = 1;
      for (const [stepIndex, step] of data.steps.entries()) {
        for (const [qIndex, question] of step.questions.entries()) {
          const questionData = {
            questionnaire_id: questionnaire.id,
            question_text: question.question_text[data.language] || Object.values(question.question_text)[0],
            question_type: question.type,
            is_required: question.is_required,
            order_index: globalOrder++,
            options: question.options?.length > 0 ? 
              question.options.map((opt: any) => ({
                label: opt.label?.[data.language] || opt.value || opt,
                value: opt.value || opt
              })) : null
          };

          const { error: questionError } = await supabase
            .from("questions")
            .insert([questionData]);

          if (questionError) throw questionError;
        }
      }

      setSuccess(true);
      onSuccess?.(questionnaire.id);

      // איפוס הטופס אחרי 3 שניות
      setTimeout(() => {
        reset();
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error creating questionnaire:', error);
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- קומפוננטת שאלה דינמית ---
  function QuestionField({ stepIndex }: { stepIndex: number }) {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `steps.${stepIndex}.questions`
    });

    return (
      <div className="space-y-4">
        {fields.map((item, qIndex) => {
          const questionType = watch(`steps.${stepIndex}.questions.${qIndex}.type`);
          const needsOptions = ["single_choice", "multi_choice"].includes(questionType);

          return (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h5 className="font-medium text-gray-800">
                  {t.question} {qIndex + 1}
                </h5>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(qIndex)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded"
                  >
                    {t.remove}
                  </button>
                )}
              </div>

              {/* טקסט השאלה */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.question}
                </label>
                <input
                  {...register(`steps.${stepIndex}.questions.${qIndex}.question_text.${lang}`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.question}
                />
              </div>

              {/* סוג השאלה */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.type}
                  </label>
                  <select
                    {...register(`steps.${stepIndex}.questions.${qIndex}.type`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {QUESTION_TYPES.map(type => (
                      <option key={type} value={type}>
                        {t.questionTypes[type as keyof typeof t.questionTypes]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-4 pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register(`steps.${stepIndex}.questions.${qIndex}.is_required`)}
                      className="mr-2"
                    />
                    {t.required}
                  </label>
                </div>
              </div>

              {/* טקסט עזרה וplaceholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.placeholder}
                  </label>
                  <input
                    {...register(`steps.${stepIndex}.questions.${qIndex}.placeholder.${lang}`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder={t.placeholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.helpText}
                  </label>
                  <input
                    {...register(`steps.${stepIndex}.questions.${qIndex}.help_text.${lang}`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder={t.helpText}
                  />
                </div>
              </div>

              {/* אפשרויות לבחירה */}
              {needsOptions && (
                <OptionsField stepIndex={stepIndex} qIndex={qIndex} />
              )}

              {/* הגדרות מתקדמות לקבצים */}
              {questionType === "file" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.fileTypes}
                    </label>
                    <input
                      {...register(`steps.${stepIndex}.questions.${qIndex}.allowed_file_types` as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="pdf,doc,jpg,png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.maxFileSize}
                    </label>
                    <input
                      type="number"
                      {...register(`steps.${stepIndex}.questions.${qIndex}.max_file_size_mb` as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="10"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`steps.${stepIndex}.questions.${qIndex}.allow_audio` as any)}
                        className="mr-2"
                      />
                      {t.allowAudio}
                    </label>
                  </div>
                </div>
              )}

              {/* הגדרות דירוג */}
              {questionType === "rating" && (
                <div className="p-3 bg-gray-50 rounded">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.ratingScale}
                  </label>
                  <select
                    {...register(`steps.${stepIndex}.questions.${qIndex}.rating_scale` as any)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="5">1-5</option>
                    <option value="10">1-10</option>
                  </select>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => append({
            question_text: { [lang]: "" },
            type: "text",
            is_required: false,
            order_num: fields.length + 1,
            is_active: true,
            placeholder: { [lang]: "" },
            help_text: { [lang]: "" },
            options: []
          })}
          className="w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          + {t.addQuestion}
        </button>
      </div>
    );
  }

  // --- UI ראשי ---
  const TopControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="font-medium">{t.category}</label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={customizeCategory} onChange={e=>setCustomizeCategory(e.target.checked)} />
            התאם לשאלון זה
          </label>
        </div>
        <select
          disabled={!customizeCategory}
          {...register('category')}
          className={`border rounded-md h-10 px-2 ${!customizeCategory ? 'bg-muted/30 cursor-not-allowed' : ''}`}
        >
          {CATEGORIES.map((c)=> (
            <option key={c} value={c}>{t.categories[c as keyof typeof t.categories] || c}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="font-medium">{t.design}</label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={customizeBrand} onChange={e=>setCustomizeBrand(e.target.checked)} />
            התאם לשאלון זה
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="text-sm">{t.primary}</label>
            <input type="color" disabled={!customizeBrand} {...register('design.colors.primary')} className="w-full h-10 border rounded" />
          </div>
          <div>
            <label className="text-sm">{t.secondary}</label>
            <input type="color" disabled={!customizeBrand} {...register('design.colors.secondary')} className="w-full h-10 border rounded" />
          </div>
          <div>
            <label className="text-sm">{t.logo}</label>
            <input type="text" disabled={!customizeBrand} {...register('design.logo_url')} placeholder="https://..." className={`w-full h-10 px-2 border rounded ${!customizeBrand ? 'bg-muted/30 cursor-not-allowed' : ''}`} />
          </div>
        </div>
      </div>
    </div>
  );

  // --- קומפוננטת אפשרויות ---
  function OptionsField({ stepIndex, qIndex }: { stepIndex: number; qIndex: number }) {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `steps.${stepIndex}.questions.${qIndex}.options`
    });

    return (
      <div className="p-3 bg-gray-50 rounded">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.options}
        </label>
        <div className="space-y-2">
          {fields.map((item, optIndex) => (
            <div key={item.id} className="flex gap-2">
              <input
                {...register(`steps.${stepIndex}.questions.${qIndex}.options.${optIndex}.label.${lang}`)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder={`${t.options} ${optIndex + 1}`}
              />
              <input
                {...register(`steps.${stepIndex}.questions.${qIndex}.options.${optIndex}.value`)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="value"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(optIndex)}
                  className="px-2 py-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ label: { [lang]: "" }, value: "" })}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + {t.addOption}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={lang === "he" ? "rtl" : "ltr"} className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-blue-50 via-white to-orange-50 rounded-2xl shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-400 rounded-full flex items-center justify-center">
          <span className="text-2xl">🦉</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
          <p className="text-gray-600">מערכת מתקדמת ליצירת שאלונים דינמיים</p>
        </div>
      </div>

      {/* התאמה אישית לשאלון זה (קטגוריה/מיתוג) */}
      <TopControls />

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
          {t.success}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* פרטים בסיסיים */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">פרטים בסיסיים</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
              <input
                {...register(`title.${lang}`, { required: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.name}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
              <select
                {...register("category")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {t.categories[cat as keyof typeof t.categories]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.language}</label>
              <select
                {...register("language")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map(lng => (
                  <option key={lng} value={lng}>
                    {t.languages[lng as keyof typeof t.languages]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* עיצוב */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.logo}</label>
              <input
                {...register("design.logo_url")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.colors}</label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register("design.colors.primary")}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{t.primary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register("design.colors.secondary")}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{t.secondary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register("design.colors.background")}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{t.background}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* שלבים ושאלות */}
        <div className="space-y-6">
          {stepFields.map((step, stepIndex) => (
            <div key={step.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {t.step} {stepIndex + 1}
                </h3>
                {stepFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(stepIndex)}
                    className="text-red-500 hover:text-red-700 px-3 py-1 rounded"
                  >
                    {t.remove} {t.step}
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כותרת {t.step}
                </label>
                <input
                  {...register(`steps.${stepIndex}.title.${lang}`)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`${t.step} ${stepIndex + 1}`}
                />
              </div>

              <QuestionField stepIndex={stepIndex} />
            </div>
          ))}

          <button
            type="button"
            onClick={() => addStep({
              title: { [lang]: "" },
              questions: [{
                question_text: { [lang]: "" },
                type: "text",
                is_required: false,
                order_num: 1,
                is_active: true,
                placeholder: { [lang]: "" },
                help_text: { [lang]: "" },
                options: []
              }]
            })}
            className="w-full px-6 py-4 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-lg font-medium"
          >
            + {t.addStep}
          </button>
        </div>

        {/* הגדרות AI */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">הגדרות תשובות אוטומטיות</h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register("ai_settings.auto_reply_enabled")}
                className="mr-2"
              />
              <span>הפעל תשובות AI אוטומטיות</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                הנחיות למערכת ה-AI
              </label>
              <textarea
                {...register(`ai_settings.reply_prompt.${lang}`)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="תן תשובה מקצועית ומועילה בהתבסס על נתוני הלקוח..."
              />
            </div>
          </div>
        </div>

        {/* כפתור שמירה */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-orange-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "שומר..." : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}