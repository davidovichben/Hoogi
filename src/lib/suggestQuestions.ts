// /src/lib/suggestQuestions.ts
export type AiQuestion = {
  text: string;
  type: "text" | "yes_no" | "single" | "multi" | "single_choice" | "multiple_choice" | "date" | "email" | "phone";
  options?: string[];
  isRequired?: boolean;
};

export type ProfileForAI = {
  businessName?: string;
  occupation?: string;
  suboccupation?: string;
  email?: string;
  phone?: string;
  links?: string[];
  extra?: string;
};

function buildPromptOverride(profile: ProfileForAI, locale: "he" | "en" | "fr" = "he"): string {
  const businessName = (profile.businessName || "").trim();
  const occupation = (profile.occupation || "").trim();
  const suboccupation = (profile.suboccupation || "").trim();
  const otherText = (profile.extra || "").trim();
  const linksText = (profile.links || []).filter(Boolean).join(", ");

  // Prompt authored in Hebrew per requirement
  return `אתה מומחה UX ושיווק שמפתח שאלוני לידים שיווקיים קצרים ללקוחות קצה.

🔹 הנתונים שאתה מקבל שייכים לנותן השירות – לדוגמה: עורך דין חוזים, מאמן אישי, סוכן נדל"ן וכו'.

🔹 המטרה: ליצור שאלון קצר (5–7 שאלות) שנועד ללקוח הקצה שמתעניין בשירות – כדי להבין מה הוא צריך, לחזק אמון ולעודד אותו להשאיר פרטים.

---

## 🧠 איך לזהות מהו תחום השירות:

עליך לפעול לפי ההיררכיה הבאה:

1. ✅ אם קיים גם **תחום** (${occupation || "—"}) וגם **תת תחום** (${suboccupation || "—"}) –  
   ➜ השתמש ב־**תת התחום כקובע עיקרי** לנושא השאלון.  
   ➜ התחום הכללי משמש רק להקשר.

2. ✅ אם **אין תת תחום** או שהוא ריק/שווה ל־"אחר" –  
   ➜ השתמש בטקסט שנמצא בשדה otherText (טקסט חופשי שהוזן ע"י המשתמש): ${otherText || "—"}.

3. ✅ אם **גם התחום וגם תת התחום ריקים** ונבחר "אחר" –  
   ➜ התייחס ל־otherText כתחום השירות המרכזי.

4. ✅ אם קיימים קישורים (${linksText || "—"}) שמהם ניתן **לקרוא תוכן ברור במהירות** (כמו אתר/רשתות חברתיות) –  
   ➜ תוכל להשתמש בהם **רק כדי לחדד ולהעשיר** את ההבנה, אך לא כתחליף לשדות מ־1–3.

5. ❌ אם לא ניתן לקרוא את התוכן של הקישורים (הם חסומים או ריקים) –  
   ➜ פשוט התעלם מהם והמשך כרגיל לפי הסדר לעיל.  
   ➜ אין להפסיק את הפעולה בשום שלב גם אם מידע חסר.

---

## ⛔ אל תשאל את נותן השירות שום דבר.  
❌ לא לשאול: "מה ההתמחות שלך?", "כמה שנים אתה בתחום?", "מה סגנון השירות שלך?" וכו'.

---

## ✅ כן לשאול את הלקוח הקצה:
שאלות כמו:
- מה הוא צריך?
- איזה סוג שירות מחפש?
- מה חשוב לו?
- מה לוח הזמנים?
- האם הייתה לו חוויה דומה בעבר?

---

## 📌 פורמט הפלט:
- מערך של 5–7 שאלות בפורמט JSON תקני בלבד
- **חובה לכלול לפחות:**
  - שאלה אחת מסוג "בחירה מרובה" (עם לפחות 3 אופציות)
  - שאלה אחת מסוג "בחירה יחידה" (עם לפחות 3 אופציות)  
  - שאלה אחת מסוג "כן/לא"
- שאר השאלות יכולות להיות "שדה טקסט חופשי" או סוגים אחרים
- כל שאלה תכיל:
  - \`type\`: "בחירה יחידה" / "בחירה מרובה" / "כן/לא" / "שדה טקסט חופשי"
  - \`text\`: נוסח השאלה
  - \`options\`: אם זו שאלה לבחירה – עד 5 אופציות קצרות ומושכות

---

## 📥 דוגמה:

\`\`\`json
[
  {
    "type": "בחירה יחידה",
    "text": "איזה סוג חוזה אתה צריך?",
    "options": ["חוזה שכירות", "חוזה עבודה", "חוזה שותפות", "חוזה שירותים", "אחר"]
  },
  {
    "type": "כן/לא",
    "text": "האם כבר ניסחת חוזה בעצמך?"
  },
  {
    "type": "בחירה מרובה",
    "text": "מה חשוב לך בעורך הדין שתבחר?",
    "options": ["ניסיון מקצועי", "יחס אישי", "זמינות מהירה", "מחיר נגיש", "המלצות"]
  },
  {
    "type": "שדה טקסט חופשי",
    "text": "נשמח לדעת עוד על הצורך שלך"
  },
  {
    "type": "בחירה יחידה",
    "text": "מתי אתה צריך את החוזה?",
    "options": ["מיד", "בחודש הקרוב", "בעוד כמה חודשים", "לא דחוף"]
  }
]
\`\`\`

---

### 🧠 רפרנס – ההיררכיה בפורמט קצר:

| תנאי | מה קובע את התחום בפועל |
|------|--------------------------|
| יש תת תחום? | תת התחום הוא הקובע |
| אין תת תחום, יש טקסט "אחר"? | הטקסט (otherText) הוא הקובע |
| אין כלום? | נסה לנתח קישורים — רק אם נגישים וקריאים |

---

שם העסק: ${businessName || "—"}
שפה מועדפת להצגה: ${locale}

**חשוב: חובה לכלול לפחות שאלה אחת מכל סוג: בחירה מרובה, בחירה יחידה, וכן/לא. אל תחזיר רק שאלות טקסט חופשי!**

אנא החזר אך ורק JSON תקני של המערך, ללא הסברים נוספים.`;
}

