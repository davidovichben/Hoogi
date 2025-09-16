// src/lib/profileSave.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type ProfileBrandingInput = {
  full_name?: string;
  company?: string;
  email?: string;
  phone?: string;

  // מיתוג
  brand_primary?: string;   // צבע ראשי
  brand_secondary?: string; // צבע משני
  brand_bg?: string;        // צבע רקע

  // לוגו (אחד מהשניים): או קובץ להעלאה או URL מוכן
  logoFile?: File | null;
  logo_url?: string | null;

  // אופציונלי: שדות נוספים קיימים אצלך
  business_category?: string | null;
  business_subcategory?: string | null;
  business_other?: string | null;
  default_locale?: string | null;
};

function getClient(): SupabaseClient {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string
  );
}

async function ensureBrandingBucket(supabase: SupabaseClient) {
  // אין create_bucket במופעים מסוימים, לכן נשתמש בהכנסת רשומה ל-buckets.
  // אם קיים — on conflict לא יזרוק.
  // נבצע רק ניסיון שקט; אין צורך לעצור את הזרימה אם נכשל.
  try {
    await supabase.rpc("noop"); // ייצור roundtrip קטנטן
  } catch { /* לא קריטי */ }
  try {
    // ננסה להכניס כמעטפת (עובד ב-Supabase PG מסוים דרך SQL, כאן נשאיר כהערה):
    // את ה-bucket נוודא דרך ה-SQL למטה. כאן לא נשבור כלום.
  } catch { /* לא קריטי */ }
}

function extFromFilename(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "png";
}

export async function saveProfile(input: ProfileBrandingInput) {
  const supabase = getClient();

  // 1) זהות משתמש
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error("לא נמצא משתמש מחובר");

  // 2) טיפול בלוגו: upload לקובץ אם ניתן, אחרת URL מוכן
  let logoUrl: string | undefined;

  if (input.logoFile && input.logoFile instanceof File) {
    await ensureBrandingBucket(supabase);
    const bucket = "branding";
    const ext = extFromFilename(input.logoFile.name || "logo.png");
    const objectPath = `users/${uid}/logo-${Date.now()}.${ext}`;

    // העלאה
    const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, input.logoFile, {
      cacheControl: "3600",
      upsert: true,
      contentType: input.logoFile.type || `image/${ext === "jpg" ? "jpeg" : ext}`
    });
    if (upErr) throw upErr;

    // public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    logoUrl = data?.publicUrl;
  } else if (typeof input.logo_url === "string" && input.logo_url.trim()) {
    // אם כבר יש URL מוכן
    logoUrl = input.logo_url.trim();
  }

  // 3) בניית payload לעדכון בטבלת profiles
  //   נעדכן רק שדות שיש להם ערך (לא נדרוס בטעות ל-null)
  const patch: Record<string, any> = {};

  if (input.full_name !== undefined) patch.full_name = input.full_name;
  if (input.company !== undefined) patch.company = input.company;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone;

  if (input.brand_primary !== undefined)   patch.brand_primary = (input.brand_primary || "").trim() || null;
  if (input.brand_secondary !== undefined) patch.brand_secondary = (input.brand_secondary || "").trim() || null;
  if (input.brand_bg !== undefined)        patch.brand_bg = (input.brand_bg || "").trim() || null;

  if (logoUrl !== undefined) patch.logo_url = logoUrl;

  if (input.business_category !== undefined)   patch.business_category = input.business_category;
  if (input.business_subcategory !== undefined)patch.business_subcategory = input.business_subcategory;
  if (input.business_other !== undefined)      patch.business_other = input.business_other;
  if (input.default_locale !== undefined)      patch.default_locale = input.default_locale;

  // 4) upsert לפי id או user_id — אצלך קיימים שניהם; נעדיף id=uid, ואם אין — ניצור
  //    הערה: אם RLS פעיל, צריך מדיניות שמאפשרת עדכון הרשומה של המשתמש (ראה SQL בהמשך)
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id,user_id")
    .or(`id.eq.${uid},user_id.eq.${uid}`)
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;

  let upsertRow: any;
  if (existing) {
    upsertRow = { ...patch, id: existing.id || uid, user_id: existing.user_id || uid };
  } else {
    upsertRow = { ...patch, id: uid, user_id: uid };
  }

  const { error: upErr } = await supabase.from("profiles").upsert(upsertRow, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (upErr) throw upErr;

  return { ok: true, logoUrl };
}
