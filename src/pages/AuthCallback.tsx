import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"

export default function AuthCallback() {
  const [msg, setMsg] = useState("Completing sign‑in…")
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) {
          console.error("Auth callback error:", error)
          setMsg("Sign‑in failed: " + error.message)
          return
        }
        
        setMsg("Signed in! Checking profile...")
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            navigate("/auth", { replace: true });
            return;
          }

          // בדיקה אם יש פרופיל עם שדות חובה
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, category, sub_category, default_locale")
            .eq("id", user.id)
            .single();

          if (profileError || !profile) {
            // משתמש חדש - אין פרופיל בכלל
            setMsg("Creating new profile...");
            await supabase
              .from("profiles")
              .insert([{ 
                id: user.id, 
                default_locale: "he",
                category: null,
                sub_category: null
              }]);
            
            // משתמש חדש חייב להיכנס לפרופיל
            navigate("/profile?block=1", { replace: true });
            return;
          }

          // בדיקה אם הפרופיל מלא (יש category ו-sub_category)
          const isProfileComplete = profile.category && profile.sub_category && 
                                  profile.category.trim() !== '' && 
                                  profile.sub_category.trim() !== '';

          if (isProfileComplete) {
            // משתמש עם פרופיל מלא - נכנס לדשבורד
            setMsg("Profile complete! Going to dashboard...");
            navigate("/dashboard", { replace: true });
          } else {
            // משתמש עם פרופיל חלקי - חייב להשלים
            setMsg("Profile incomplete! Going to profile...");
            navigate("/profile?block=1", { replace: true });
          }

        } catch (profileError) {
          console.error("Profile check error:", profileError);
          // במקרה של שגיאה, נשלח לפרופיל
          setMsg("Error checking profile! Going to profile...");
          navigate("/profile?block=1", { replace: true });
        }
      } catch (e: any) {
        console.error(e)
        setMsg("Unexpected error: " + (e?.message || e))
      }
    })()
  }, [navigate])

  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <p>{msg}</p>
    </div>
  )
}


