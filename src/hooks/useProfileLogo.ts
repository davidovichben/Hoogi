import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { resolveLogoUrl } from "@/lib/logo";

/** מחזיר URL של לוגו מהטבלה profiles (logo_url או brand_logo_path) */
export function useProfileLogo() {
  const supabase: SupabaseClient = useMemo(
    () => createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!),
    []
  );
  const [logoUrl, setLogoUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (!uid) return;

        // תומך גם במקרים שהמפתח הוא user_id
        const { data: p, error } = await supabase
          .from("profiles")
          .select("id,user_id,logo_url,brand_logo_path")
          .or(`id.eq.${uid},user_id.eq.${uid}`)
          .limit(1)
          .single();

        if (error || !p || cancelled) return;

        const raw = (p.logo_url?.toString().trim() || p.brand_logo_path?.toString().trim() || "");
        const url = resolveLogoUrl(supabase, raw);
        if (!cancelled) setLogoUrl(url);
      } catch {
        /* no-op */
      }
    })();

    return () => { cancelled = true; };
  }, [supabase]);

  return logoUrl;
}
