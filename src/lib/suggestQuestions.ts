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
      max: opts?.maxTotal ?? 7
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