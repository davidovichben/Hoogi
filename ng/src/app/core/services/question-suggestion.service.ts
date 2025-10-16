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

  private buildPromptOverride(profile: ProfileForAI, locale: "he" | "en" | "fr" = "he"): string {
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
      ? `אתה מומחה ביצירת שאלונים שיווקיים.
שים דגש על התאמה אישית לעיסוק ולתת־תחום של המשתמש.
אם קיימים קישורים, מסמכים או מידע נוסף – השתמש בהם כדי לדייק את השאלות.
המטרה: לייצר שאלון שמוביל לשיחת מכירה.
בשאלות הראשונות תמיד כלול לפי הסדר: שם מלא, כתובת אימייל, מספר טלפון.
החזר אך ורק JSON בפורמט הבא:
{ "questions": [ { "text": string, "type": "text|single|multi|yes_no|date|email|phone", "options"?: string[], "isRequired"?: boolean } ] }`
      : `You are an expert in generating smart business questionnaires.
Focus on tailoring questions to the business type and sub-type.
If links or extra info are provided – use them to personalize the questions.
The goal: create a lead-generating form that prepares users for a sales call.
Always include these 3 questions at the beginning, in order: full name, email, phone number.
Respond ONLY in the following JSON format:
{ "questions": [ { "text": string, "type": "text|single|multi|yes_no|date|email|phone", "options"?: string[], "isRequired"?: boolean } ] }`;

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
        prompt_override: this.buildPromptOverride(profile, opts?.locale ?? "he")
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
