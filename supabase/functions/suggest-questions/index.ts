// 🔹 גרסת Edge Function יציבה ומלאה
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- הגדרות בסיסיות ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// --- חיבור לסופרבייס ---
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

// --- Gemini API ---
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const MODELS_TO_TRY = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

// --- פונקציה עיקרית ---
serve(async (req)=>{
  // טיפול בבקשת OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      businessName,
      occupation,
      suboccupation,
      other_text,
      links,
      language = 'he',
      max = 7,
      prompt_override
    } = body;

    // --- אימות שדות חובה ---
    const topic = suboccupation?.trim() || occupation?.trim() || other_text?.trim();
    if (!topic) {
      return new Response(JSON.stringify({
        error: "חובה לציין occupation, suboccupation או other_text"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- יצירת הפרומפט ---
    const prompt = prompt_override || `
צור ${max} שאלות ${language === 'he' ? 'בעברית' : 'באנגלית'} לשאלון לידים.

חשוב: אל תכלול שאלות על שם, אימייל או טלפון - הן כבר קיימות בטופס.
התמקד בשאלות מותאמות לעיסוק ותת-תחום שיעזרו להבין את צרכי הלקוח.
עבור שאלות בחירה, כלול 3-4 אופציות.

החזר JSON בלבד בפורמט זה:
{
  "questions": [
    { "text": "מה השירות שאתה מחפש?", "type": "single_choice", "options": ["אופציה 1", "אופציה 2", "אופציה 3", "אחר"], "isRequired": false },
    { "text": "מתי תרצה להתחיל?", "type": "single_choice", "options": ["מיידי", "תוך שבוע", "תוך חודש", "לא בטוח"], "isRequired": false }
  ]
}

סוגי שאלות אפשריים: text, single_choice, multiple_choice, yes_no, date, textarea

פרטי העסק:
שם העסק: ${businessName || 'לא צוין'}
תחום עיקרי: ${occupation || 'לא צוין'}
תת-תחום: ${suboccupation || topic}
${other_text ? `מידע נוסף: ${other_text}` : ''}

${links ? `קישורים/מסמכים: ${links}` : ''}
`;

    // --- קריאה למודל ---
    let rawText = "[]";

    for (const model of MODELS_TO_TRY) {
      try {
        console.log('[suggest-questions] Trying Gemini model:', model);

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.6,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 2048,
            }
          })
        });

        const geminiData = await geminiResponse.json();
        console.log('[suggest-questions] Response from', model, ':', JSON.stringify(geminiData).substring(0, 300));

        if (geminiData.error) {
          console.log('[suggest-questions] Model failed:', model, geminiData.error.message);
          continue; // Try next model
        }

        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (responseText) {
          console.log('[suggest-questions] Successfully used model:', model);
          rawText = responseText;
          break; // Success, exit loop
        }
      } catch (e) {
        console.log('[suggest-questions] Exception with model:', model, e.message);
        continue; // Try next model
      }
    }

    // --- ניסיון לפענח את ה־JSON ---
    let questions = [];
    try {
      // Try to extract JSON object or array from the response
      const jsonMatch = rawText.match(/\{[\s\S]*"questions"[\s\S]*\}/) || rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Handle both formats: {"questions": [...]} or [...]
        questions = parsed.questions || parsed;
      } else {
        console.warn("[WARN] לא נמצא JSON תקין, משתמש בשאלות ברירת מחדל.");
        questions = [
          { text: `מה השירות שאתה מחפש בתחום ${topic}?`, type: "single_choice", options: ["שירות מלא", "ייעוץ בלבד", "עדיין מתלבט", "אחר"], isRequired: false },
          { text: "מתי תרצה להתחיל?", type: "single_choice", options: ["מיידי", "תוך שבוע", "תוך חודש", "לא בטוח"], isRequired: false },
          { text: "מה הכי חשוב לך?", type: "single_choice", options: ["מחיר", "איכות", "זמינות", "ניסיון", "אחר"], isRequired: false }
        ];
      }
    } catch (e) {
      console.error("[ERROR] JSON parse failed:", e);
      questions = [
        { text: `מה השירות שאתה מחפש בתחום ${topic}?`, type: "single_choice", options: ["שירות מלא", "ייעוץ בלבד", "עדיין מתלבט", "אחר"], isRequired: false },
        { text: "מתי תרצה להתחיל?", type: "single_choice", options: ["מיידי", "תוך שבוע", "תוך חודש", "לא בטוח"], isRequired: false },
        { text: "מה הכי חשוב לך?", type: "single_choice", options: ["מחיר", "איכות", "זמינות", "ניסיון", "אחר"], isRequired: false }
      ];
    }

    // --- וידוא שכל שאלה תקינה ---
    // Filter out name, email, phone questions
    const filteredQuestions = questions.filter((q) => {
      const text = (q.text || q.question || '').toLowerCase();
      const type = (q.type || '').toLowerCase();

      // Skip if type is email or phone
      if (type === 'email' || type === 'phone') return false;

      // Skip if text contains common name/email/phone patterns
      const skipPatterns = [
        'שם', 'name', 'full name', 'שם מלא',
        'אימייל', 'email', 'אי-מייל', 'מייל',
        'טלפון', 'phone', 'מספר', 'נייד', 'פלאפון'
      ];

      for (const pattern of skipPatterns) {
        if (text.includes(pattern)) return false;
      }

      return q.text || q.question;
    });

    const validQuestions = filteredQuestions.map((q, i)=>({
        id: `${topic.replace(/\s+/g, "-")}-${i + 1}-${Date.now()}`,
        text: q.text || q.question,
        type: q.type || "text",
        options: q.options || undefined,
        isRequired: q.isRequired !== undefined ? q.isRequired : false
      })).slice(0, max);

    // --- שמירה לטבלת Supabase ---
    // 1. Create questionnaire
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from("questionnaires")
      .insert({
        title: businessName || topic,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (questionnaireError) throw questionnaireError;

    // 2. Create questions in the questions table
    const questionsToInsert = validQuestions.map((q, index) => ({
      questionnaire_id: questionnaire.id,
      question_text: q.text,
      label: q.text,
      question_type: q.type,
      is_required: q.isRequired,
      order_index: index + 1
    }));

    const { data: insertedQuestions, error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert)
      .select();

    if (questionsError) throw questionsError;

    // 3. Create question options for choice-type questions
    const optionsToInsert = [];
    for (let i = 0; i < validQuestions.length; i++) {
      const question = validQuestions[i];
      const insertedQuestion = insertedQuestions[i];

      if (question.options && insertedQuestion) {
        question.options.forEach((option, optionIndex) => {
          optionsToInsert.push({
            question_id: insertedQuestion.id,
            value: option,
            label: option,
            order_index: optionIndex + 1
          });
        });
      }
    }

    if (optionsToInsert.length > 0) {
      const { error: optionsError } = await supabase
        .from("question_options")
        .insert(optionsToInsert);

      if (optionsError) console.error("[WARN] Error inserting options:", optionsError);
    }

    // --- תשובה סופית ---
    // Format questions to match frontend expectations
    const formattedQuestions = insertedQuestions.map((q, index) => {
      const originalQuestion = validQuestions[index];
      return {
        id: q.id,
        text: q.question_text,
        type: q.question_type,
        isRequired: q.is_required,
        options: originalQuestion.options || undefined
      };
    });

    return new Response(JSON.stringify({
      success: true,
      questionnaire_id: questionnaire.id,
      title: questionnaire.title,
      questions: formattedQuestions
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("[Edge Function Error]:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "שגיאת שרת פנימית"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
