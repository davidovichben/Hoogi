// src/lib/publicUrl.ts
export type BuildUrlParams = { lang?: string; ref?: string; baseUrl?: string };

export function pickToken(q: { public_token?: string | null; token?: string | null; form_token?: string | null }) {
  return q?.public_token ?? q?.token ?? q?.form_token ?? '';
}

// עוזר: בחירת origin על בסיס baseUrl/env/window
const resolveOrigin = (baseUrl?: string) => {
  const fromEnv = (import.meta as any)?.env?.VITE_PUBLIC_BASE_URL as string | undefined;
  const origin = baseUrl || fromEnv || (typeof window !== 'undefined' ? window.location.origin : '');
  return origin.replace(/\/$/, '');
};

// חתימות נתמכות:
// 1) buildPublicUrl(origin, token, lang?, ref?)
export function buildPublicUrl(origin: string, token: string, lang?: string, ref?: string): string;
// 2) buildPublicUrl(token)
export function buildPublicUrl(token: string): string;
// 3) buildPublicUrl(token, lang)
export function buildPublicUrl(token: string, lang: string): string;
// 4) buildPublicUrl(token, { lang, ref, baseUrl })
export function buildPublicUrl(token: string, params: BuildUrlParams): string;
// 5) buildPublicUrl({ token, lang, ref, baseUrl })
export function buildPublicUrl(args: { token?: string; lang?: string; ref?: string; baseUrl?: string }): string;
export function buildPublicUrl(a: any, b?: any, c?: any, d?: any): string {
  // 5) אובייקט פרמטרים
  if (typeof a === 'object' && a !== null) {
    const { token, lang, ref, baseUrl } = a as { token?: string; lang?: string; ref?: string; baseUrl?: string };
    if (!token) return '';
    const origin = resolveOrigin(baseUrl);
    const qs = new URLSearchParams();
    if (lang) qs.set('lang', lang);
    if (ref)  qs.set('ref', ref);
    const query = qs.toString();
    return `${origin}/q/${encodeURIComponent(token)}${query ? `?${query}` : ''}`;
  }

  // 1) origin, token, lang?, ref?
  if (typeof a === 'string' && typeof b === 'string' && (typeof c === 'string' || typeof d === 'string' || c === undefined && d === undefined)) {
    // אם c/d קיימים – זה בוודאות origin+token+lang+ref; אם לא – זה עדיין תקין (origin+token)
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

  // 3) token, lang  או  4) token, { ... }
  if (typeof a === 'string') {
    const token = a as string;
    // 4) token, { lang, ref, baseUrl }
    if (b && typeof b === 'object') {
      const { lang, ref, baseUrl } = b as BuildUrlParams;
      const origin = resolveOrigin(baseUrl);
      const qs = new URLSearchParams();
      if (lang) qs.set('lang', lang);
      if (ref)  qs.set('ref', ref);
      const query = qs.toString();
      return `${origin}/q/${encodeURIComponent(token)}${query ? `?${query}` : ''}`;
    }
    // 2) token  או  3) token, lang
    const origin = resolveOrigin();
    const lang = typeof b === 'string' ? (b as string) : '';
    const qs = new URLSearchParams();
    if (lang) qs.set('lang', lang);
    const query = qs.toString();
    return `${origin}/q/${encodeURIComponent(token)}${query ? `?${query}` : ''}`;
  }

  return '';
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

// נוח ל-QR
export function buildQrApiUrl(url: string, size = 256) {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=${size}x${size}`;
}

// עטיפה נוחה: Preview URL זהה ל-public URL
export function buildPreviewUrl(origin: string, token: string, lang?: string, ref?: string) {
  return buildPublicUrl(origin, token, lang, ref);
}

// עטיפה נוחה: שם חלופי תואם
export function qrPngUrl(link: string) {
  return buildQrApiUrl(link, 256);
}