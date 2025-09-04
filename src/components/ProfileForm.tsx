import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { fetchProfileByUserId, upsertProfile, getUserId } from "@/lib/rpc";
import { OCCUPATIONS } from "@/utils/occupations";
import { safeToast } from "@/utils/safeToast";
import { applyBrandingVars } from "@/lib/branding";

export type ProfileFormHandle = { save: () => Promise<boolean>; isValid: () => boolean; };
type Props = { mode?: "manage" | "onboarding"; onSaved?: (ok: boolean) => void; };

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

const ProfileForm = forwardRef<ProfileFormHandle, Props>(function ProfileForm({ mode = "manage", onSaved }, ref) {
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

      applyBrandingVars({
        brand_primary: normHex(p.brand_primary, "#000000"),
        brand_secondary: normHex(p.brand_secondary, "#000000"),
        background_color: normHex(p.background_color, "#ffffff"),
      });

      setLoading(false);
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

  function isValidForm() {
    const baseOk =
      (form.businessName || "").trim() &&
      (form.phone || "").trim() &&
      (form.email || "").trim();

    // לוגיקת "אחר": אם נבחר – חייבים טקסט חופשי
    const occOtherOk = form.occupation !== "__other__" || (form.suboccupationFree || "").trim();
    const subOtherOk =
      form.occupation === "__other__" ||
      form.suboccupation !== "__other__" ||
      (form.suboccupationFree || "").trim();

    return Boolean(baseOk && occOtherOk && subOtherOk);
  }

    async function handleSave(): Promise<boolean> {
    const userId = await getUserId();
    if (!userId) { safeToast("warning","לא נמצאה התחברות"); return false; }

    if (!isValidForm()) {
      safeToast("warning","חובה למלא: שם עסק, נייד, מייל, ושדות 'אחר' אם נבחרו");
      return false;
    }

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
        brandLogoPath: form.brandLogoPath || null,
        occupation: form.occupation === OTHER ? free : (form.occupation || null),
        suboccupation: subFinal || null,
      });

      safeToast("success","פרופיל נשמר");
      onSaved?.(true);
      return true;
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || e?.details || "שגיאה";
      safeToast("error", `שמירה נכשלה: ${msg}`);
      onSaved?.(false);
      return false;
    } finally {
      setSaving(false);
    }
  }

  useImperativeHandle(ref, () => ({ save: handleSave, isValid: () => isValidForm() }));

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

      {/* לוגו (URL) */}
      <div>
        <label className="block text-sm mb-1">לוגו (URL)</label>
        <input className="w-full rounded border px-3 py-2"
          value={form.brandLogoPath}
          onChange={e=> setForm({...form, brandLogoPath: e.target.value})}
          placeholder="/branding/xxx/logo.webp" />
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
