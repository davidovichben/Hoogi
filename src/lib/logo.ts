import { SupabaseClient } from "@supabase/supabase-js";

/** ממיר 'bucket/path.png' ל־Public URL; אם כבר http(s) – מחזיר כמות שהוא */
export function resolveLogoUrl(supabase: SupabaseClient, raw?: string): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v; // URL מלא

  // bucket/path
  const i = v.indexOf("/");
  if (i > 0) {
    const bucket = v.slice(0, i);
    const path = v.slice(i + 1);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || v;
  }
  return v; // שם קובץ או סטטי – נשאיר כמות שהוא
}
