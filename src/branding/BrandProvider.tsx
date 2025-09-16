import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Branding = {
  primary?: string;   // brand_primary | brand_color | brand_accent
  secondary?: string; // brand_secondary | brand_accent
  background?: string;// brand_bg | background_color
  logoUrl?: string;   // logo_url | brand_logo_path (כ-URL מלא)
};

const BrandCtx = createContext<Branding>({});
export function useBranding() { return useContext(BrandCtx); }

function toPublicUrl(s: SupabaseClient, raw?: string) {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;      // כבר URL מלא
  const i = v.indexOf("/");                    // bucket/path
  if (i > 0) {
    const bucket = v.slice(0, i);
    const path = v.slice(i + 1);
    const { data } = s.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || v;
  }
  return v;                                    // שם קובץ/נכס סטטי
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

        // בוחרים לפי id או user_id (מה שיש אצלך בשורה)
        const { data: prof, error } = await supabase
          .from("profiles")
          .select("id,user_id,brand_primary,brand_secondary,brand_bg,brand_color,brand_accent,background_color,logo_url,brand_logo_path")
          .or(`id.eq.${uid},user_id.eq.${uid}`)
          .limit(1)
          .single();

        if (error || !prof || cancelled) return;

        const primary =
          (prof.brand_primary?.toString().trim()) ||
          (prof.brand_color?.toString().trim())   ||
          (prof.brand_accent?.toString().trim())  ||
          undefined;

        const secondary =
          (prof.brand_secondary?.toString().trim()) ||
          (prof.brand_accent?.toString().trim())    ||
          undefined;

        const background =
          (prof.brand_bg?.toString().trim()) ||
          (prof.background_color?.toString().trim()) ||
          undefined;

        const logoRaw =
          (prof.logo_url?.toString().trim()) ||
          (prof.brand_logo_path?.toString().trim()) ||
          undefined;

        const b: Branding = {
          primary,
          secondary,
          background,
          logoUrl: toPublicUrl(supabase, logoRaw),
        };

        if (cancelled) return;
        setBranding(b);

        // הזרקת CSS variables גלובליים כדי שכל המסכים "יירשו" צבעים
        const root = document.documentElement;
        if (b.primary)   root.style.setProperty("--brand-primary", b.primary);
        if (b.secondary) root.style.setProperty("--brand-secondary", b.secondary);
        if (b.background)root.style.setProperty("--brand-bg", b.background);

        // גיבוי לסשן (לא חובה)
        Object.entries(b).forEach(([k, v]) => v && localStorage.setItem(`branding:${k}`, v as string));
      } catch {
        /* לא מפיל את האפליקציה */
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
