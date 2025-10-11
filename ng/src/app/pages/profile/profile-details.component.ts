import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { OCCUPATIONS, OTHER } from '../../core/constants/occupations.constant';
import { take } from 'rxjs/operators';

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
}

interface ProfileFormData {
  businessName?: string;
  mobile?: string;
  email?: string;
  website?: string;
  language: string;
  primaryColor?: string;
  secondaryColor?: string;
  brandColor?: string;
  logoUrl?: string;
  imageUrl?: string;
  occupation?: string;
  subOccupation?: string;
  urlSources?: string[];
  socialMedia?: SocialMedia;
}

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-details.component.html',
  styleUrl: './profile-details.component.sass'
})
export class ProfileDetailsComponent implements OnInit {
  formData: ProfileFormData = {
    businessName: '',
    mobile: '',
    email: '',
    website: '',
    language: 'he',
    primaryColor: '#199f3a',
    secondaryColor: '#9cbb54',
    brandColor: '#b0a0a4',
    logoUrl: '',
    imageUrl: '',
    occupation: '',
    subOccupation: '',
    urlSources: [],
    socialMedia: {
      facebook: '',
      instagram: '',
      linkedin: '',
      tiktok: '',
      youtube: ''
    }
  };

  occupations = OCCUPATIONS;
  OTHER = OTHER;
  currentUserId: string | null = null;
  saving = false;
  selectedFileName = '';
  selectedImageFileName = '';
  newLink = '';

  // Custom text fields for "Other" option
  customOccupation = '';
  customSubOccupation = '';

  // Error tracking for required fields
  errors = {
    businessName: false,
    email: false,
    mobile: false,
    occupation: false,
    subOccupation: false
  };

  get occupationKeys() {
    return Object.keys(OCCUPATIONS);
  }

  get subOccupations() {
    if (this.formData.occupation && this.formData.occupation !== OTHER && OCCUPATIONS[this.formData.occupation]) {
      return OCCUPATIONS[this.formData.occupation];
    }
    return [];
  }

  constructor(
    public lang: LanguageService,
    private router: Router,
    private supabaseService: SupabaseService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    // Load profile data from profiles table
    this.supabaseService.user$.pipe(take(1)).subscribe(async user => {
      if (user) {
        this.currentUserId = user.id;
        await this.loadProfileData(user.id);
      }
    });
  }

