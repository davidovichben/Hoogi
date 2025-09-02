import { supabase } from "@/integrations/supabase/client";

function hexToHslString(hex?: string): string | undefined {
  if (!hex) return;
  const normalized = hex.replace(/^#/, "");
  const bigint = parseInt(normalized.length === 3 ? normalized.split("").map(c=>c+c).join("") : normalized, 16);
  if (Number.isNaN(bigint)) return;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 1); break;
      case g1: h = (b1 - r1) / d + 2; break;
      case b1: h = (r1 - g1) / d + 4; break;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

/** Apply branding via CSS variables in HSL format */
export function applyBrandingVars(brand?: { brand_primary?: string; brand_secondary?: string; brand_logo_path?: string }) {
  const root = document.documentElement;
  const hslP = hexToHslString(brand?.brand_primary);
  const hslS = hexToHslString(brand?.brand_secondary);
  if (hslP) root.style.setProperty("--brand-primary", hslP);
  if (hslS) root.style.setProperty("--brand-secondary", hslS);
}

/** Resolve a public URL for a logo path. If already absolute, returns as is */
export function resolveLogoUrl(logo_path?: string): string | undefined {
  if (!logo_path) return;
  if (/^https?:\/\//i.test(logo_path)) return logo_path;
  try {
    const { data } = supabase.storage.from("branding").getPublicUrl(logo_path);
    return data?.publicUrl;
  } catch {
    return;
  }
}
