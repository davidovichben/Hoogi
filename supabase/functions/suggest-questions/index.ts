import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ok = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" }});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SuggestQuestionsRequest {
  businessName: string;
  occupation: string;
  suboccupation?: string;
  other_text?: string;
  links?: string;
  language: string;
  max?: number;
  prompt_override?: string;
  __debug?: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'single_choice' | 'multiple_choice' | 'rating' | 'date' | 'email' | 'phone';
  options?: string[];
  isRequired: boolean;
}

// שאלות מוצעות לפי תחום עסקי
const QUESTION_TEMPLATES: Record<string, Question[]> = {
  // עריכת דין
  "עריכת דין": [
    {
      id: "lawyer-1",
      text: "מה סוג הבעיה המשפטית שלך?",
      type: "single_choice",
      options: ["דיני עבודה", "מקרקעין", "דיני משפחה", "מסחרי/חוזים", "אחר"],
      isRequired: true
    },
    {
      id: "lawyer-2",
      text: "מתי התרחשה הבעיה?",
      type: "date",
      isRequired: false
    },
    {
      id: "lawyer-3",
      text: "האם יש לך מסמכים רלוונטיים?",
      type: "single_choice",
      options: ["כן", "לא", "חלקית"],
      isRequired: false
    }
  ],
  
  // ראיית חשבון
  "ראיית חשבון / הנהלת חשבונות": [
    {
      id: "accountant-1",
      text: "איזה סוג שירות אתה צריך?",
      type: "single_choice",
      options: ["דוחות שנתיים", "חשבות שכר", "פתיחת עוסק", "ייעוץ מס", "אחר"],
      isRequired: true
    },
    {
      id: "accountant-2",
      text: "מה סוג העסק שלך?",
      type: "single_choice",
      options: ["עוסק פטור", "עוסק מורשה", "חברה", "עמותה", "אחר"],
      isRequired: true
    },
    {
      id: "accountant-3",
      text: "מה ההכנסה השנתית המשוערת?",
      type: "single_choice",
      options: ["עד 100,000 ₪", "100,000-500,000 ₪", "500,000-1,000,000 ₪", "מעל 1,000,000 ₪"],
      isRequired: false
    }
  ],

  // ביטוח
  "ביטוח": [
    {
      id: "insurance-1",
      text: "איזה סוג ביטוח אתה מחפש?",
      type: "single_choice",
      options: ["בריאות וסיעוד", "חיים ופיננסים", "רכב ודירות", "עסקים", "אחר"],
      isRequired: true
    },
    {
      id: "insurance-2",
      text: "מה הגיל שלך?",
      type: "single_choice",
      options: ["18-30", "31-45", "46-60", "מעל 60"],
      isRequired: false
    },
    {
      id: "insurance-3",
      text: "מה התקציב החודשי שלך לביטוח?",
      type: "single_choice",
      options: ["עד 200 ₪", "200-500 ₪", "500-1000 ₪", "מעל 1000 ₪"],
      isRequired: false
    }
  ],

  // נדל"ן
  "נדל״ן ושיווק פרויקטים": [
    {
      id: "realestate-1",
      text: "איזה סוג נכס אתה מחפש?",
      type: "single_choice",
      options: ["דירה", "בית פרטי", "משרד", "מחסן", "אחר"],
      isRequired: true
    },
    {
      id: "realestate-2",
      text: "מה התקציב שלך?",
      type: "single_choice",
      options: ["עד 500,000 ₪", "500,000-1,000,000 ₪", "1,000,000-2,000,000 ₪", "מעל 2,000,000 ₪"],
      isRequired: true
    },
    {
      id: "realestate-3",
      text: "באיזה אזור אתה מעוניין?",
      type: "text",
      isRequired: false
    }
  ],

  // בנייה ושיפוצים
  "בנייה ושיפוצים": [
    {
      id: "construction-1",
      text: "איזה סוג עבודה אתה צריך?",
      type: "single_choice",
      options: ["שיפוץ מלא", "שיפוץ חלקי", "עבודות חשמל", "עבודות אינסטלציה", "אחר"],
      isRequired: true
    },
    {
      id: "construction-2",
      text: "מה גודל הפרויקט?",
      type: "single_choice",
      options: ["עד 50 מ״ר", "50-100 מ״ר", "100-200 מ״ר", "מעל 200 מ״ר"],
      isRequired: false
    },
    {
      id: "construction-3",
      text: "מתי אתה רוצה להתחיל?",
      type: "single_choice",
      options: ["מיד", "תוך חודש", "תוך 3 חודשים", "לא דחוף"],
      isRequired: false
    }
  ],

  // רפואה וקליניקות
  "רפואה וקליניקות": [
    {
      id: "medical-1",
      text: "איזה סוג טיפול אתה מחפש?",
      type: "single_choice",
      options: ["פיזיותרפיה", "דנטלי", "רפואה משלימה", "תזונה", "אחר"],
      isRequired: true
    },
    {
      id: "medical-2",
      text: "מה הבעיה הרפואית?",
      type: "text",
      isRequired: false
    },
    {
      id: "medical-3",
      text: "האם יש לך הפניה מרופא?",
      type: "single_choice",
      options: ["כן", "לא"],
      isRequired: false
    }
  ],

  // כושר ולייפסטייל
  "כושר ולייפסטייל": [
    {
      id: "fitness-1",
      text: "איזה סוג אימון אתה מעדיף?",
      type: "single_choice",
      options: ["יוגה", "פילאטיס", "אימון אישי", "קבוצות", "אחר"],
      isRequired: true
    },
    {
      id: "fitness-2",
      text: "מה רמת הכושר שלך?",
      type: "single_choice",
      options: ["מתחיל", "בינוני", "מתקדם"],
      isRequired: false
    },
    {
      id: "fitness-3",
      text: "מה המטרה שלך?",
      type: "single_choice",
      options: ["ירידה במשקל", "עלייה במשקל", "חיזוק שרירים", "גמישות", "אחר"],
      isRequired: false
    }
  ],

  // יופי וקוסמטיקה
  "יופי וקוסמטיקה": [
    {
      id: "beauty-1",
      text: "איזה סוג טיפול אתה מעוניין בו?",
      type: "single_choice",
      options: ["קוסמטיקה רפואית", "עיצוב שיער", "ציפורניים", "איפור", "אחר"],
      isRequired: true
    },
    {
      id: "beauty-2",
      text: "מה התקציב שלך?",
      type: "single_choice",
      options: ["עד 200 ₪", "200-500 ₪", "500-1000 ₪", "מעל 1000 ₪"],
      isRequired: false
    },
    {
      id: "beauty-3",
      text: "מתי נוח לך?",
      type: "single_choice",
      options: ["בוקר", "צהריים", "אחר הצהריים", "ערב"],
      isRequired: false
    }
  ],

  // צילום וקריאייטיב
  "צילום וקריאייטיב": [
    {
      id: "photography-1",
      text: "איזה סוג צילום אתה צריך?",
      type: "single_choice",
      options: ["עסקים/תדמית", "אירועים", "משפחות", "וידאו", "אחר"],
      isRequired: true
    },
    {
      id: "photography-2",
      text: "מתי האירוע?",
      type: "date",
      isRequired: false
    },
    {
      id: "photography-3",
      text: "כמה אנשים יהיו?",
      type: "single_choice",
      options: ["1-5", "6-20", "21-50", "מעל 50"],
      isRequired: false
    }
  ],

  // מסעדנות וקייטרינג
  "מסעדנות וקייטרינג": [
    {
      id: "catering-1",
      text: "איזה סוג שירות אתה צריך?",
      type: "single_choice",
      options: ["מסעדה", "קייטרינג אירועים", "מאפים", "שף פרטי", "אחר"],
      isRequired: true
    },
    {
      id: "catering-2",
      text: "כמה אנשים?",
      type: "single_choice",
      options: ["עד 10", "10-25", "25-50", "מעל 50"],
      isRequired: true
    },
    {
      id: "catering-3",
      text: "מתי האירוע?",
      type: "date",
      isRequired: false
    }
  ],

  // איקומרס וסחר
  "איקומרס וסחר": [
    {
      id: "ecommerce-1",
      text: "איזה סוג חנות אתה רוצה?",
      type: "single_choice",
      options: ["Shopify", "WooCommerce", "אמזון", "אי-ביי", "אחר"],
      isRequired: true
    },
    {
      id: "ecommerce-2",
      text: "מה סוג המוצרים?",
      type: "text",
      isRequired: false
    },
    {
      id: "ecommerce-3",
      text: "מה התקציב שלך?",
      type: "single_choice",
      options: ["עד 5,000 ₪", "5,000-15,000 ₪", "15,000-50,000 ₪", "מעל 50,000 ₪"],
      isRequired: false
    }
  ],

  // שיווק וייעוץ עסקי
  "שיווק וייעוץ עסקי": [
    {
      id: "marketing-1",
      text: "איזה סוג שירות אתה צריך?",
      type: "single_choice",
      options: ["אסטרטגיית שיווק", "קמפיינים ממומנים", "ניהול סושיאל", "אוטומציות", "אחר"],
      isRequired: true
    },
    {
      id: "marketing-2",
      text: "מה התקציב החודשי?",
      type: "single_choice",
      options: ["עד 2,000 ₪", "2,000-5,000 ₪", "5,000-15,000 ₪", "מעל 15,000 ₪"],
      isRequired: false
    },
    {
      id: "marketing-3",
      text: "מה המטרה שלך?",
      type: "single_choice",
      options: ["יותר לידים", "יותר מכירות", "יותר מודעות", "שיפור תדמית", "אחר"],
      isRequired: false
    }
  ],

  // שירותי תוכנה/IT
  "שירותי תוכנה/IT": [
    {
      id: "software-1",
      text: "איזה סוג פיתוח אתה צריך?",
      type: "single_choice",
      options: ["אתר", "אפליקציה", "DevOps", "תמיכת IT", "אחר"],
      isRequired: true
    },
    {
      id: "software-2",
      text: "מה התקציב?",
      type: "single_choice",
      options: ["עד 10,000 ₪", "10,000-50,000 ₪", "50,000-200,000 ₪", "מעל 200,000 ₪"],
      isRequired: false
    },
    {
      id: "software-3",
      text: "מתי אתה רוצה להתחיל?",
      type: "single_choice",
      options: ["מיד", "תוך חודש", "תוך 3 חודשים", "לא דחוף"],
      isRequired: false
    }
  ],

  // חינוך והכשרות
  "חינוך והכשרות": [
    {
      id: "education-1",
      text: "איזה סוג הכשרה אתה מחפש?",
      type: "single_choice",
      options: ["קורסים עסקיים", "שיעורים פרטיים", "הדרכות דיגיטל", "למידה ארגונית", "אחר"],
      isRequired: true
    },
    {
      id: "education-2",
      text: "מה רמת הידע שלך?",
      type: "single_choice",
      options: ["מתחיל", "בינוני", "מתקדם"],
      isRequired: false
    },
    {
      id: "education-3",
      text: "כמה זמן יש לך?",
      type: "single_choice",
      options: ["עד שעה בשבוע", "2-5 שעות בשבוע", "מעל 5 שעות בשבוע"],
      isRequired: false
    }
  ],

  // רכב ותחבורה
  "רכב ותחבורה": [
    {
      id: "automotive-1",
      text: "איזה סוג שירות אתה צריך?",
      type: "single_choice",
      options: ["מוסך", "דיטיילינג", "טרייד-אין", "השכרת רכבים", "אחר"],
      isRequired: true
    },
    {
      id: "automotive-2",
      text: "מה סוג הרכב?",
      type: "text",
      isRequired: false
    },
    {
      id: "automotive-3",
      text: "מה הבעיה?",
      type: "text",
      isRequired: false
    }
  ],

  // תיירות ואירוח
  "תיירות ואירוח": [
    {
      id: "tourism-1",
      text: "איזה סוג שירות אתה מחפש?",
      type: "single_choice",
      options: ["צימרים", "סיורים", "סוכנות נסיעות", "ארגון אירועים", "אחר"],
      isRequired: true
    },
    {
      id: "tourism-2",
      text: "כמה אנשים?",
      type: "single_choice",
      options: ["1-2", "3-6", "7-15", "מעל 15"],
      isRequired: false
    },
    {
      id: "tourism-3",
      text: "מתי?",
      type: "date",
      isRequired: false
    }
  ],

  // עמותות ומלכ"רים
  "עמותות ומלכ\"רים": [
    {
      id: "nonprofit-1",
      text: "איזה סוג שירות אתה צריך?",
      type: "single_choice",
      options: ["גיוס תרומות", "ניהול מתנדבים", "פרויקטים קהילתיים", "קמפיינים ציבוריים", "אחר"],
      isRequired: true
    },
    {
      id: "nonprofit-2",
      text: "מה גודל הארגון?",
      type: "single_choice",
      options: ["עד 10 אנשים", "10-50 אנשים", "50-200 אנשים", "מעל 200 אנשים"],
      isRequired: false
    },
    {
      id: "nonprofit-3",
      text: "מה התקציב?",
      type: "single_choice",
      options: ["עד 10,000 ₪", "10,000-50,000 ₪", "50,000-200,000 ₪", "מעל 200,000 ₪"],
      isRequired: false
    }
  ]
};

