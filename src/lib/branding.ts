import { supabase } from "@/integrations/supabase/client";

/** החלת צבעים נקודתית (לא משנה CSS גלובלי) */
export function applyBrandingVars(opts: { brand_primary?: string; brand_secondary?: string; background_color?: string }) {
  const root = document.documentElement;
  if (opts.brand_primary)   root.style.setProperty('--brand-primary', opts.brand_primary);
  if (opts.brand_secondary) root.style.setProperty('--brand-secondary', opts.brand_secondary);
  root.style.setProperty('--app-bg', opts.background_color || '#ffffff');
}

/** HEX ללא #, 3/6 תווים */
export function sanitizeHex(input?: string): string {
  const v = (input ?? "").toLowerCase().replace(/#/g, "").trim();
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/.test(v)) throw new Error("HEX חייב 3/6 ספרות ללא #");
  return v.length === 3 ? v : v.slice(0, 6);
}

/** path יחסי תחת branding/ או URL מלא */
export function normalizeLogoPath(input?: string): string | null {
  const v = (input ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return v.replace(/^\/+/, "").replace(/^public\//, "").replace(/^(?!branding\/)/, "branding/");
}

/** הפיכת path לוגו ל־public URL */
export function resolveLogoUrl(logo_path?: string) {
  if (!logo_path) return;
  if (/^https?:\/\//i.test(logo_path)) return logo_path;
  return supabase.storage.from("branding").getPublicUrl(logo_path).data?.publicUrl;
}
