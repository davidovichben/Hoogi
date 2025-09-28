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

🔹 הנתונים שאתה מקבל שייכים לנותן השירות (לדוגמה: ${occupation || "עו"} / ${suboccupation || "התמחות"}).
🔹 המטרה: ליצור שאלון קצר (5–7 שאלות) ללקוח הקצה כדי להבין צורך, לחזק אמון ולעודד השארת פרטים.

איך לזהות תחום השירות (היררכיה):
1) אם יש תת תחום – הוא הקובע העיקרי. התחום הכללי רק להקשר.
2) אם אין תת תחום או שהוא "אחר" – השתמש בטקסט otherText: ${otherText || "—"}.
3) אם גם תחום וגם תת תחום ריקים – התייחס ל‑otherText כתחום.
4) אם יש קישורים שימושיים – אפשר להיעזר בהם להקשר בלבד: ${linksText || "—"}.
5) אם לא ניתן לקרוא קישורים – התעלם והמשך כרגיל.

אל תשאל את נותן השירות שום דבר.

כן לשאול את הלקוח הקצה: מה צריך, איזה סוג שירות, מה חשוב, לוח זמנים, ניסיון קודם.

פורמט הפלט (JSON בלבד): מערך של 5–7 שאלות, כל שאלה היא אובייקט:
{ "type": "בחירה יחידה"|"בחירה מרובה"|"כן/לא"|"שדה טקסט חופשי", "text": string, "options"?: string[] (עד 5) }

אנא החזר אך ורק JSON תקני של המערך, ללא הסברים נוספים.
שם העסק: ${businessName || "—"}
שפה מועדפת להצגה: ${locale}`;
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