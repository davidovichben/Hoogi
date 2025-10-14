import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { OCCUPATIONS, OTHER } from '../constants/occupations.constant';

@Injectable({
  providedIn: 'root'
})
export class ProfileValidatorService {
  constructor(private supabaseService: SupabaseService) {}

  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('username, company, email, phone, occupation, suboccupation')
        .eq('id', userId)
        .single();

      if (error) return false;
      if (!data) return false;

      // Check required fields
      const hasUsername = !!(data.username || '').trim();
      const hasBusinessName = !!(data.company || '').trim();
      const hasEmail = !!(data.email || '').trim();
      const hasMobile = !!(data.phone || '').trim();
      const hasOccupation = !!(data.occupation || '').trim();

      // Suboccupation only required if occupation is a predefined category with suboccupations
      const occupationKeys = Object.keys(OCCUPATIONS);
      const isPredefinedOccupation = occupationKeys.includes(data.occupation || '');
      const needsSubOccupation = isPredefinedOccupation && OCCUPATIONS[data.occupation]?.length > 0;
      const hasSubOccupation = !needsSubOccupation || !!(data.suboccupation || '').trim();

      return hasUsername && hasBusinessName && hasEmail && hasMobile && hasOccupation && hasSubOccupation;
    } catch (e) {
      console.error('Error checking profile completion:', e);
      return false;
    }
  }
}
