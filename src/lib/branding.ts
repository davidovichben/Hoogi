import { supabase } from "@/integrations/supabase/client";

export function applyBrandingVars(brand?: { brand_primary?: string; brand_secondary?: string }) {
  const root = document.documentElement;
  const pp = (brand?.brand_primary ?? "").replace(/^#/, "");
  const ss = (brand?.brand_secondary ?? "").replace(/^#/, "");
  if (pp) root.style.setProperty("--brand-primary", `#${pp}`);
  if (ss) root.style.setProperty("--brand-secondary", `#${ss}`);
}

export function sanitizeHex(input?: string): string {
  const v = (input ?? "").toLowerCase().replace(/#/g, "").trim();
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/.test(v)) throw new Error("HEX חייב 3/6 ספרות ללא #");
  return v.length === 3 ? v : v.slice(0, 6);
}

export function normalizeLogoPath(input?: string): string | null {
  const v = (input ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return v.replace(/^\/+/, "").replace(/^public\//, "").replace(/^(?!branding\/)/, "branding/");
}

export function resolveLogoUrl(logo_path?: string) {
  if (!logo_path) return;
  if (/^https?:\/\//i.test(logo_path)) return logo_path;
  return supabase.storage.from("branding").getPublicUrl(logo_path).data?.publicUrl;
}
