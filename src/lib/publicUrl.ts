// src/lib/publicUrl.ts
export type PublicUrlOpts = {
  token: string;           // questionnaire.token (UUID)
  lang?: 'he' | 'en';
  ref?: string;            // landing / qr / whatsapp / mail / <partner-code> / other
  origin?: string;         // override window.location.origin for dev
};

export const buildPublicUrl = ({ token, lang = 'he', ref = 'landing', origin }: PublicUrlOpts) => {
  const base = (origin ?? window.location.origin).replace(/\/+$/, '');
  const qp = new URLSearchParams();
  if (lang) qp.set('lang', lang);
  if (ref) qp.set('ref', ref);
  // מסלול ציבורי אחיד: /q/:token
  return `${base}/q/${token}?${qp.toString()}`;
};

export function getShareUrl(token: string): string {
  return `${window.location.origin}/distribute?token=${token}`;
}

export function getReviewUrl(token: string): string {
  return `${window.location.origin}/questionnaires/${token}/review`;
}