// פונקציה לבניית פרומט ברירת מחדל
function buildPrompt(payload: SuggestQuestionsRequest): string {
  const { businessName, occupation, suboccupation, other_text, links, language = 'he' } = payload;
  
  return `אתה יועץ UX וכתיבת שאלונים.
קלט:
- שם עסק: ${businessName}
- תחום תעסוקה: ${occupation}
- תת תחום/התמחות: ${suboccupation || 'כללי'}
- מידע נוסף: ${other_text || '—'}
- קישורים/מקורות: ${links || '—'}

מטרה:
צור שאלון של 5–7 שאלות מותאם ללקוחות פונים, כך שהשאלות יסייעו לבעל העסק להבין את הצורך והעדפות הלקוח.

דרישות:
1. לכל שאלה ציין סוג ["בחירה יחידה","בחירה מרובה","שדה טקסט חופשי","כן/לא"] ואם זו בחירה – לפחות 3 אופציות קצרות.
2. ניסוח ידידותי וברור, מותאם לנייד.
3. אם חסר מידע – שאלות כלליות אך שימושיות.

פלט נדרש:
רשימת שאלות (מחרוזות) בלבד.`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    const max = Math.min(Math.max(payload.max ?? 5, 2), 6);
    payload.max = max;

    console.log("[AI] prompt_override preview:", (payload as any).prompt_override?.slice(0, 160));

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
    const GEMINI_MODEL   = Deno.env.get("GEMINI_MODEL")   || "gemini-1.5-flash";
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

    // 👇👇👇 השורה החשובה: אם יש prompt_override – הוא מנצח; אחרת buildPrompt.
    const prompt: string =
      (typeof payload.prompt_override === "string" && payload.prompt_override.trim())
        ? payload.prompt_override.trim()
        : buildPrompt(payload);

    const prompt_used = prompt;

    console.log("[suggest-questions] using prompt:", prompt_used.slice(0, 200));

    const { businessName, occupation, suboccupation, other_text, links, language = 'he' }: SuggestQuestionsRequest = payload

    if (!businessName || !occupation) {
      return new Response(
        JSON.stringify({ error: 'businessName and occupation are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // אם יש prompt_override, נשתמש ב-AI
    if (typeof payload.prompt_override === "string" && payload.prompt_override.trim()) {
      try {
        let aiResponse;
        
        if (GEMINI_API_KEY) {
          // Gemini API
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000,
              }
            })
          });
          
          const geminiData = await geminiResponse.json();
          aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else if (OPENAI_API_KEY) {
          // OpenAI API
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{
                role: 'user',
                content: prompt
              }],
              max_tokens: 1000,
              temperature: 0.2
            })
          });
          
          const openaiData = await openaiResponse.json();
          aiResponse = openaiData.choices?.[0]?.message?.content || "";
        } else {
          throw new Error('No AI API key configured');
        }

        // נסה לחלץ JSON מהתגובה
        let questions: any[] = [];
        try {
          // נסה למצוא JSON בתגובה (אובייקט או מערך)
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // אם זה אובייקט עם מאפיין questions, קח אותו
            if (parsed.questions && Array.isArray(parsed.questions)) {
              questions = parsed.questions;
            }
            // אם זה מערך ישירות, השתמש בו
            else if (Array.isArray(parsed)) {
              questions = parsed;
            }
          } else {
            // אם לא נמצא JSON, נסה לחלק לפי שורות
            questions = aiResponse.split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('-'))
              .slice(0, max)
              .map(text => ({ text, type: 'text', isRequired: false }));
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // fallback: חלוקה לפי שורות
          questions = aiResponse.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('-'))
            .slice(0, max)
            .map(text => ({ text, type: 'text', isRequired: false }));
        }

        if (payload.__debug) return ok({ questions, prompt_used });
        return ok({ questions });
      } catch (aiError) {
        console.error('AI Error:', aiError);
        // fallback לשאלות מוכנות
      }
    }

    // שאלות מוכנות (fallback או כשאין prompt_override)
    let questions: Question[] = [];
    
    if (QUESTION_TEMPLATES[occupation]) {
      questions = QUESTION_TEMPLATES[occupation];
    } else {
      // שאלות כלליות אם לא נמצא התחום
      questions = [
        {
          id: "general-1",
          text: language === 'he' ? "מה השם שלך?" : "What is your name?",
          type: "text",
          isRequired: true
        },
        {
          id: "general-2",
          text: language === 'he' ? "מה המייל שלך?" : "What is your email?",
          type: "email",
          isRequired: true
        },
        {
          id: "general-3",
          text: language === 'he' ? "מה הטלפון שלך?" : "What is your phone number?",
          type: "phone",
          isRequired: false
        },
        {
          id: "general-4",
          text: language === 'he' ? "איך שמעת עלינו?" : "How did you hear about us?",
          type: "single_choice",
          options: language === 'he'
            ? ["חיפוש בגוגל", "רשתות חברתיות", "המלצה", "פרסום", "אחר"]
            : ["Google Search", "Social Media", "Recommendation", "Advertisement", "Other"],
          isRequired: false
        }
      ];
    }

    // הגבל למספר המבוקש
    const limitedQuestions = questions.slice(0, max);

    // הוסף ID ייחודי לכל שאלה
    const questionsWithIds = limitedQuestions.map((q, index) => ({
      ...q,
      id: `${occupation.toLowerCase().replace(/\s+/g, '-')}-${index + 1}-${Date.now()}`
    }));

    if (payload.__debug) return ok({ questions: questionsWithIds, prompt_used });
    return ok({ questions: questionsWithIds });

  } catch (error) {
    console.error('Error in suggest-questions function:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
