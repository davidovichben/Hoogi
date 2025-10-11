import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { OTHER } from '../constants/occupations.constant';

@Injectable({
  providedIn: 'root'
})
export class ProfileValidatorService {
  constructor(private supabaseService: SupabaseService) {}

  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('company, email, phone, occupation, suboccupation')
        .eq('id', userId)
        .single();

      if (error) return false;
      if (!data) return false;

      // Check required fields
      const hasBusinessName = !!(data.company || '').trim();
      const hasEmail = !!(data.email || '').trim();
      const hasMobile = !!(data.phone || '').trim();
      const hasOccupation = !!(data.occupation || '').trim();

      // Suboccupation only required if occupation is not "other"
      const hasSubOccupation = data.occupation === OTHER || !!(data.suboccupation || '').trim();

      return hasBusinessName && hasEmail && hasMobile && hasOccupation && hasSubOccupation;
    } catch (e) {
      console.error('Error checking profile completion:', e);
      return false;
    }
  }
}
