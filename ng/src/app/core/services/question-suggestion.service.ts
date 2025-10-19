import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class QuestionSuggestionService {
  constructor(private supabaseService: SupabaseService) {}

  private buildPromptOverride(profile: ProfileForAI, locale: "he" | "en" | "fr" = "he", maxTotal: number = 7): string {
    const businessName = (profile.businessName || "").trim();
    const occupation = (profile.occupation || "").trim();
    const suboccupation = (profile.suboccupation || "").trim();
    const otherText = (profile.extra || "").trim();
    const linksText = (profile.links || []).filter(Boolean).join(", ");

    // Build business info context
    const businessInfo = `
שם העסק: ${businessName || "—"}
תחום עיקרי: ${occupation || "—"}
תת-תחום: ${suboccupation || "—"}
${otherText ? `מידע נוסף: ${otherText}` : ''}
${linksText ? `קישורים/מסמכים: ${linksText}` : ''}`.trim();

    const systemPrompt = locale === "he"
      ? `צור ${maxTotal} שאלות בעברית לשאלון לידים.
עבור השאלות הראשונות, כלול תמיד: שם מלא (type: text), אימייל (type: email), טלפון (type: phone).
לאחר מכן, הוסף שאלות מותאמות לעיסוק ותת-תחום.
עבור שאלות בחירה, כלול 3-4 אופציות.

החזר JSON בלבד בפורמט זה:
{
  "questions": [
    { "text": "מה השם המלא שלך?", "type": "text", "isRequired": true },
    { "text": "מה האימייל שלך?", "type": "email", "isRequired": true },
    { "text": "מה מספר הטלפון שלך?", "type": "phone", "isRequired": true },
    { "text": "שאלה נוספת", "type": "single_choice", "options": ["אופציה 1", "אופציה 2", "אחר"], "isRequired": false }
  ]
}

סוגי שאלות אפשריים: text, email, phone, single_choice, multiple_choice, yes_no, date`
      : `Generate ${maxTotal} questions for a lead form.
For the first questions, always include: full name (type: text), email (type: email), phone (type: phone).
Then add questions tailored to the business type and sub-type.
For choice questions, include 3-4 options.

Return ONLY JSON in this format:
{
  "questions": [
    { "text": "What is your full name?", "type": "text", "isRequired": true },
    { "text": "What is your email?", "type": "email", "isRequired": true },
    { "text": "What is your phone number?", "type": "phone", "isRequired": true },
    { "text": "Additional question", "type": "single_choice", "options": ["Option 1", "Option 2", "Other"], "isRequired": false }
  ]
}

Valid types: text, email, phone, single_choice, multiple_choice, yes_no, date`;

    return `${systemPrompt}

פרטי העסק:
${businessInfo}`;
  }

  async fetchSuggestedQuestions(
    profile: ProfileForAI,
    opts?: { locale?: "he" | "en" | "fr"; minCore?: number; maxTotal?: number }
  ): Promise<AiQuestion[]> {
    const edgeUrl = `${environment.supabaseUrl}/functions/v1/suggest-questions`;
    const anon = environment.supabaseAnonKey;

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
        prompt_override: this.buildPromptOverride(profile, opts?.locale ?? "he", opts?.maxTotal ?? 7)
      })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`suggest-questions ${res.status}: ${txt}`);
    }

    const data = await res.json().catch(() => ({}));
    const arr = Array.isArray(data?.questions) ? data.questions : [];

    console.log('AI Response data:', data);
    console.log('Questions array:', arr);

    // Map and sanitize questions
    const mapped: AiQuestion[] = arr.map((q: any) => {
      const text = (q?.text ?? "").toString().trim();
      if (!text) return null;

      let type = (q?.type ?? "text").toString().toLowerCase();
      if (type === "single") type = "single_choice";
      if (type === "multi") type = "multiple_choice";
      if (type === "yes_no") {
        type = "single_choice";
        q.options = ["כן", "לא"];
      }

      const options = Array.isArray(q?.options)
        ? q.options.filter((o: any) => typeof o === "string" && o.trim()).map((o: string) => o.trim())
        : undefined;
      const isRequired = typeof q?.isRequired === "boolean" ? q.isRequired : false;

      return { text, type, options, isRequired } as AiQuestion;
    }).filter(Boolean) as AiQuestion[];

    return mapped;
  }
}
