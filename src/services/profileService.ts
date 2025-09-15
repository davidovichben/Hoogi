import { fetchProfileByUserId, getUserId } from "@/lib/rpc";

export interface Profile {
  id: string;
  business_name?: string;
  phone?: string;
  email?: string;
  locale?: string;
  occupation?: string;
  suboccupation?: string;
  other_text?: string;
  business_other?: string;
  domain_text?: string;
  suboccupationFree?: string;
  business_subcategory?: string;
  sub_category?: string;
  brand_primary?: string;
  brand_secondary?: string;
  brand_logo_path?: string;
  background_color?: string;
  links?: {title: string; url: string}[] | null; // JSONB
  created_at?: string;
  updated_at?: string;
}

export async function fetchProfile(): Promise<Profile | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;
    
    const profile = await fetchProfileByUserId(userId);
    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}
