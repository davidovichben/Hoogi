import { useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { fetchProfile } from "../lib/profile";
import { useLanguage } from "../contexts/LanguageContext";

export default function AppBootLocale() {
  const { setLanguage } = useLanguage();
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const p = await fetchProfile(user.id);
        if (p?.locale) setLanguage(p.locale as 'he'|'en');
      }
    })();
  }, []);
  return null;
}
