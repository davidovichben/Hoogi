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

    // Determine the primary service focus
    const serviceFocus = suboccupation || otherText || occupation || "שירות כללי";

    return `אתה מומחה UX ושיווק שמפתח שאלוני לידים ספציפיים לעסקים.

## 📋 פרטי העסק:
- שם העסק: ${businessName || "—"}
- תחום עיקרי: ${occupation || "—"}
- תת-תחום/התמחות: ${suboccupation || "—"}
${otherText ? `- פרטים נוספים: ${otherText}` : ''}
${linksText ? `- קישורים: ${linksText}` : ''}

## 🎯 המשימה שלך:
צור שאלון של 5-7 שאלות **ספציפיות** ל**${serviceFocus}**.

**חשוב מאוד:**
- השאלות צריכות להיות רלוונטיות **בדיוק** לתחום ${serviceFocus}
- שאל את הלקוח הקצה מה **הוא** צריך (לא שאלות על נותן השירות)
- השאלות צריכות לעזור להבין את הצורך הספציפי של הלקוח

## 📌 דרישות טכניות:
- **חובה** לכלול לפחות:
  - שאלה אחת מסוג "בחירה מרובה" (3-5 אופציות)
  - שאלה אחת מסוג "בחירה יחידה" (3-5 אופציות)
  - שאלה אחת מסוג "כן/לא"
- שאר השאלות יכולות להיות "שדה טקסט חופשי"

## 🔧 פורמט החזרה:
החזר **רק** JSON תקין, ללא markdown ו-backticks:

[
  {
    "type": "בחירה יחידה",
    "text": "שאלה ספציפית ל-${serviceFocus}?",
    "options": ["אופציה 1", "אופציה 2", "אופציה 3"]
  },
  {
    "type": "כן/לא",
    "text": "שאלה כן/לא?"
  },
  {
    "type": "בחירה מרובה",
    "text": "מה חשוב לך?",
    "options": ["א", "ב", "ג", "ד"]
  },
  {
    "type": "שדה טקסט חופשי",
    "text": "שאלה פתוחה?"
  }
]

שפה: ${locale}
**זכור: השאלות חייבות להיות ספציפיות לתחום ${serviceFocus}, לא שאלות גנריות!**`;
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
