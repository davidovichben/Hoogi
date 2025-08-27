import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BrandStyles from "@/components/BrandStyles";
import { toast } from "@/components/ui/Toaster";
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
  const handleSubmit=async()=>{ try{ setError(null); if(!id) throw new Error("חסר מזהה שאלון"); if(!token) throw new Error("חסר טוקן טופס");
      for(const q of questions){ if(q.required && (answers[q.id]===undefined||answers[q.id]===null||answers[q.id]==="")) throw new Error("נא למלא את כל השדות החיוניים."); }
      const {data:r,error:re}=await supabase.from("responses").insert({questionnaire_id:id,status:"submitted",respondent_contact:{name,email,phone,form_token:token}}).select("id").single(); if(re) throw re;
      const items=questions.map((q)=>{ const val=answers[q.id]; const base:any={response_id:r!.id,question_id:q.id}; switch(q.type){case "number": base.answer_number=Number(val);break;case "date": base.answer_date=val;break;case "text":case "long_text": base.answer_text=String(val??"");break;case "single_choice": base.answer_text=String(val??"");break;case "multi_choice": base.answer_json=Array.isArray(val)?val:[];break; default: base.answer_text=String(val??"");} return base;});
      const {error:ie}=await supabase.from("response_items").insert(items); if(ie) throw ie;
      if(email){ await supabase.functions.invoke("send-auto-reply",{ body:{ to:email, subject:"תודה! קיבלנו את הטופס", html:`<p>שלום ${name||""},</p><p>קיבלנו את הטופס שלך בהצלחה.</p><p>AI-4biz</p>` } }).catch(()=>{}); }
      toast.success("התשובה נשלחה בהצלחה. תודה!"); window.location.href="/";
    }catch(e:any){ setError(e.message||String(e)); } };
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
