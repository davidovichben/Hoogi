import { supabase } from "./supabaseClient";

export async function upsertProfile(
  userId: string,
  data: Partial<{
    full_name: string; company: string; phone: string; email: string; locale: string; business_category: string; business_subcategory: string; business_other: string;
    brand_primary: string; brand_secondary: string; brand_bg: string; logo_url: string;
    occupation: string; suboccupation: string;
  }>
) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...data }, { onConflict: "id" });
  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data || null;
}
