import { supabase } from '@/integrations/supabase/client';

// טיפוסים
type DbProfile = {
  id: string;
  user_id: string | null;
  business_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  suboccupation: string | null;
  category: string | null;
  subcategory: string | null;
  sub_category: string | null;
  business_category: string | null;
  business_subcategory: string | null;
  business_other: string | null;
  logo_url: string | null;
  brand_logo_path: string | null;
  reply_from_email: string | null;
  reply_from_name: string | null;
  is_profile_complete: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
  // מיתוג
  brand_primary?: string | null;
  brand_secondary?: string | null;
  brand_bg?: string | null;
  background_color?: string | null;
  brand_color?: string | null;
  brand_accent?: string | null;
};

type FormProfile = {
  businessName?: string;
  company?: string;
  email?: string;
  phone?: string;
  occupation?: string;
  suboccupation?: string;
  category?: string;
  subcategory?: string;
  businessCategory?: string;
  businessSubcategory?: string;
  businessOther?: string;
  logoUrl?: string;
  brandLogoPath?: string;
  replyFromEmail?: string;
  replyFromName?: string;
  // מיתוג
  brandPrimary?: string;
  brandSecondary?: string;
  brandBg?: string;
  backgroundColor?: string;
  brandColor?: string;
  brandAccent?: string;
};

const COL = {
  userId: 'user_id'
};

const emptyToNull = (v: any) => (v === '' || v === undefined ? null : v);

// DB → UI
function mapDbToForm(db?: Partial<DbProfile> | null): FormProfile {
  const s = db ?? {};
  return {
    businessName: s.business_name ?? s.company ?? '',
    company: s.company ?? '',
    email: s.email ?? '',
    phone: s.phone ?? '',
    occupation: s.occupation ?? s.business_category ?? '',
    suboccupation: s.suboccupation ?? s.business_subcategory ?? s.subcategory ?? s.sub_category ?? '',
    category: s.category ?? '',
    subcategory: s.subcategory ?? s.sub_category ?? '',
    businessCategory: s.business_category ?? '',
    businessSubcategory: s.business_subcategory ?? '',
    businessOther: s.business_other ?? '',
    logoUrl: s.logo_url ?? '',
    brandLogoPath: s.brand_logo_path ?? '',
    replyFromEmail: s.reply_from_email ?? '',
    replyFromName: s.reply_from_name ?? '',
    // מיתוג
    brandPrimary: s.brand_primary ?? s.brand_color ?? s.brand_accent ?? '',
    brandSecondary: s.brand_secondary ?? s.brand_accent ?? '',
    brandBg: s.brand_bg ?? s.background_color ?? '',
    backgroundColor: s.background_color ?? '',
    brandColor: s.brand_color ?? '',
    brandAccent: s.brand_accent ?? '',
  };
}

// UI → DB
function mapFormToDb(form: FormProfile): Partial<DbProfile> {
  const f = form || {};
  return {
    business_name: emptyToNull(f.businessName),
    company: emptyToNull(f.company),
    email: emptyToNull(f.email),
    phone: emptyToNull(f.phone),
    occupation: emptyToNull(f.occupation),
    suboccupation: emptyToNull(f.suboccupation),
    category: emptyToNull(f.category),
    subcategory: emptyToNull(f.subcategory),
    business_category: emptyToNull(f.businessCategory),
    business_subcategory: emptyToNull(f.businessSubcategory),
    business_other: emptyToNull(f.businessOther),
    logo_url: emptyToNull(f.logoUrl),
    brand_logo_path: emptyToNull(f.brandLogoPath),
    reply_from_email: emptyToNull(f.replyFromEmail),
    reply_from_name: emptyToNull(f.replyFromName),
    // מיתוג
    brand_primary: emptyToNull(f.brandPrimary),
    brand_secondary: emptyToNull(f.brandSecondary),
    brand_bg: emptyToNull(f.brandBg),
    background_color: emptyToNull(f.backgroundColor),
    brand_color: emptyToNull(f.brandColor),
    brand_accent: emptyToNull(f.brandAccent),
  };
}

function computeIsComplete(p: Partial<DbProfile>) {
  // קריטריונים לפרופיל מלא: שם עסק + אימייל + טלפון
  const needed = [p.business_name, p.email, p.phone];
  return needed.every(v => !!(v && String(v).trim()));
}

// טעינת פרופיל של המשתמש המחובר
export async function loadMyProfile(): Promise<FormProfile | null> {
  const { data: { user }, error: auErr } = await supabase.auth.getUser();
  if (auErr) throw auErr;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`id.eq.${user.id},${COL.userId}.eq.${user.id}`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && (error as any).code !== 'PGRST116') throw error;
  return mapDbToForm(data as any);
}

// שמירת פרופיל (UPSERT על PK=id; וגם ממלא user_id)
export async function saveMyProfile(form: FormProfile): Promise<void> {
  const { data: { user }, error: auErr } = await supabase.auth.getUser();
  if (auErr) throw auErr;
  if (!user) throw new Error('אין משתמש מחובר');

  const base = mapFormToDb(form);
  const payload: Partial<DbProfile> = {
    id: user.id,       // PK בפועל
    user_id: user.id,  // לתאימות עם סכמה קיימת
    ...base,
  };
  payload.is_profile_complete = computeIsComplete(payload);

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();

  if (error) throw error;
}

// שמירת מיתוג (צבעים + לוגו) - תמיד מתעדכן
export async function saveBranding(brandingData: {
  brandPrimary?: string;
  brandSecondary?: string;
  brandBg?: string;
  logoUrl?: string;
}): Promise<void> {
  const { data: { user }, error: auErr } = await supabase.auth.getUser();
  if (auErr) throw auErr;
  if (!user) throw new Error('אין משתמש מחובר');

  const brandingPayload = {
    brand_primary: emptyToNull(brandingData.brandPrimary),
    brand_secondary: emptyToNull(brandingData.brandSecondary),
    brand_bg: emptyToNull(brandingData.brandBg),
    logo_url: emptyToNull(brandingData.logoUrl),
  };

  // ניסיון עדכון לפי שני המפתחות (id/user_id)
  const { data: brandData, error: brandError } = await supabase
    .from('profiles')
    .update(brandingPayload)
    .or(`id.eq.${user.id},${COL.userId}.eq.${user.id}`)
    .select('id')
    .maybeSingle();

  // אם לא אותרה רשומה — נבצע upsert בטוח (לא משנה סכימה)
  if ((!brandData) && !brandError) {
    const upsertBranding = { 
      id: user.id, 
      [COL.userId]: user.id, 
      ...brandingPayload 
    };
    const { error: brandUpsertError } = await supabase
      .from('profiles')
      .upsert(upsertBranding, { onConflict: 'id' })
      .select('id')
      .single();
    if (brandUpsertError) {
      console.warn('Branding upsert failed, but continuing:', brandUpsertError);
    }
  } else if (brandError) {
    throw brandError;
  }
}
