import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Branding = {
  primary?: string;
  secondary?: string;
  background?: string;
  logoUrl?: string;
};

const BrandCtx = createContext<Branding>({});
export function useBranding() { return useContext(BrandCtx); }

function toPublicUrl(s: SupabaseClient, raw?: string) {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  const i = v.indexOf("/");
  if (i > 0) {
    const bucket = v.slice(0, i);
    const path = v.slice(i + 1);
    const { data } = s.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || v;
  }
  return v;
}

export default function BrandProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(
    () => createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!),
    []
  );
  const [branding, setBranding] = useState<Branding>({});

  useEffect(() => {
    let cancelled = false;
    let sub: ReturnType<SupabaseClient["channel"]> | undefined;

    async function loadAndSet() {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (!uid) return;

        const { data: p } = await supabase
          .from("profiles")
          .select("id,user_id,brand_primary,brand_secondary,brand_bg,background_color,brand_color,brand_accent,logo_url,brand_logo_path,updated_at")
          .or(`id.eq.${uid},user_id.eq.${uid}`)
          .limit(1)
          .single();

        if (!p || cancelled) return;

        const primary =
          (p.brand_primary ?? p.brand_color ?? p.brand_accent ?? "")?.toString().trim() || undefined;
        const secondary =
          (p.brand_secondary ?? p.brand_accent ?? "")?.toString().trim() || undefined;
        const background =
          (p.brand_bg ?? p.background_color ?? "")?.toString().trim() || undefined;
        const logoRaw =
          (p.logo_url ?? p.brand_logo_path ?? "")?.toString().trim() || undefined;

        const next: Branding = {
          primary,
          secondary,
          background,
          logoUrl: toPublicUrl(supabase, logoRaw),
        };

        setBranding(next);

        // הזרקת CSS Vars גלובליים (ללא שימוש ב-localStorage)
        const root = document.documentElement;
        root.style.removeProperty("--brand-primary");
        root.style.removeProperty("--brand-secondary");
        root.style.removeProperty("--brand-bg");
        if (next.primary)   root.style.setProperty("--brand-primary", next.primary);
        if (next.secondary) root.style.setProperty("--brand-secondary", next.secondary);
        if (next.background)root.style.setProperty("--brand-bg", next.background);
      } catch {
        /* no-op */
      }
    }

    loadAndSet();

    // realtime – נרשמים לעדכונים על השורה של המשתמש
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;

      sub = supabase
        .channel("profiles_branding")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${uid}`,
          },
          () => loadAndSet()
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (sub) supabase.removeChannel(sub);
    };
  }, [supabase]);

  return (
    <BrandCtx.Provider value={branding}>
      <div data-branding-root>{children}</div>
    </BrandCtx.Provider>
  );
}
