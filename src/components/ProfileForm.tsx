import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { fetchProfileByUserId, upsertProfile, getUserId } from "@/lib/rpc";
import { OCCUPATIONS } from "@/utils/occupations";
import { showSuccess, showError } from "@/lib/toast";
import { applyBrandingVars } from "@/lib/branding";
import { supabase } from "@/integrations/supabase/client";

export type ProfileFormHandle = {
  save: () => Promise<boolean>;
  isValid: () => boolean;
  isDirty: () => boolean;
};
type Props = { mode?: "manage" | "onboarding"; onSaved?: (ok: boolean) => void; toast?: any; };

const OTHER = "__other__";
const normHex = (v?: string, fb = "#ffffff") => {
  if (!v || typeof v !== 'string') return fb;
  let h = v.trim();
  if (!h) return fb;
  
  // הסרת תווים לא רלוונטיים
  h = h.replace(/[^0-9a-fA-F#]/g, '');
  
  // הוספת # אם חסר
  if (!h.startsWith("#")) {
    h = `#${h}`;
  }
  
  // הסרת # נוספים
  h = h.replace(/#+/g, '#');
  
  // וידוא שיש בדיוק 7 תווים (#xxxxxx) או 4 תווים (#xxx)
  if (h.length === 7 && /^#[0-9a-fA-F]{6}$/.test(h)) {
    return h.toLowerCase();
  } else if (h.length === 4 && /^#[0-9a-fA-F]{3}$/.test(h)) {
    return h.toLowerCase();
  } else if (h.length > 4) {
    // נסה לחתוך ל-6 תווים
    const fixed = '#' + h.substring(1, 7).padEnd(6, '0');
    if (/^#[0-9a-fA-F]{6}$/.test(fixed)) {
      return fixed.toLowerCase();
    }
  }
  
  // אם כלום לא עבד, החזר ברירת מחדל
  console.warn(`Invalid hex color: ${v}, using fallback: ${fb}`);
  return fb;
};

const ProfileForm = forwardRef<ProfileFormHandle, Props>(function ProfileForm({ mode = "manage", onSaved, toast }, ref) {
  const [form, setForm] = useState({
    businessName: "",
    phone: "",
    email: "",
    website: "",
    locale: "he-IL",
    occupation: "",
    suboccupation: "",
    occupationFree: "",           // טקסט חופשי לתחום "אחר"
    suboccupationFree: "",        // טקסט חופשי לתת-תחום "אחר"
    brandPrimary: "#000000",
    brandSecondary: "#000000",
    backgroundColor: "#ffffff",
    brandLogoPath: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [links, setLinks] = useState<{title: string; url: string}[]>([]);
  const initialSnap = useRef<string>("");
  const logoTouched = useRef(false);

  function snapshot() {
    const pick = {
      businessName: form.businessName,
      phone: form.phone,
      email: form.email,
      website: form.website,
      locale: form.locale,
      occupation: form.occupation,
      suboccupation: form.suboccupation,
      occupationFree: form.occupationFree,
      suboccupationFree: form.suboccupationFree,
      brandPrimary: form.brandPrimary,
      brandSecondary: form.brandSecondary,
      backgroundColor: form.backgroundColor,
      brandLogoPath: form.brandLogoPath,
      links: links,
    };
    return JSON.stringify(pick);
  }

  async function resolveLogoUrl(path?: string | null) {
    if (!path) return setLogoUrl("");
    const bucket = "branding";
    try {
      // נסי קודם publicUrl
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      if (pub?.publicUrl) return setLogoUrl(pub.publicUrl);
      
      // אחרת חתום זמנית ל-60 דקות
      const { data: signed, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
      if (!error && signed?.signedUrl) setLogoUrl(signed.signedUrl);
    } catch (e) {
      console.warn("Failed to resolve logo URL:", e);
    }
  }

  // טעינת פרופיל קיים
  useEffect(() => {
    let alive = true;
    (async () => {
      const userId = await getUserId();
      if (!userId) { setLoading(false); return; }
      const p = await fetchProfileByUserId(userId);
      if (!alive) return;
      if (!p) { setLoading(false); return; }

      const occKeys = Object.keys(OCCUPATIONS);
      let occupation = p.occupation ?? "";
      let suboccupation = p.suboccupation ?? "";
      let occupationFree = "";
      let suboccupationFree = "";

      // תמיכה היסטורית: אם הערך לא ברשימה – הפכי ל"אחר" עם טקסט חופשי
      if (occupation && !occKeys.includes(occupation)) {
        occupationFree = occupation;
        occupation = OTHER;
        suboccupation = "";
      } else if (occupation && suboccupation) {
        const list = OCCUPATIONS[occupation] ?? [];
        if (!list.includes(suboccupation)) {
          suboccupationFree = suboccupation;
          suboccupation = OTHER;
        }
      }

      setForm(prev => ({
        ...prev,
        businessName: p.business_name ?? "",
        phone: p.phone ?? "",
        email: p.email ?? "",
        website: p.website ?? "",
        locale: p.locale ?? "he-IL",
        occupation,
        suboccupation,
        occupationFree,
        suboccupationFree,
        brandPrimary: normHex(p.brand_primary, "#000000"),
        brandSecondary: normHex(p.brand_secondary, "#000000"),
        backgroundColor: normHex(p.background_color, "#ffffff"),
        brandLogoPath: p.brand_logo_path ?? "",
      }));

      // לוגו להצגה: אם יש logo_url – קודם; אחרת נגזור URL ציבורי מה־path
      if (!logoTouched.current) {
        if (p.logo_url && typeof p.logo_url === "string" && p.logo_url.trim()) {
          setLogoUrl(p.logo_url.trim());
        } else if (p.brand_logo_path) {
          void resolveLogoUrl(p.brand_logo_path);
        } else {
          setLogoUrl("");
        }
      }

      // טעינת קישורים
      setLinks(Array.isArray(p.links) ? p.links : []);

      applyBrandingVars({
        brand_primary: normHex(p.brand_primary, "#000000"),
        brand_secondary: normHex(p.brand_secondary, "#000000"),
        background_color: normHex(p.background_color, "#ffffff"),
      });

      setLoading(false);
      initialSnap.current = snapshot();
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    applyBrandingVars({
      brand_primary: normHex(form.brandPrimary, "#000000"),
      brand_secondary: normHex(form.brandSecondary, "#000000"),
      background_color: normHex(form.backgroundColor, "#ffffff"),
    });
  }, [form.brandPrimary, form.brandSecondary, form.backgroundColor]);

  // טעינת לוגו כשמתעדכן ה-path
  useEffect(() => {
    void resolveLogoUrl(form.brandLogoPath);
  }, [form.brandLogoPath]);

  function isValidForm(): boolean {
    const OTHER = "__other__";

    const missing: string[] = [];
    const nameOk = (form.businessName || "").trim();
    const emailOk = (form.email || "").trim();
    const phoneOk = (form.phone || "").trim();

    const occ = (form.occupation || "").trim();
    const sub = (form.suboccupation || "").trim();
    const occFree = (form.occupationFree || "").trim();
    const subFree = (form.suboccupationFree || "").trim();

    // תחום ותת־תחום תמיד חובה
    let occOk = !!occ;
    let subOk = !!sub;

    // אם נבחר "אחר" בתחום — שדה הטקסט החופשי של תחום חובה, ותת־תחום לא נכפה
    if (occ === OTHER) {
      occOk = !!occFree;
      // אם תת־תחום נבחר "אחר" — גם שדה הטקסט שלו חובה
      if (sub === OTHER) subOk = !!subFree;
      // אם לא נבחר תת־תחום בכלל — עדיין נדרוש אחד מהשניים: sub או subFree
      if (!sub && !subFree) subOk = false;
    } else {
      // תחום רגיל: תת־תחום חובה; אם תת־תחום == "אחר" — דורשים subFree
      if (sub === OTHER) subOk = !!subFree;
    }

    if (!nameOk) missing.push("שם עסק");
    if (!emailOk) missing.push("אימייל");
    if (!phoneOk) missing.push("נייד");
    if (!occOk) missing.push("תחום");
    if (!subOk) missing.push("תת־תחום");

    if (missing.length) {
      showError(`חסר/שגוי: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

    async function handleSave(): Promise<boolean> {
    const userId = await getUserId();
    if (!userId) { showError("לא נמצאה התחברות"); return false; }

    if (!isValidForm()) return false;

    setSaving(true);
    try {
      const OTHER = "__other__";
      const free = (form.suboccupationFree || "").trim();
      const subFinal =
        form.occupation === OTHER || form.suboccupation === OTHER
          ? free
          : (form.suboccupation || "").trim();

      await upsertProfile({
        userId,
        businessName: (form.businessName || "").trim(),
        phone: String(form.phone || "").trim(),
        email: String(form.email || "").trim(),
        website: String(form.website || "").trim(),
        locale: String(form.locale || "he-IL").trim(),
        brandPrimary: form.brandPrimary,
        brandSecondary: form.brandSecondary,
        backgroundColor: form.backgroundColor,
        logoUrl: (logoUrl || "").trim() || null,   // ← חדש
        brandLogoPath: form.brandLogoPath || null,
        occupation: form.occupation === OTHER ? free : (form.occupation || null),
        suboccupation: subFinal || null,
        links: links.length > 0 ? links : null,
      });

      if (toast) {
        toast({
          title: "הצלחה",
          description: "פרופיל נשמר בהצלחה",
        });
      } else {
        showSuccess("✔ הפרופיל נשמר בהצלחה");
      }
      window.dispatchEvent(new Event("profile:saved")); // ליידע עמודים אחרים
      onSaved?.(true);
      initialSnap.current = snapshot();
      return true;
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || e?.details || "שגיאה";
      if (toast) {
        toast({
          title: "שגיאה",
          description: `שמירה נכשלה: ${msg}`,
          variant: "destructive"
        });
      } else {
        showError("שמירת פרופיל נכשלה");
      }
      onSaved?.(false);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoFile(file?: File | null) {
    try {
      if (!file) return;
      
      // תצוגה מיידית
      const objectUrl = URL.createObjectURL(file);
      setLogoUrl(objectUrl);
      
      setUploadingLogo(true);
      const userId = await getUserId();
      if (!userId) { showError("לא נמצאה התחברות"); return; }
      
      const ext = (file.name?.split(".").pop() || "png").toLowerCase();
      const path = `users/${userId}/logo.${ext}`; // בתוך bucket "branding"
      const { error } = await supabase.storage.from("branding").upload(path, file, {
        upsert: true,
        contentType: file.type || "image/png",
      });
      if (error) throw error;
      
      setForm(prev => ({ ...prev, brandLogoPath: path }));
      showSuccess("✔ הלוגו הוחלף בתצוגה. לחצי 'שמור פרופיל' כדי לקבע.");
    } catch (e: any) {
      console.error(e);
      showError("החלפת לוגו נכשלה");
    } finally {
      setUploadingLogo(false);
    }
  }

  // פונקציות לניהול קישורים
  function addLink() {
    setLinks(prev => [...prev, { title: "", url: "" }]);
  }

  function updateLink(i: number, key: "title" | "url", val: string) {
    setLinks(prev => prev.map((x, idx) => idx === i ? { ...x, [key]: val } : x));
  }

  function removeLink(i: number) {
    setLinks(prev => prev.filter((_, idx) => idx !== i));
  }

  useImperativeHandle(ref, () => ({
    save: handleSave,
    isValid: () => isValidForm(),
    isDirty: () => initialSnap.current !== snapshot(),
  }));

  if (loading) return <div className="p-6 text-center">טוען…</div>;

  return (
    <div dir="rtl" className="space-y-4">
      {/* שם העסק */}
      <div>
        <label className="block text-sm mb-1">שם העסק *</label>
        <input className="w-full rounded border px-3 py-2"
          value={form.businessName}
          onChange={e=> setForm({...form, businessName: e.target.value})}
          placeholder="שם העסק" />
      </div>

      {/* נייד + מייל */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">נייד *</label>
          <input className="w-full rounded border px-3 py-2"
            value={form.phone}
            onChange={e=> setForm({...form, phone: e.target.value})}
            placeholder="050-0000000" />
        </div>
        <div>
          <label className="block text-sm mb-1">מייל *</label>
          <input className="w-full rounded border px-3 py-2"
            value={form.email}
            onChange={e=> setForm({...form, email: e.target.value})}
            placeholder="you@example.com" />
        </div>
      </div>

      {/* אתר + שפה */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">אתר</label>
          <input className="w-full rounded border px-3 py-2"
            value={form.website}
            onChange={e=> setForm({...form, website: e.target.value})}
            placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm mb-1">שפה</label>
          <input className="w-full rounded border px-3 py-2"
            value={form.locale}
            onChange={e=> setForm({...form, locale: e.target.value})}
            placeholder="he-IL" />
        </div>
      </div>

      {/* תחום / תת־תחום + "אחר" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">תחום</label>
          <select className="w-full rounded border px-3 py-2"
            value={form.occupation}
            onChange={e=> setForm({...form, occupation: e.target.value, suboccupation: "", occupationFree: "", suboccupationFree: ""})}>
            <option value="" disabled>בחר תחום</option>
            {Object.keys(OCCUPATIONS).map(k => <option key={k} value={k}>{k}</option>)}
            <option value={OTHER}>אחר</option>
          </select>
          {form.occupation === OTHER && (
            <input className="mt-2 w-full rounded border px-3 py-2"
              placeholder="כתבי את התחום"
              value={form.occupationFree}
              onChange={e=> setForm({...form, occupationFree: e.target.value})}/>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">תת־תחום</label>
          {form.occupation && form.occupation !== OTHER ? (
            <>
              <select className="w-full rounded border px-3 py-2"
                value={form.suboccupation}
                onChange={e=> setForm({...form, suboccupation: e.target.value})}>
                <option value="" disabled>בחרי תת־תחום</option>
                {(OCCUPATIONS[form.occupation] || []).map(s => <option key={s} value={s}>{s}</option>)}
                <option value={OTHER}>אחר</option>
              </select>
              {form.suboccupation === OTHER && (
                <input className="mt-2 w-full rounded border px-3 py-2"
                  placeholder="כתבי תת־תחום"
                  value={form.suboccupationFree}
                  onChange={e=> setForm({...form, suboccupationFree: e.target.value})}/>
              )}
            </>
          ) : (
            <input className="w-full rounded border px-3 py-2" disabled placeholder="בחרי תחום קודם" />
          )}
        </div>
      </div>

      {/* צבעים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">צבע ראשי</label>
          <div className="flex items-center gap-3">
            <input type="color"
              value={normHex(form.brandPrimary, "#000000")}
              onChange={e=> setForm({...form, brandPrimary: e.target.value})}/>
            <div className="w-8 h-8 rounded border" style={{ background: normHex(form.brandPrimary, "#000000") }} />
            <span className="text-xs">{normHex(form.brandPrimary, "#000000")}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">צבע משני</label>
          <div className="flex items-center gap-3">
            <input type="color"
              value={normHex(form.brandSecondary, "#000000")}
              onChange={e=> setForm({...form, brandSecondary: e.target.value})}/>
            <div className="w-8 h-8 rounded border" style={{ background: normHex(form.brandSecondary, "#000000") }} />
            <span className="text-xs">{normHex(form.brandSecondary, "#000000")}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">צבע רקע (דיפולט לבן)</label>
          <div className="flex items-center gap-3">
            <input type="color"
              value={normHex(form.backgroundColor, "#ffffff")}
              onChange={e=> setForm({...form, backgroundColor: e.target.value})}/>
            <div className="w-8 h-8 rounded border" style={{ background: normHex(form.backgroundColor, "#ffffff") }} />
            <span className="text-xs">{normHex(form.backgroundColor, "#ffffff")}</span>
          </div>
        </div>
      </div>

      {/* לוגו (קובץ או URL) */}
      <div>
        <label className="block text-sm mb-1">לוגו</label>

        {/* תצוגת לוגו קיים */}
        {logoUrl && (
          <div className="mb-3 p-2 border rounded bg-gray-50">
            <img 
              src={logoUrl} 
              alt="לוגו" 
              className="h-12 w-auto object-contain"
              onError={() => setLogoUrl("")}
            />
          </div>
        )}

        <div className="flex items-center gap-3 mb-2">
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              logoTouched.current = true;
              void handleLogoFile(f);
            }}
            disabled={uploadingLogo}
          />
          {uploadingLogo && <span className="text-xs text-slate-500">מעלה…</span>}
        </div>

        <label className="block text-xs mb-1 text-slate-600">או הזיני כתובת URL</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={form.brandLogoPath}
          onChange={e=> setForm({...form, brandLogoPath: e.target.value})}
          placeholder="users/<user_id>/logo.png או https://..."
        />
      </div>

      {/* קישורים */}
      <div style={{ marginTop: 16 }}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm">קישורים (אתר/רשתות/דפי נחיתה)</label>
          <button type="button" onClick={addLink} className="text-sm text-teal-600 hover:text-teal-800">
            + הוספת קישור
          </button>
        </div>

        {links.map((l, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-2 items-center mb-2">
            <input
              className="rounded border px-3 py-2"
              placeholder="כותרת (לדוגמה: אתר, פייסבוק, לינקדאין)"
              value={l.title}
              onChange={e => updateLink(i, "title", e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded border px-3 py-2"
                placeholder="https://example.com"
                value={l.url}
                onChange={e => updateLink(i, "url", e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => removeLink(i)}
                className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
              >
                מחק
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button type="button" onClick={() => void handleSave()} disabled={saving}
          className="rounded bg-teal-600 text-white px-4 py-2 disabled:opacity-50">
          שמור פרופיל
        </button>
      </div>
    </div>
  );
});

export default ProfileForm;
