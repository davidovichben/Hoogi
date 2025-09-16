// src/lib/profileSave.ts
import { createClient } from "@supabase/supabase-js";

type Patch = {
  full_name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  // מיתוג
  brand_primary?: string | null;
  brand_secondary?: string | null;
  brand_bg?: string | null;
  logo_url?: string | null;
  // נוספים
  business_category?: string | null;
  business_subcategory?: string | null;
  business_other?: string | null;
  default_locale?: string | null;
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

/** מאתר את שורת הפרופיל: קודם id==uid, אם אין – user_id==uid, ואם אין – יוצר חדשה */
async function getOrCreateProfileRow(uid: string) {
  // 1) חיפוש לפי id
  let { data: row, error } = await supabase
    .from("profiles")
    .select("id,user_id")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  if (row) return row;

  // 2) חיפוש לפי user_id
  let r2 = await supabase
    .from("profiles")
    .select("id,user_id")
    .eq("user_id", uid)
    .maybeSingle();
  if (r2.error) throw r2.error;
  if (r2.data) return r2.data;

  // 3) אין רשומה – ניצור חדשה
  const insertRow = { id: uid, user_id: uid };
  const ins = await supabase
    .from("profiles")
    .insert(insertRow)
    .select("id,user_id")
    .single();
  if (ins.error) throw ins.error;
  return ins.data!;
}

/** שמירת פרופיל – מעדכן תמיד את השורה הנכונה ומחזיר את השורה המעודכנת לבדיקה */
export async function saveProfileStrict(patchIn: Patch) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error("לא נמצא משתמש מחובר");

  // ננקה רווחים; ריק => null (לא נכתוב מחרוזת ריקה לדאטה)
  const trimOrNull = (v?: string | null) =>
    v && v.trim() ? v.trim() : null;

  const patch: Patch = {
    full_name: trimOrNull(patchIn.full_name ?? null),
    company: trimOrNull(patchIn.company ?? null),
    email: trimOrNull(patchIn.email ?? null),
    phone: trimOrNull(patchIn.phone ?? null),
    brand_primary: trimOrNull(patchIn.brand_primary ?? null),
    brand_secondary: trimOrNull(patchIn.brand_secondary ?? null),
    brand_bg: trimOrNull(patchIn.brand_bg ?? null),
    logo_url: trimOrNull(patchIn.logo_url ?? null),
    business_category: trimOrNull(patchIn.business_category ?? null),
    business_subcategory: trimOrNull(patchIn.business_subcategory ?? null),
    business_other: trimOrNull(patchIn.business_other ?? null),
    default_locale: trimOrNull(patchIn.default_locale ?? null),
  };

  // מאתרים/יוצרים את שורת הפרופיל הנכונה
  const row = await getOrCreateProfileRow(uid);

  // קודם ננסה לעדכן לפי id (אם יש), אחרת לפי user_id
  let upd;
  if (row.id === uid) {
    upd = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", uid)
      .select("*")
      .single();
  } else {
    upd = await supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", uid)
      .select("*")
      .single();
  }
  if (upd.error) throw upd.error;

  // אימות: נבצע fetch טרי כדי לוודא שהערכים נשמרו (לוכד קאש/שכפולים)
  const verify = await supabase
    .from("profiles")
    .select("id,user_id,brand_primary,brand_secondary,brand_bg,logo_url,full_name,company,email,phone,updated_at")
    .or(`id.eq.${uid},user_id.eq.${uid}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (verify.error) throw verify.error;

  // בדיקות קצרות – אם משהו קריטי לא השתנה, נציף שגיאה עם פירוט
  const out = verify.data!;
  const mismatches: string[] = [];
  const check = (k: keyof Patch) => {
    // אם patch ביקש ערך (לא undefined), נוודא שהערך נשמר
    if (patchIn[k] !== undefined) {
      const want = trimOrNull(patchIn[k] as any);
      const got = trimOrNull((out as any)[k]);
      if ((want || null) !== (got || null)) mismatches.push(`${k}: expected "${want}", got "${got}"`);
    }
  };
  ["brand_primary","brand_secondary","brand_bg","logo_url","full_name","company","email","phone"].forEach(k => check(k as keyof Patch));

  if (mismatches.length) {
    throw new Error("עדכון פרופיל לא הוחל במלואו: " + mismatches.join(" | "));
  }

  return out; // השורה המעודכנת
}
