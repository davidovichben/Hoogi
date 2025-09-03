import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BrandStyles from "@/components/BrandStyles";
import { toast } from "@/components/ui/Toaster";
import { validateRequired, toSerializableAnswers } from "@/lib/answers";
import { rpcSubmitResponse } from "@/lib/rpc";
type Question={id:string;type:"single_choice"|"multi_choice"|"text"|"long_text"|"number"|"date";label:string;help_text:string|null;required:boolean;order_index:number;};
type Option={id:string;question_id:string;value:string;label:string;order_index:number;};
export default function PublicForm(){
  const {id}=useParams(); const [token,setToken]=useState<string|null>(null);
  const [qTitle,setQTitle]=useState(""); const [logoUrl,setLogoUrl]=useState<string|null>(null);
  const [brandPrimary,setBrandPrimary]=useState("#2563eb"); const [brandAccent,setBrandAccent]=useState("#f59e0b"); const [brandBackground,setBrandBackground]=useState("#ffffff");
  const [questions,setQuestions]=useState<Question[]>([]); const [options,setOptions]=useState<Option[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [phone,setPhone]=useState(""); const [answers,setAnswers]=useState<Record<string,any>>({});
  useEffect(()=>{ const p=new URLSearchParams(window.location.search); setToken(p.get("t")); },[]);
  useEffect(()=>{ const load=async()=>{ if(!id) return; setLoading(true); setError(null);
      try{ const {data:q,error:qe}=await supabase.from("questionnaires").select("id,title,is_published,form_token,brand_logo_url,brand_primary,brand_accent,brand_background").eq("id",id).maybeSingle();
        if(qe){ setError("שגיאה בטעינת השאלון"); return; }
        if(!q){ setError("השאלון לא נמצא או לא זמין כרגע."); return; }
        if(!q?.is_published) { setError("השאלון אינו זמין למילוי."); return; }
        const t=new URLSearchParams(window.location.search).get("t"); if(!t||t!==q.form_token) { setError("קישור לא חוקי או חסר טוקן."); return; }
        setQTitle(q.title); setLogoUrl(q.brand_logo_url||null); setBrandPrimary(q.brand_primary||"#2563eb"); setBrandAccent(q.brand_accent||"#f59e0b"); setBrandBackground(q.brand_background||"#ffffff");
        const {data:qs,error:qse}=await supabase.from("questions").select("id,type,label,help_text,required,order_index,questionnaire_id").eq("questionnaire_id",id).order("order_index",{ascending:true});
        if(qse){ setError("שגיאה בטעינת השאלות"); return; } setQuestions((qs||[]) as any);
        const ids=(qs||[]).map((x:any)=>x.id); if(ids.length){ const {data:opts,error:oe}=await supabase.from("question_options").select("id,question_id,value,label,order_index").in("question_id",ids).order("order_index",{ascending:true}); if(oe){ setOptions([] as any); } else { setOptions((opts||[]) as any);} } else setOptions([]); }
      catch(e:any){ setError(e.message||String(e)); } finally{ setLoading(false);} }; load(); },[id]);
  const optionsByQuestion=useMemo(()=>{ const m:Record<string,Option[]>={}; for(const o of options)(m[o.question_id] ||= []).push(o); return m;},[options]);
  const setAnswer=(qid:string,v:any)=>setAnswers(prev=>({...prev,[qid]:v}));
  const handleSubmit=async()=>{ 
    try{ 
      if (!token) {
        toast({ title: "טיוטה", description: "שליחה פעילה רק אחרי פרסום." });
        return;
      }
      const missing = validateRequired(questions, answers);
      if (missing.length) {
        toast({ title: "חסרים פרטים", description: `נא השלי: ${missing.slice(0,3).join(", ")}${missing.length>3?" ועוד…":""}` });
        return;
      }
      const payload = toSerializableAnswers(questions, answers);

      // אם יש אצלך שדות אימייל/טלפון במודל – קחי מהם. אם לא, ישלחו undefined (זה בסדר).
      const email = (answers["contact_email"] ?? undefined) as string | undefined;
      const phone = (answers["contact_phone"] ?? undefined) as string | undefined;

      const lang = new URLSearchParams(window.location.search).get("lang") ?? "he";
      await rpcSubmitResponse(token, payload, email, phone, lang, "landing");

      toast({ title: "נשלח", description: "תודה! התשובה נשמרה בהצלחה." });
      // השאירי ללא ניווט כדי לא לשנות זרימה קיימת
    } catch (e) {
      console.error(e);
      toast({ title: "שגיאה", description: "שליחה נכשלה. נסי שוב." });
    } 
  };
  if(loading) return <div className="p-6">טוען…</div>; if(error) return <div className="p-6 text-red-600">{error}</div>;
  return(<BrandStyles primary={brandPrimary} accent={brandAccent} background={brandBackground}>
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">{logoUrl&&<img src={logoUrl} className="h-10 object-contain" />}<h1 className="text-2xl font-semibold">{qTitle}</h1></div>
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="שם" value={name} onChange={e=>setName(e.target.value)}/>
          <input className="input" placeholder="אימייל" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input className="input" placeholder="טלפון" value={phone} onChange={e=>setPhone(e.target.value)}/>
        </div>
        <div className="space-y-4">
          {questions.map((q)=>(
            <div key={q.id} className="card p-3">
              <label className="font-medium">{q.label}{q.required?" *":""}</label>
              {q.help_text && <div className="text-sm text-gray-600 mb-1">{q.help_text}</div>}
              {q.type==="text" && <input className="input" value={answers[q.id]||""} onChange={e=>setAnswer(q.id,e.target.value)}/>}
              {q.type==="long_text" && <textarea className="input" rows={3} value={answers[q.id]||""} onChange={e=>setAnswer(q.id,e.target.value)}/>}
              {q.type==="number" && <input type="number" className="input" value={answers[q.id]??""} onChange={e=>setAnswer(q.id,e.target.value)}/>}
              {q.type==="date" && <input type="date" className="input" value={answers[q.id]??""} onChange={e=>setAnswer(q.id,e.target.value)}/>}
              {q.type==="single_choice" && <div className="mt-2 space-y-2">{(optionsByQuestion[q.id]||[]).map((o)=>(
                <label key={o.id} className="flex items_center gap-2"><input type="radio" name={q.id} checked={answers[q.id]===o.value} onChange={()=>setAnswer(q.id,o.value)}/>{o.label}</label>))}</div>}
              {q.type==="multi_choice" && <div className="mt-2 space-y-2">{(optionsByQuestion[q.id]||[]).map((o)=>{ const arr:string[]=Array.isArray(answers[q.id])?answers[q.id]:[]; const checked=arr.includes(o.value);
                return(<label key={o.id} className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(e)=>{ const cur=new Set(arr); if(e.target.checked) cur.add(o.value); else cur.delete(o.value); setAnswer(q.id,Array.from(cur)); }}/>{o.label}</label>);})}</div>}
            </div>))}
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button className="btn-brand" onClick={handleSubmit}>שליחה</button>
      </div>
    </div>
  </BrandStyles>);}
