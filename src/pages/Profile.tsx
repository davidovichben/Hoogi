import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { upsertProfile, fetchProfile } from "../lib/profile";
import { toast } from "../hooks/use-toast";
import { safeToast } from "@/lib/rpc";
import { applyBrandingVars, sanitizeHex, normalizeLogoPath } from "@/lib/branding";

export default function ProfilePage() {
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [email, setEmail] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessSubCategory, setBusinessSubCategory] = useState("");
  const [businessOther, setBusinessOther] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // מאגר תחומים ותתי‑עיסוקים (ניתן להרחבה בעתיד)
  const CATEGORIES: { value: string; label: string; subs: { value: string; label: string }[] }[] = [
    { value: 'real_estate', label: 'נדל"ן', subs: [
      { value: 'agent', label: 'מתווך/ת' },
      { value: 'architect', label: 'אדריכל/ית' },
      { value: 'appraiser', label: 'שמאי/ת' },
      { value: 'developer', label: 'יזם/קבלן' },
      { value: 'property_management', label: 'ניהול נכסים' },
    ]},
    { value: 'law', label: 'משפטים', subs: [
      { value: 'family', label: 'דיני משפחה' },
      { value: 'real_estate_law', label: 'מקרקעין' },
      { value: 'labor', label: 'דיני עבודה' },
      { value: 'tort', label: 'נזיקין' },
      { value: 'commercial', label: 'מסחרי/חברות' },
    ]},
    { value: 'insurance', label: 'ביטוח', subs: [
      { value: 'life', label: 'חיים' },
      { value: 'health', label: 'בריאות' },
      { value: 'auto', label: 'רכב' },
      { value: 'home', label: 'דירה' },
      { value: 'travel', label: 'נסיעות' },
    ]},
    { value: 'coaching', label: 'אימון/ייעוץ', subs: [
      { value: 'business', label: 'אימון עסקי' },
      { value: 'personal', label: 'אימון אישי' },
      { value: 'career', label: 'קריירה' },
      { value: 'financial', label: 'כלכלי' },
    ]},
    { value: 'medical', label: 'רפואה/בריאות', subs: [
      { value: 'clinic', label: 'מרפאה/מרכז רפואי' },
      { value: 'therapist', label: 'מטפל/ת' },
      { value: 'dentist', label: 'רופא/ת שיניים' },
      { value: 'aesthetics', label: 'אסתטיקה רפואית' },
    ]},
    { value: 'fitness', label: 'כושר/רווחה', subs: [
      { value: 'trainer', label: 'מאמן/ת כושר' },
      { value: 'studio', label: 'סטודיו' },
      { value: 'yoga', label: 'יוגה/פילאטיס' },
    ]},
    { value: 'education', label: 'חינוך/הדרכה', subs: [
      { value: 'tutoring', label: 'שיעורים פרטיים' },
      { value: 'courses', label: 'קורסים/סדנאות' },
      { value: 'kindergarten', label: 'גני ילדים' },
    ]},
    { value: 'home_services', label: 'שירותי בית', subs: [
      { value: 'electrician', label: 'חשמלאי' },
      { value: 'plumber', label: 'אינסטלטור' },
      { value: 'cleaning', label: 'ניקיון' },
      { value: 'locksmith', label: 'מנעולן' },
    ]},
    { value: 'finance', label: 'כספים/חשבונאות', subs: [
      { value: 'accountant', label: 'רוא"ח/יועץ מס' },
      { value: 'bookkeeping', label: 'הנהלת חשבונות' },
      { value: 'mortgage', label: 'משכנתאות' },
    ]},
    { value: 'technology', label: 'טכנולוגיה/IT', subs: [
      { value: 'dev', label: 'פיתוח תוכנה' },
      { value: 'it', label: 'תמיכה/תשתיות' },
      { value: 'cyber', label: 'סייבר' },
    ]},
    { value: 'marketing', label: 'שיווק/עיצוב', subs: [
      { value: 'digital', label: 'דיגיטל' },
      { value: 'design', label: 'עיצוב גרפי/מותג' },
      { value: 'content', label: 'תוכן/קופירייטינג' },
    ]},
    { value: 'events', label: 'אירועים', subs: [
      { value: 'planner', label: 'הפקת אירועים' },
      { value: 'dj', label: 'די-ג׳יי/מוזיקה' },
      { value: 'decor', label: 'עיצוב/הפקה' },
    ]},
    { value: 'food', label: 'מסעדנות/קייטרינג', subs: [
      { value: 'restaurant', label: 'מסעדה/בתי קפה' },
      { value: 'catering', label: 'קייטרינג' },
      { value: 'bakery', label: 'מאפייה' },
    ]},
    { value: 'retail', label: 'קמעונאות/איקומרס', subs: [
      { value: 'shop', label: 'חנות פיזית' },
      { value: 'ecommerce', label: 'חנות אונליין' },
      { value: 'marketplace', label: 'שוק/מרקטפלייס' },
    ]},
    { value: 'construction', label: 'בנייה/הנדסה', subs: [
      { value: 'contractor', label: 'קבלן' },
      { value: 'engineer', label: 'מהנדס/ת' },
      { value: 'renovations', label: 'שיפוצים' },
    ]},
    { value: 'creative', label: 'צילום/קריאייטיב', subs: [
      { value: 'photography', label: 'צילום' },
      { value: 'video', label: 'וידאו' },
      { value: 'art', label: 'אמנות/מוזיקה' },
    ]},
    { value: 'other', label: 'אחר', subs: []},
  ];

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      if (!user.id) return;
      
      // טעינת נתוני פרופיל פעם אחת
      const { data } = await supabase.from("profiles")
        .select("brand_primary,brand_secondary,brand_logo_path,company,phone,business_category,business_subcategory,business_other")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setCompany(data.company ?? "");
        setPhone(data.phone ?? "");
        setLogoUrl(data.brand_logo_path ?? "");
        setPrimaryColor((data.brand_primary ?? "").replace(/#/g, "").toLowerCase());
        setSecondaryColor((data.brand_secondary ?? "").replace(/#/g, "").toLowerCase());
        setBusinessCategory(data.business_category ?? "");
        setBusinessSubCategory(data.business_subcategory ?? "");
        setBusinessOther(data.business_other ?? "");
        // מחיל צבעים מיד כדי לראות תוצאה גם לפני שמירה
        applyBrandingVars({ brand_primary: data.brand_primary, brand_secondary: data.brand_secondary });
      }
    })();
  }, []);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    try {
      if (!businessCategory) {
        (safeToast ? safeToast({ title: "יש לבחור תחום עיקרי", description: "תחום עיקרי הוא שדה חובה" }) : alert("יש לבחור תחום עיקרי"));
        return;
      }

      const p_primary = sanitizeHex(primaryColor);
      const p_secondary = sanitizeHex(secondaryColor);
      const p_logo_path = normalizeLogoPath(logoUrl);
      
      const { error } = await supabase.rpc("set_branding", { p_primary, p_secondary, p_logo_path });
      if (error) throw error;
      
      await upsertProfile(user.id, {
        company,
        phone,
        email,
        business_category: businessCategory,
        business_subcategory: businessSubCategory,
        business_other: businessOther,
        logo_url: p_logo_path,
        brand_primary: p_primary,
        brand_secondary: p_secondary,
      });
      
      // מחיל צבעים מיד בלי להמתין לטעינה מחדש
      applyBrandingVars({ brand_primary: p_primary, brand_secondary: p_secondary });
      (safeToast ? safeToast({ title: "נשמר", description: "מיתוג עודכן בהצלחה." }) : alert("נשמר"));
    } catch (e: any) {
      console.error(e);
      (safeToast ? safeToast({ title: "שמירת פרופיל", description: "צבעים חייבים HEX 3/6 ללא #. בדקי גם נתיב לוגו." }) : alert("שמירת פרופיל נכשלה"));
    }
  };

  async function fileToWebpBlob(file: File, maxW = 512, maxH = 512, quality = 0.8): Promise<Blob> {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = URL.createObjectURL(file);
    });
    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Blob failed")), "image/webp", quality);
    });
  }

  const handleUploadLogo = async (file: File) => {
    try {
      setUploadingLogo(true);
      // דחיסה/הקטנה בצד לקוח כדי לחסוך אחסון
      const webpBlob = await fileToWebpBlob(file, 512, 512, 0.85);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Not authenticated");
      const path = `branding/${user.id}/logo-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, webpBlob, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
      setLogoUrl(pub.publicUrl);
      toast({ title: "הלוגו הועלה בהצלחה" });
    } catch (e: any) {
      toast({ title: e?.message || "העלאת הלוגו נכשלה", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">פרופיל ומיתוג</h1>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>שם החברה</Label>
          <Input value={company} onChange={(e)=>setCompany(e.target.value)} placeholder="לדוגמה: iHoogi Ltd" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>מייל (מההרשמה)</Label>
            <Input value={email} readOnly className="opacity-80 cursor-not-allowed" />
          </div>
          <div className="grid gap-2">
            <Label>טלפון נייד</Label>
            <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="050-0000000" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>תחום עיקרי (חובה)</Label>
          <select
            className="border rounded-md h-10 px-2"
            value={businessCategory}
            onChange={(e)=>{ setBusinessCategory(e.target.value); setBusinessSubCategory(""); }}
            required
          >
            <option value="">בחר תחום</option>
            {CATEGORIES.map(c=> (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {businessCategory && businessCategory !== 'other' && (
          <div className="grid gap-2">
            <Label>תת‑עיסוק</Label>
            <select
              className="border rounded-md h-10 px-2"
              value={businessSubCategory}
              onChange={(e)=>setBusinessSubCategory(e.target.value)}
            >
              <option value="">בחר תת‑עיסוק</option>
              {CATEGORIES.find(c=>c.value===businessCategory)?.subs.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-2">
          <Label>אחר (טקסט חופשי)</Label>
          <Input value={businessOther} onChange={(e)=>setBusinessOther(e.target.value)} placeholder="כתבו במידה ונדרש פירוט נוסף" />
        </div>

        <div className="grid gap-2">
          <Label>לוגו</Label>
          <div className="flex items-center gap-3">
            <Input value={logoUrl} onChange={(e)=>setLogoUrl(e.target.value)} placeholder="branding/... או URL מלא" />
            <label className="px-3 py-2 rounded-md border cursor-pointer bg-background hover:bg-muted text-sm">
              {uploadingLogo ? 'מעלה…' : 'בחר קובץ'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e)=>{ const f=e.target.files?.[0]; if(f){ if (f.size > 2*1024*1024){ toast({ title: 'גודל קובץ מרבי: 2MB', variant: 'destructive' }); return; } handleUploadLogo(f);} }}
                disabled={uploadingLogo}
              />
            </label>
          </div>
          {logoUrl && (
            <div className="mt-2">
              <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>צבע ראשי</Label>
            <div className="flex items-center gap-3">
              <Input 
                value={primaryColor} 
                onChange={(e)=>setPrimaryColor(e.target.value.replace(/#/g, "").toLowerCase())} 
                placeholder="למשל: ffd500"
              />
              <input type="color" value={`#${primaryColor}`} onChange={(e)=>setPrimaryColor(e.target.value.replace(/#/g, "").toLowerCase())} className="h-10 w-14 rounded border" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>צבע משני</Label>
            <div className="flex items-center gap-3">
              <Input 
                value={secondaryColor} 
                onChange={(e)=>setSecondaryColor(e.target.value.replace(/#/g, "").toLowerCase())} 
                placeholder="למשל: a1a1a1"
              />
              <input type="color" value={`#${secondaryColor}`} onChange={(e)=>setSecondaryColor(e.target.value.replace(/#/g, "").toLowerCase())} className="h-10 w-14 rounded border" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} className="font-medium">שמור פרופיל</Button>
        </div>
      </div>
    </div>
  );
}
