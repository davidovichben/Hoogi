// src/lib/suggestQuestions.ts
export type SuggestInput = {
  businessName?: string;
  occupation?: string;
  suboccupation?: string;
  other_text?: string;
  links?: string;
  language?: 'he' | 'en';
  max?: number;
  prompt_override?: string;
  __debug?: boolean;
};

const BASE = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function fetchSuggestedQuestions(input: SuggestInput): Promise<string[]> {
  if (!BASE || !ANON) {
    throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  }

  const url = `${BASE.replace(/\/$/, '')}/functions/v1/suggest-questions`;

  const res = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON}`,
      'apikey': ANON,
    },
    body: JSON.stringify({
      businessName: input.businessName ?? 'עסק',
      occupation: input.occupation ?? '',
      suboccupation: input.suboccupation ?? '',
      other_text: input.other_text ?? '',
      links: input.links ?? '',
      language: input.language ?? 'he',
      max: Math.min(Math.max(input.max ?? 7, 5), 10),
      prompt_override: input.prompt_override,
      __debug: input.__debug,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`suggest-questions ${res.status}: ${JSON.stringify(data)}`);
  }

  // תומך גם במערך ישיר וגם באובייקט { questions: [...] }
  const arr = Array.isArray(data) ? data : (data?.questions ?? []);
  
  // לוג דיבוג לראות מה חוזר
  if (input.__debug) {
    console.log('[AI] Response structure:', {
      isArray: Array.isArray(data),
      hasQuestions: !!data?.questions,
      questionsCount: arr.length,
      sample: arr.slice(0, 2)
    });
  }
  
  return Array.isArray(arr) ? arr : [];
}