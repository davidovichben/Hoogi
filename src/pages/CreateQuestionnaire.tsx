import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserId, fetchProfileByUserId } from "@/lib/rpc";
import BrandStyles from "@/components/BrandStyles";
export default function CreateQuestionnaire(){
  const [title,setTitle]=useState(""); const [description,setDescription]=useState("");
  const [defaultLocale,setDefaultLocale]=useState("he"); const [isPublished,setIsPublished]=useState(true);
  const [brandPrimary,setBrandPrimary]=useState("#2563eb"); const [brandAccent,setBrandAccent]=useState("#f59e0b"); const [brandBackground,setBrandBackground]=useState("#ffffff");
  const [logoUrl,setLogoUrl]=useState<string>(""); const [logoUploading,setLogoUploading]=useState(false);
  const [logoCb, setLogoCb] = useState<number>(0);   // cache-buster לתמונה
  const [shareLink,setShareLink]=useState<string|null>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null);
  const [subLabel, setSubLabel] = useState<string>(""); // תת-תחום/אחר לתצוגה
  const logoTouched = useRef(false);
  const siteUrl = (import.meta as any).env?.VITE_SITE_URL || window.location.origin;
  // פונקציית עזר לרענון פרופיל
  async function refreshProfileUi() {
    const uid = await getUserId();
    if (!uid) return;
    const p = await fetchProfileByUserId(uid);

    // לוגו
    setLogoUrl(p?.logo_url || "");
    setLogoCb(Date.now()); // לפצח קאש אם ה-URL לא השתנה

    // תת-תחום / "אחר"
    const OTHER = "__other__";
    const sub =
      p?.suboccupation ??
      p?.business_subcategory ??
      p?.sub_category ??
      "";

    const subFree =
      p?.suboccupationFree ??
      p?.business_other ??
      "";

    const label =
      (sub === OTHER || sub?.toLowerCase() === "other")
        ? (subFree || "אחר")
        : (sub || "");

    setSubLabel(label);
  }

  const handleLogoUpload=async(file:File)=>{ 
    logoTouched.current = true;
    try{ setLogoUploading(true); const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("יש להיכנס למערכת כדי להעלות לוגו.");
    const path=`${user.id}/logos/${Date.now()}_${file.name.replace(/\s+/g,"_")}`; const {error:upErr}=await supabase.storage.from("branding").upload(path,file); if(upErr) throw upErr;
    const {data:pub}=await supabase.storage.from("branding").getPublicUrl(path); setLogoUrl(pub.publicUrl);}catch(e:any){setError(e.message||String(e));}finally{setLogoUploading(false);} };
  // טעינה ראשונית + האזנה לשמירה
  useEffect(() => {
    refreshProfileUi(); // טעינה ראשונית

    const onSaved = () => { refreshProfileUi(); };
    window.addEventListener("profile:saved", onSaved);
    return () => window.removeEventListener("profile:saved", onSaved);
  }, []);

  const handleCreate=async()=>{ setLoading(true); setError(null); try{
      const payload:any={title,description,default_locale:defaultLocale,is_published:isPublished,brand_logo_url:logoUrl,brand_primary:brandPrimary,brand_accent:brandAccent,brand_background:brandBackground};
      const {data, error}=await supabase.from("questionnaires").insert(payload).select("id, form_token").single(); if(error) throw error;
      setShareLink(`${siteUrl}/q/${data!.id}?t=${data!.form_token}`);}catch(e:any){setError(e.message||String(e));}finally{setLoading(false);} };
  return(<BrandStyles primary={brandPrimary} accent={brandAccent} background={brandBackground}>
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">יצירת שאלון חדש</h1>
          {subLabel ? (
            <span className="text-sm px-2 py-0.5 rounded border border-black/10">
              תת־תחום: {subLabel}
            </span>
          ) : null}
        </div>
        {logoUrl ? (
          <img
            alt="Logo"
            className="h-10 object-contain"
            src={`${logoUrl}${logoUrl.includes("?") ? "&" : "?"}cb=${logoCb}`}
          />
        ) : (
          <div className="text-sm opacity-70">ללא לוגו</div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2 card p-4">
          <label className="label">כותרת</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="למשל: שאלון התאמה ללקוח"/>
          <label className="label mt-3">תיאור</label><textarea className="input" rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="מה כולל השאלון / למי מיועד"/>
          <div className="mt-3 flex items-center gap-3">
            <div><label className="label">שפת ברירת מחדל</label><select className="input" value={defaultLocale} onChange={e=>setDefaultLocale(e.target.value)}><option value="he">עברית</option><option value="en">English</option></select></div>
            <label className="label flex items-center gap-2" style={{marginTop:"22px"}}><input type="checkbox" checked={isPublished} onChange={e=>setIsPublished(e.target.checked)}/> פומבי (ניתן למילוי)</label>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-medium mb-2">מיתוג</div>
          <label className="label">לוגו</label><input type="file" accept="image/*" onChange={e=>e.target.files&&handleLogoUpload(e.target.files[0])}/>{logoUploading&&<div className="text-sm mt-1">מעלה לוגו…</div>}
          {logoUrl&&<img src={logoUrl} className="mt-2 h-12 object-contain" />}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div><label className="label">Primary</label><input type="color" className="w-full h-10 rounded" value={brandPrimary} onChange={e=>setBrandPrimary(e.target.value)}/></div>
            <div><label className="label">Accent</label><input type="color" className="w-full h-10 rounded" value={brandAccent} onChange={e=>setBrandAccent(e.target.value)}/></div>
            <div><label className="label">Background</label><input type="color" className="w-full h-10 rounded" value={brandBackground} onChange={e=>setBrandBackground(e.target.value)}/></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3"><button className="btn-brand" disabled={loading || !title.trim()} onClick={handleCreate}>{loading?"יוצר...":"צור שאלון"}</button>{error&&<span className="text-red-600">{error}</span>}</div>
      {shareLink&&(<div className="mt-6 p-4 card"><div className="text-sm mb-2">קישור לשיתוף (טופס ציבורי):</div><code className="break-all">{shareLink}</code><div className="mt-2"><button className="border rounded px-3 py-1" onClick={()=>navigator.clipboard.writeText(shareLink)}>העתק קישור</button></div></div>)}
    </div>
  </BrandStyles>);}