export async function fetchSuggestedQuestions(
  profile: ProfileForAI,
  opts?: { locale?: "he" | "en" | "fr"; minCore?: number; maxTotal?: number }
): Promise<AiQuestion[]> {
  const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-questions`;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${anon}`,
      "apikey": anon
    },
    body: JSON.stringify({
      businessName: profile.businessName,
      occupation: profile.occupation,
      suboccupation: profile.suboccupation,
      other_text: profile.extra,
      links: (profile.links ?? []).join(", "),
      language: opts?.locale ?? "he",
      max: opts?.maxTotal ?? 7,
      prompt_override: buildPromptOverride(profile, opts?.locale ?? "he")
    })
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`suggest-questions ${res.status}: ${txt}`);
  }

  const data = await res.json().catch(() => ({}));
  const arr = Array.isArray(data?.questions) ? data.questions : [];

  // סניטציה: החזר רק אובייקטים תקינים
  return arr.map((q: any) => {
    const text = (q?.text ?? "").toString().trim();
    if (!text) return null;

    let type = (q?.type ?? "text").toString().toLowerCase();
    if (type === "single") type = "single_choice";
    if (type === "multi")  type = "multiple_choice";
    if (type === "yes_no") { type = "single_choice"; q.options = ["כן","לא"]; }

    const options = Array.isArray(q?.options) ? q.options.filter((o: any) => typeof o === "string" && o.trim()).map((o: string)=>o.trim()) : undefined;
    const isRequired = typeof q?.isRequired === "boolean" ? q.isRequired : false;

    return { text, type, options, isRequired } as AiQuestion;
  }).filter(Boolean);
}