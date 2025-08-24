import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // adjust path if needed

function Field({ label, type = "text", value, onChange, placeholder }:{
  label: string; type?: string; value: string; onChange: (v:string)=>void; placeholder?: string;
}) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <input className="input" type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState<string|null>(null);
  const [msg,  setMsg]    = useState<string|null>(null);
  const [lang, setLang]   = useState(localStorage.getItem("app:locale") || "he");

  useEffect(()=>{
    // local RTL without touching app root:
    const html = document.documentElement;
    html.setAttribute("dir", (lang==="he"||lang==="ar") ? "rtl" : "ltr");
    html.setAttribute("lang", lang);
    localStorage.setItem("app:locale", lang);
  }, [lang]);

  const onSubmit = async () => {
    setErr(null); setMsg(null);

    if (!email) { setErr("יש להזין אימייל"); return; }
    if (pass.length < 8) { setErr("סיסמה חייבת להיות לפחות 8 תווים"); return; }
    if (pass !== pass2) { setErr("הסיסמאות אינן תואמות"); return; }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { locale: lang } }
    });
    setBusy(false);

    if (error) { setErr(error.message); return; }

    if (data.session) {
      // email confirmation disabled → logged in immediately
      window.location.assign("/questionnaires");
      return;
    } else {
      // email confirmation enabled
      setMsg("נשלח אלייך מייל לאישור. לאחר האישור אפשר להתחבר.");
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "40px auto" }} dir="rtl">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>הרשמה</h1>
          <div style={{ display:"flex", gap:8 }}>
            <button className="outline" onClick={()=>setLang("he")} aria-pressed={lang==="he"}>עברית</button>
            <button className="outline" onClick={()=>setLang("en")} aria-pressed={lang==="en"}>EN</button>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Field label="אימייל" value={email} onChange={setEmail} placeholder="name@domain.com" />
          <Field label="סיסמה" type="password" value={pass} onChange={setPass} />
          <Field label="אימות סיסמה" type="password" value={pass2} onChange={setPass2} />
          {err && <div className="chip" style={{ background:"#fde2e1", color:"#8a1c1c" }}>{err}</div>}
          {msg && <div className="chip" style={{ background:"#dbf6df", color:"#135c1a" }}>{msg}</div>}
          <button className="btn-brand" onClick={onSubmit} disabled={busy}>
            {busy ? "נרשמות…" : "הרשמה"}
          </button>
          <a className="outline" href="/auth">יש לך חשבון? התחברות</a>
        </div>
      </div>
    </div>
  );
}