  async loadProfileData(userId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      if (data) {
        this.formData.businessName = data.company || '';
        this.formData.mobile = data.phone || '';
        this.formData.email = data.email || '';
        this.formData.website = data.website || '';
        this.formData.language = data.locale || 'he';
        this.formData.primaryColor = data.brand_primary || '#199f3a';
        this.formData.secondaryColor = data.brand_secondary || '#9cbb54';
        this.formData.brandColor = data.background_color || '#b0a0a4';
        this.formData.logoUrl = data.logo_url || '';
        this.formData.imageUrl = data.image_url || '';

        // Handle occupation
        const occupation = data.occupation || '';
        const suboccupation = data.suboccupation || '';

        // Check if occupation is a predefined category or custom value
        if (occupation && this.occupationKeys.includes(occupation)) {
          // It's a predefined occupation
          this.formData.occupation = occupation;

          // Handle suboccupation
          if (suboccupation && this.formData.occupation) {
            const validSubOccupations = OCCUPATIONS[this.formData.occupation] || [];
            if (validSubOccupations.includes(suboccupation)) {
              // It's a predefined sub-occupation
              this.formData.subOccupation = suboccupation;
            } else {
              // It's a custom sub-occupation - set to OTHER and populate custom field
              this.formData.subOccupation = OTHER;
              this.customSubOccupation = suboccupation;
            }
          } else {
            this.formData.subOccupation = suboccupation;
          }
        } else if (occupation) {
          // It's a custom occupation - set to OTHER and populate custom field
          this.formData.occupation = OTHER;
          this.customOccupation = occupation;
          this.formData.subOccupation = '';
        } else {
          this.formData.occupation = '';
          this.formData.subOccupation = '';
        }

        this.formData.urlSources = data.url_sources || [];
        this.formData.socialMedia = data.social_networks || {
          facebook: '',
          instagram: '',
          linkedin: '',
          tiktok: '',
          youtube: ''
        };
      }
    } catch (e: any) {
      console.error('Error loading profile data:', e);
    }
  }

  onOccupationChange() {
    this.clearError('occupation');
    this.formData.subOccupation = '';
    this.customSubOccupation = '';
  }

  onSubOccupationChange() {
    this.clearError('subOccupation');
  }

  clearError(field: keyof typeof this.errors) {
    this.errors[field] = false;
  }

  validateProfile(): boolean {
    const hasBusinessName = !!(this.formData.businessName || '').trim();
    const hasEmail = !!(this.formData.email || '').trim();
    const hasMobile = !!(this.formData.mobile || '').trim();

    // Check occupation - if OTHER, check custom field
    const occOk = this.formData.occupation === OTHER
                  ? !!(this.customOccupation || '').trim()
                  : !!(this.formData.occupation || '').trim();

    // Check suboccupation - only required if occupation is a predefined category
    const subOk = this.formData.occupation === OTHER || !this.occupationKeys.includes(this.formData.occupation || '') ? true :
                  (this.formData.subOccupation === OTHER
                    ? !!(this.customSubOccupation || '').trim()
                    : !!(this.formData.subOccupation || '').trim());

    this.errors = {
      businessName: !hasBusinessName,
      email: !hasEmail,
      mobile: !hasMobile,
      occupation: !occOk,
      subOccupation: !subOk
    };

    return hasBusinessName && hasEmail && hasMobile && occOk && subOk;
  }

  onLanguageChange(event: any) {
    const language = event.target.value;
    this.formData.language = language;
    const lang = language as 'en' | 'he';

    // Update language service (which will update localStorage and document direction)
    this.lang.setLanguage(lang);
  }

  addLink() {
    if (!this.formData.urlSources) {
      this.formData.urlSources = [];
    }
    this.formData.urlSources.push('');
  }

  removeLink(index: number) {
    if (this.formData.urlSources) {
      this.formData.urlSources.splice(index, 1);
    }
  }

  updateUrlSource(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (this.formData.urlSources) {
      this.formData.urlSources[index] = input.value;
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.selectedFileName = file.name;

    try {
      if (!this.currentUserId) {
        this.toast.show('Please log in to upload', 'error');
        return;
      }

      // Show preview immediately
      const objectUrl = URL.createObjectURL(file);
      this.formData.logoUrl = objectUrl;

      // Generate file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `users/${this.currentUserId}/logo.${fileExt}`;

      // Upload to Supabase storage in "branding" bucket
      const { error: uploadError } = await this.supabaseService.client.storage
        .from('branding')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || 'image/png'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = this.supabaseService.client.storage
        .from('branding')
        .getPublicUrl(filePath);

      this.formData.logoUrl = data.publicUrl;
      this.toast.show(this.lang.currentLanguage === 'he' ? 'הלוגו הועלה בהצלחה. לחץ שמור פרופיל כדי לקבע' : 'Logo uploaded successfully. Click Save Profile to confirm', 'success');
    } catch (e: any) {
      this.toast.show(e.message || String(e), 'error');
      this.selectedFileName = '';
      this.formData.logoUrl = '';
    }
  }

  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.selectedImageFileName = file.name;

    try {
      if (!this.currentUserId) {
        this.toast.show('Please log in to upload', 'error');
        return;
      }

      // Show preview immediately
      const objectUrl = URL.createObjectURL(file);
      this.formData.imageUrl = objectUrl;

      // Generate file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `users/${this.currentUserId}/image.${fileExt}`;

      // Upload to Supabase storage in "branding" bucket
      const { error: uploadError } = await this.supabaseService.client.storage
        .from('branding')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || 'image/png'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = this.supabaseService.client.storage
        .from('branding')
        .getPublicUrl(filePath);

      this.formData.imageUrl = data.publicUrl;
      this.toast.show(this.lang.currentLanguage === 'he' ? 'התמונה הועלתה בהצלחה. לחץ שמור פרופיל כדי לקבע' : 'Image uploaded successfully. Click Save Profile to confirm', 'success');
    } catch (e: any) {
      this.toast.show(e.message || String(e), 'error');
      this.selectedImageFileName = '';
      this.formData.imageUrl = '';
    }
  }

  async saveProfile() {
    try {
      this.saving = true;

      if (!this.currentUserId) {
        this.toast.show('Please log in to save', 'error');
        return;
      }

      // Validate profile before saving
      if (!this.validateProfile()) {
        this.toast.show(
          this.lang.currentLanguage === 'he'
            ? 'חובה למלא: שם עסק, אימייל, נייד, תחום ותת־תחום'
            : 'Required: business name, email, mobile, occupation and sub-occupation',
          'error'
        );
        return;
      }

      const profileData = {
        id: this.currentUserId,
        company: this.formData.businessName,
        phone: this.formData.mobile,
        email: this.formData.email,
        website: this.formData.website,
        locale: this.formData.language,
        brand_primary: this.formData.primaryColor,
        brand_secondary: this.formData.secondaryColor,
        background_color: this.formData.brandColor,
        logo_url: this.formData.logoUrl,
        image_url: this.formData.imageUrl,
        occupation: this.formData.occupation === OTHER ? this.customOccupation : this.formData.occupation,
        suboccupation: this.formData.subOccupation === OTHER ? this.customSubOccupation : this.formData.subOccupation,
        url_sources: this.formData.urlSources,
        social_networks: this.formData.socialMedia
      };

      console.log('Saving profile data:', profileData);

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select();

      console.log('Save result:', { data, error });

      if (error) throw error;

      this.toast.show(this.lang.currentLanguage === 'he' ? 'הפרופיל נשמר בהצלחה' : 'Profile saved successfully', 'success');
    } catch (e: any) {
      this.toast.show(e.message || String(e), 'error');
    } finally {
      this.saving = false;
    }
  }
}
