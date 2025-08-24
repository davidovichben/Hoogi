import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AuthCard from "@/components/auth/AuthCard";

function Input({label,type="text",value,onChange,placeholder}:{label:string;type?:string;value:string;onChange:(v:string)=>void;placeholder?:string}){
  return <div className="field"><label>{label}</label><input className="input" type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>
}

export default function AuthPage(){
  const [tab,setTab]=useState<"in"|"up">("up");
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [pass2,setPass2]=useState("");
  const [lang,setLang]=useState(localStorage.getItem("app:locale")||"he");
  const [msg,setMsg]=useState<string|null>(null); const [err,setErr]=useState<string|null>(null); const [busy,setBusy]=useState(false);

  const onSignUp=async()=>{
    setErr(null); setMsg(null);
    if(pass.length<8) { setErr("סיסמה חייבת להיות 8 תווים ומעלה"); return; }
    if(pass!==pass2){ setErr("הסיסמאות אינן תואמות"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options:{ data:{ locale:lang } }});
    setBusy(false);
    if(error){ setErr(error.message); return; }
    if(data.session){ setMsg("ברוכה הבאה! מפנה למערכת…"); window.location.assign("/questionnaires"); }
    else{ setMsg("נשלח מייל לאישור ההרשמה. לאחר האישור חזרי והתחברי."); }
  };

  const onSignIn=async()=>{
    setErr(null); setMsg(null); setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if(error){ setErr(error.message); return; }
    if(data.session){ window.location.assign("/questionnaires"); }
  };

  return (
    <div style={{maxWidth:960, margin:"40px auto"}}>
      <AuthCard title="בואי נתחיל">
        <div className="row" style={{justifyContent:"center", gap:12, marginBottom:16}}>
          <button className="btn-ghost" onClick={()=>setTab("in")} aria-pressed={tab==="in"}>התחברות</button>
          <button className="btn-ghost" onClick={()=>setTab("up")} aria-pressed={tab==="up"}>הרשמה</button>
        </div>
        {tab==="up" ? (
          <div className="row" style={{flexDirection:"column", gap:12}}>
            <Input label="אימייל" value={email} onChange={setEmail} placeholder="name@domain.com"/>
            <Input label="סיסמה" type="password" value={pass} onChange={setPass}/>
            <Input label="אימות סיסמה" type="password" value={pass2} onChange={setPass2}/>
            <div className="field">
              <label>שפת הרשמה</label>
              <select className="input" value={lang} onChange={e=>setLang(e.target.value)}>
                <option value="he">עברית</option><option value="en">English</option>
              </select>
            </div>
            {err && <div style={{color:"#b00020"}}>{err}</div>}
            {msg && <div style={{color:"#0a7f2e"}}>{msg}</div>}
            <button className="btn-brand" disabled={busy} onClick={onSignUp}>{busy?"שולח…":"הרשמה"}</button>
          </div>
        ) : (
          <div className="row" style={{flexDirection:"column", gap:12}}>
            <Input label="אימייל" value={email} onChange={setEmail} placeholder="name@domain.com"/>
            <Input label="סיסמה" type="password" value={pass} onChange={setPass}/>
            {err && <div style={{color:"#b00020"}}>{err}</div>}
            <button className="btn-brand" disabled={busy} onClick={onSignIn}>{busy?"נכנס…":"התחברות"}</button>
          </div>
        )}
      </AuthCard>
    </div>
  );
}
