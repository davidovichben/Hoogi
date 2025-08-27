export type BuildUrlParams = {
  token: string;
  lang?: 'he' | 'en';
  ref?: string;
  channel?: 'landing' | 'whatsapp' | 'mail' | 'qr' | 'other';
};

export function buildPublicUrl({ token, lang = 'he', ref = 'landing', channel }: BuildUrlParams) {
  const base = window.location.origin; // לוקאלי/פרוד – יתאים אוטומטית
  const url = new URL(`${base}/q/${token}`);
  if (lang) url.searchParams.set('lang', lang);
  if (ref) url.searchParams.set('ref', ref);
  if (channel) url.searchParams.set('ch', channel);
  return url.toString();
}

export function getShareUrl(token: string): string {
  return `${window.location.origin}/distribute?token=${token}`;
}

export function getReviewUrl(token: string): string {
  return `${window.location.origin}/questionnaires/${token}/review`;
}