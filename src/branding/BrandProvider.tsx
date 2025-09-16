import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Branding = {
  primary?: string;
  secondary?: string;
  background?: string;
  logoUrl?: string;
};

const BrandCtx = createContext<Branding>({});

export function useBranding() {
  return useContext(BrandCtx);
}

function resolveStorageUrl(s: SupabaseClient, raw?: string): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;         // URL מלא
  const i = v.indexOf("/");                       // bucket/path
  if (i > 0) {
    const bucket = v.slice(0, i);
    const path = v.slice(i + 1);
    const { data } = s.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || v;
  }
  return v;                                       // שם קובץ או נכס סטטי
}

export default function BrandProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(
    () => createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!),
    []
  );
  const [branding, setBranding] = useState<Branding>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (!uid) return;

        // מביא את כל הפרופיל – נתמוך בשמות עמודות שונים
        const { data: p, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
        if (error || !p || cancelled) return;

        const primary =
          (p.brand_primary ?? p.brand_color ?? p.primary_color ?? p.color_primary ?? "")?.toString().trim() || undefined;
        const secondary =
          (p.brand_secondary ?? p.secondary_color ?? "")?.toString().trim() || undefined;
        const background =
          (p.bg_color ?? p.background_color ?? p.bg ?? "")?.toString().trim() || undefined;
        const logoRaw =
          (p.logo_path ?? p.logo_url ?? p.logo ?? "")?.toString().trim() || undefined;

        const b: Branding = {
          primary,
          secondary,
          background,
          logoUrl: resolveStorageUrl(supabase, logoRaw),
        };

        if (cancelled) return;
        setBranding(b);

        // הזרקת CSS variables גלובליים כדי שכל המסכים "יירשו" צבעים
        const root = document.documentElement;
        if (b.primary)   root.style.setProperty("--brand-primary", b.primary);
        if (b.secondary) root.style.setProperty("--brand-secondary", b.secondary);
        if (b.background)root.style.setProperty("--brand-bg", b.background);

        // גיבוי ל-session
        Object.entries(b).forEach(([k, v]) => v && localStorage.setItem(`branding:${k}`, v as string));
      } catch {
        /* no-op */
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  return (
    <BrandCtx.Provider value={branding}>
      <div data-branding-root>{children}</div>
    </BrandCtx.Provider>
  );
}
