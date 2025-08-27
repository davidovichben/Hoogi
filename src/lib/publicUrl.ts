// src/lib/publicUrl.ts
export type PublicUrlOptions = {
  lang?: 'he' | 'en';
  ref?: string;
};

// חתימה חדשה עם origin (compat): buildPublicUrl(origin, token, lang, ref)
export function buildPublicUrl(origin: string, token: string, lang: string, ref: string): string;
// חתימה ישנה (ללא origin) שנשמרת לתאימות: buildPublicUrl(token, opts)
export function buildPublicUrl(token: string, opts?: PublicUrlOptions): string;
export function buildPublicUrl(a: string, b?: any, c?: any, d?: any): string {
  // מצב 1: נקרא עם (origin, token, lang, ref)
  if (typeof b === 'string') {
    const origin = a.replace(/\/$/, '');
    const token = b as string;
    const lang = (c as string) || '';
    const ref = (d as string) || '';
    const qs = new URLSearchParams();
    if (lang) qs.set('lang', lang);
    if (ref)  qs.set('ref', ref);
    const query = qs.toString();
    return `${origin}/q/${encodeURIComponent(token)}${query ? `?${query}` : ''}`;
  }

  // מצב 2: נקרא עם (token, opts)
  const token = a;
  const opts = (b as PublicUrlOptions) || {};
  const params = new URLSearchParams();
  if (opts.lang) params.set('lang', opts.lang);
  if (opts.ref)  params.set('ref',  opts.ref);
  const qs = params.toString();
  return `/q/${encodeURIComponent(token)}${qs ? `?${qs}` : ''}`;
}

// חתימה חדשה עם origin
export function buildEditUrl(origin: string, questionnaireId: string): string;
// חתימה קיימת (ללא origin) נשמרת לתאימות
export function buildEditUrl(id: string): string;
export function buildEditUrl(a: string, b?: string): string {
  if (b) {
    const origin = a.replace(/\/$/, '');
    const id = b;
    return `${origin}/questionnaires/${encodeURIComponent(id)}/edit`;
  }
  const id = a;
  return `/questionnaires/${encodeURIComponent(id)}/edit`;
}

export function buildReviewUrl(id: string) {
  return `/questionnaires/${encodeURIComponent(id)}/review`;
}