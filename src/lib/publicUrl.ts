// src/lib/publicUrl.ts
export type PublicUrlOptions = {
  lang?: 'he' | 'en';
  ref?: string;
};

export function buildPublicUrl(token: string, opts: PublicUrlOptions = {}) {
  const params = new URLSearchParams();
  if (opts.lang) params.set('lang', opts.lang);
  if (opts.ref)  params.set('ref',  opts.ref);
  const qs = params.toString();
  return `/q/${encodeURIComponent(token)}${qs ? `?${qs}` : ''}`;
}

export function buildEditUrl(id: string) {
  // מסך העריכה במערכת-ניהול נשאר לפי ID
  return `/questionnaires/${encodeURIComponent(id)}/edit`;
}

export function buildReviewUrl(id: string) {
  return `/questionnaires/${encodeURIComponent(id)}/review`;
}