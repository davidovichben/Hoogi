import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { OCCUPATIONS, OTHER } from '../../core/constants/occupations.constant';
import { ProfileWelcomeDialogComponent } from './profile-welcome-dialog.component';
import { ProfileCompletionDialogComponent } from './profile-completion-dialog.component';
import { take } from 'rxjs/operators';

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
}

interface ProfileFormData {
  username?: string;
  businessName?: string;
  mobile?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  language: string;
  primaryColor?: string;
  secondaryColor?: string;
  brandColor?: string;
  logoUrl?: string;
  imageUrl?: string;
  occupation?: string;
  subOccupation?: string;
  urlSources?: string[];
  fileSources?: string[];
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
    username: '',
    businessName: '',
    mobile: '',
    email: '',
    website: '',
    whatsapp: '',
    language: 'he',
    primaryColor: '#199f3a',
    secondaryColor: '#9cbb54',
    brandColor: '#b0a0a4',
    logoUrl: '',
    imageUrl: '',
    occupation: '',
    subOccupation: '',
    urlSources: [],
    fileSources: [],
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
  private welcomeDialogShown = false;
  private isFirstTimeCompletion = false;
  private originalFormData: string = '';

  // Separate fields for "Other" option textboxes
  customOccupation = '';
  customSubOccupation = '';

  // Error tracking for required fields
  errors = {
    username: false,
    businessName: false,
    email: false,
    mobile: false,
    occupation: false,
    subOccupation: false
  };

  // Error messages for validation
  errorMessages = {
    username: '',
    email: '',
    mobile: ''
  };

  get occupationKeys() {
    return Object.keys(OCCUPATIONS);
  }

  get subOccupations() {
    const occupation = this.formData.occupation;
    if (occupation && occupation !== OTHER && occupation in OCCUPATIONS) {
      return OCCUPATIONS[occupation as keyof typeof OCCUPATIONS];
    }
    return [];
  }

  constructor(
    public lang: LanguageService,
    private router: Router,
    private supabaseService: SupabaseService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    // Load profile data from profiles table
    this.supabaseService.user$.pipe(take(1)).subscribe(async user => {
      if (user) {
        this.currentUserId = user.id;
        await this.loadProfileData(user.id);

        // Check if profile is incomplete - this means first time completion
        const isProfileIncomplete = !this.checkProfileComplete();
        if (isProfileIncomplete) {
          this.isFirstTimeCompletion = true;

          // Show welcome dialog if profile is incomplete and dialog hasn't been shown yet
          if (!this.welcomeDialogShown) {
            this.showWelcomeDialog();
          }
        }
      }
    });
  }

  showWelcomeDialog() {
    this.welcomeDialogShown = true;
    this.dialog.open(ProfileWelcomeDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'welcome-dialog-panel',
      disableClose: false,
      autoFocus: false,
      hasBackdrop: true,
      backdropClass: 'welcome-dialog-backdrop'
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
        this.formData.username = data.username || '';
        this.formData.businessName = data.company || '';
        this.formData.mobile = data.phone || '';
        this.formData.email = data.email || '';
        this.formData.website = data.website || '';
        this.formData.whatsapp = data.whatsapp || '';
        this.formData.language = data.locale || 'he';
        this.formData.primaryColor = data.brand_primary || '#199f3a';
        this.formData.secondaryColor = data.brand_secondary || '#9cbb54';
        this.formData.brandColor = data.background_color || '#b0a0a4';
        // Add cache-busting timestamp to image URLs when loading
        this.formData.logoUrl = data.logo_url ? `${data.logo_url}?t=${Date.now()}` : '';
        this.formData.imageUrl = data.image_url ? `${data.image_url}?t=${Date.now()}` : '';

        // Handle occupation
        const occupation = data.occupation || '';
        const suboccupation = data.suboccupation || '';

        // Check if occupation is a predefined category or custom value
        if (occupation && this.occupationKeys.includes(occupation)) {
          // It's a predefined occupation
          this.formData.occupation = occupation;

          // Handle suboccupation
          if (suboccupation) {
            const validSubOccupations = occupation in OCCUPATIONS ? OCCUPATIONS[occupation as keyof typeof OCCUPATIONS] : [];
            if (validSubOccupations.includes(suboccupation)) {
              // It's a predefined sub-occupation
              this.formData.subOccupation = suboccupation;
            } else {
              // It's a custom sub-occupation - set dropdown to OTHER and populate custom field
              this.formData.subOccupation = OTHER;
              this.customSubOccupation = suboccupation;
            }
          } else {
            this.formData.subOccupation = '';
          }
        } else if (occupation) {
          // It's a custom occupation - set dropdown to OTHER and populate custom field
          this.formData.occupation = OTHER;
          this.customOccupation = occupation;
          this.formData.subOccupation = '';
        } else {
          this.formData.occupation = '';
          this.formData.subOccupation = '';
        }

        this.formData.urlSources = data.url_sources || [];
        this.formData.fileSources = data.file_sources || [];
        this.formData.socialMedia = data.social_networks || {
          facebook: '',
          instagram: '',
          linkedin: '',
          tiktok: '',
          youtube: ''
        };
      }

      // Store original data for change detection
      this.originalFormData = JSON.stringify({
        ...this.formData,
        customOccupation: this.customOccupation,
        customSubOccupation: this.customSubOccupation
      });
    } catch (e: any) {
      console.error('Error loading profile data:', e);
    }
  }

  onOccupationChange() {
    this.clearError('occupation');

    // Reset suboccupation when occupation changes
    this.formData.subOccupation = '';
    this.customSubOccupation = '';
  }

  onSubOccupationChange() {
    this.clearError('subOccupation');
  }

  clearError(field: keyof typeof this.errors) {
    this.errors[field] = false;
    // Clear error message if it exists
    if (field in this.errorMessages) {
      this.errorMessages[field as keyof typeof this.errorMessages] = '';
    }
  }

  validateUsernameOnBlur() {
    const validation = this.validateName(this.formData.username || '');
    this.errors.username = !validation.valid;
    this.errorMessages.username = validation.message;
  }

  async validateEmailOnBlur() {
    const validation = this.validateEmail(this.formData.email || '');
    this.errors.email = !validation.valid;
    this.errorMessages.email = validation.message;

    // If basic validation passes, check for duplicates
    if (validation.valid) {
      const exists = await this.checkEmailExists(this.formData.email || '');
      if (exists) {
        this.errors.email = true;
        this.errorMessages.email = this.lang.t('profile.emailAlreadyExists');
      }
    }
  }

  async validateMobileOnBlur() {
    const validation = this.validateIsraeliPhone(this.formData.mobile || '');
    this.errors.mobile = !validation.valid;
    this.errorMessages.mobile = validation.message;

    // If basic validation passes, check for duplicates
    if (validation.valid) {
      const exists = await this.checkMobileExists(this.formData.mobile || '');
      if (exists) {
        this.errors.mobile = true;
        this.errorMessages.mobile = this.lang.t('profile.mobileAlreadyExists');
      }
    }
  }

  // Check if email already exists in database (excluding current user)
  private async checkEmailExists(email: string): Promise<boolean> {
    if (!email || !this.currentUserId) return false;

    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .neq('id', this.currentUserId)
        .limit(1);

      if (error) {
        console.error('Error checking email:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (e) {
      console.error('Error checking email:', e);
      return false;
    }
  }

  // Check if mobile already exists in database (excluding current user)
  private async checkMobileExists(mobile: string): Promise<boolean> {
    if (!mobile || !this.currentUserId) return false;

    try {
      // Clean the phone number the same way we do for validation
      const cleanPhone = mobile.replace(/\D/g, '');

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .neq('id', this.currentUserId)
        .limit(1);

      if (error) {
        console.error('Error checking mobile:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (e) {
      console.error('Error checking mobile:', e);
      return false;
    }
  }

  // Validation methods
  private validateName(name: string): { valid: boolean; message: string } {
    if (!name || !name.trim()) {
      return {
        valid: false,
        message: this.lang.t('profile.requiredField')
      };
    }

    // Check for numbers or symbols (allow letters, spaces, hyphens, and apostrophes)
    const nameRegex = /^[\u0590-\u05FFa-zA-Z\s'\-]+$/;
    if (!nameRegex.test(name.trim())) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'שם חייב להכיל אותיות בלבד (ללא מספרים או סמלים)'
          : 'Name must contain only letters (no numbers or symbols)'
      };
    }

    return { valid: true, message: '' };
  }

  private validateEmail(email: string): { valid: boolean; message: string } {
    if (!email || !email.trim()) {
      return {
        valid: false,
        message: this.lang.t('profile.requiredField')
      };
    }

    // Standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין כתובת אימייל תקינה'
          : 'Please enter a valid email address'
      };
    }

    return { valid: true, message: '' };
  }

  private validateIsraeliPhone(phone: string): { valid: boolean; message: string } {
    if (!phone || !phone.trim()) {
      return {
        valid: false,
        message: this.lang.t('profile.requiredField')
      };
    }

    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');

    // Israeli mobile number validation (strict):
    // - Must be exactly 9 or 10 digits
    // - Must start with 05 (10 digits) or 5 (9 digits)
    // - Second digit after 05 or 5 must be 0-9 (carrier code)
    // - Followed by 7 more digits
    // Valid formats: 0501234567, 0521234567, 0541234567, etc.
    const israeliMobileRegex = /^(0?5[0-9]\d{7})$/;

    if (!israeliMobileRegex.test(cleanPhone)) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין מספר נייד ישראלי תקין (לדוגמה: 050-1234567)'
          : 'Please enter a valid Israeli mobile number (e.g., 050-1234567)'
      };
    }

    return { valid: true, message: '' };
  }

  // Check if profile is complete without setting error states
  checkProfileComplete(): boolean {
    // Validate username with name validation
    const usernameValidation = this.validateName(this.formData.username || '');
    const hasValidUsername = usernameValidation.valid;

    const hasBusinessName = !!(this.formData.businessName || '').trim();

    // Validate email with email validation
    const emailValidation = this.validateEmail(this.formData.email || '');
    const hasValidEmail = emailValidation.valid;

    // Validate mobile with phone validation
    const mobileValidation = this.validateIsraeliPhone(this.formData.mobile || '');
    const hasValidMobile = mobileValidation.valid;

    // Check occupation - if OTHER selected, check custom field, otherwise check dropdown
    const occOk = this.formData.occupation === OTHER
                  ? !!(this.customOccupation || '').trim()
                  : !!(this.formData.occupation || '').trim();

    // Check suboccupation - only required if occupation is a predefined category with suboccupations
    const needsSubOccupation = this.formData.occupation &&
                                this.formData.occupation !== OTHER &&
                                this.occupationKeys.includes(this.formData.occupation) &&
                                this.subOccupations.length > 0;
    const subOk = !needsSubOccupation ||
                  (this.formData.subOccupation === OTHER
                    ? !!(this.customSubOccupation || '').trim()
                    : !!(this.formData.subOccupation || '').trim());

    return hasValidUsername && hasBusinessName && hasValidEmail && hasValidMobile && occOk && subOk;
  }

  validateProfile(): boolean {
    // Validate username with name validation
    const usernameValidation = this.validateName(this.formData.username || '');
    const hasValidUsername = usernameValidation.valid;
    this.errorMessages.username = usernameValidation.message;

    const hasBusinessName = !!(this.formData.businessName || '').trim();

    // Validate email with email validation
    const emailValidation = this.validateEmail(this.formData.email || '');
    const hasValidEmail = emailValidation.valid;
    this.errorMessages.email = emailValidation.message;

    // Validate mobile with phone validation
    const mobileValidation = this.validateIsraeliPhone(this.formData.mobile || '');
    const hasValidMobile = mobileValidation.valid;
    this.errorMessages.mobile = mobileValidation.message;

    // Check occupation - if OTHER selected, check custom field, otherwise check dropdown
    const occOk = this.formData.occupation === OTHER
                  ? !!(this.customOccupation || '').trim()
                  : !!(this.formData.occupation || '').trim();

    // Check suboccupation - only required if occupation is a predefined category with suboccupations
    const needsSubOccupation = this.formData.occupation &&
                                this.formData.occupation !== OTHER &&
                                this.occupationKeys.includes(this.formData.occupation) &&
                                this.subOccupations.length > 0;
    const subOk = !needsSubOccupation ||
                  (this.formData.subOccupation === OTHER
                    ? !!(this.customSubOccupation || '').trim()
                    : !!(this.formData.subOccupation || '').trim());

    this.errors = {
      username: !hasValidUsername,
      businessName: !hasBusinessName,
      email: !hasValidEmail,
      mobile: !hasValidMobile,
      occupation: !occOk,
      subOccupation: !subOk
    };

    return hasValidUsername && hasBusinessName && hasValidEmail && hasValidMobile && occOk && subOk;
  }

  scrollToField(fieldName: string) {
    setTimeout(() => {
      const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - (window.innerHeight / 2 - element.offsetHeight / 2);

        this.smoothScrollTo(offsetPosition, 800, () => {
          element.focus();
        });
      }
    }, 100);
  }

  smoothScrollTo(targetPosition: number, duration: number, callback?: () => void) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    // Ease-in function
    const easeIn = (t: number): number => {
      return t * t * t; // cubic ease-in
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      const ease = easeIn(progress);
      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else if (callback) {
        callback();
      }
    };

    requestAnimationFrame(animation);
  }

  scrollToFirstError() {
    // Priority order for scrolling to errors
    const errorFields = ['username', 'businessName', 'email', 'mobile', 'occupation', 'subOccupation'];

    for (const field of errorFields) {
      if (this.errors[field as keyof typeof this.errors]) {
        this.scrollToField(field);
        break;
      }
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = true;
    }
  }

  hasUnsavedChanges(): boolean {
    const currentData = JSON.stringify({
      ...this.formData,
      customOccupation: this.customOccupation,
      customSubOccupation: this.customSubOccupation
    });
    return this.originalFormData !== '' && this.originalFormData !== currentData;
  }

  onLanguageChange(event: any) {
    const language = event.target.value;
    this.formData.language = language;
    const lang = language as 'en' | 'he';

    // Update language service (which will update localStorage and document direction)
    this.lang.setLanguage(lang);
  }

  addLink() {
    if (this.newLink.trim()) {
      if (!this.formData.urlSources) {
        this.formData.urlSources = [];
      }
      this.formData.urlSources.push(this.newLink.trim());
      this.newLink = '';
    }
  }

  removeLink(index: number) {
    if (this.formData.urlSources) {
      this.formData.urlSources.splice(index, 1);
    }
  }

  removeFile(index: number) {
    if (this.formData.fileSources) {
      this.formData.fileSources.splice(index, 1);
    }
  }

  getFileName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Remove timestamp prefix if exists
    const match = filename.match(/^\d+_(.+)$/);
    return match ? match[1] : filename;
  }

  getFileType(filename: string): 'pdf' | 'image' | 'other' {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    return 'other';
  }

  async onDataSourceFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    try {
      if (!this.currentUserId) {
        this.toast.show('Please log in to upload', 'error');
        return;
      }

      const files = Array.from(input.files);

      for (const file of files) {
        // Generate unique file path
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
        const filePath = `users/${this.currentUserId}/data-sources/${timestamp}_${file.name}`;

        // Upload to Supabase storage in "branding" bucket
        const { error: uploadError } = await this.supabaseService.client.storage
          .from('branding')
          .upload(filePath, file, {
            upsert: false,
            contentType: file.type
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = this.supabaseService.client.storage
          .from('branding')
          .getPublicUrl(filePath);

        if (!this.formData.fileSources) {
          this.formData.fileSources = [];
        }
        this.formData.fileSources.push(data.publicUrl);
      }

      this.toast.show(this.lang.t('profile.filesUploadedSuccess'), 'success');

      // Clear input
      input.value = '';
    } catch (e: any) {
      this.toast.show(e.message || String(e), 'error');
    }
  }

  resetLogo() {
    this.formData.logoUrl = '';
    this.selectedFileName = '';
  }

  resetProfileImage() {
    this.formData.imageUrl = '';
    this.selectedImageFileName = '';
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

      // Get public URL with cache-busting timestamp
      const { data } = this.supabaseService.client.storage
        .from('branding')
        .getPublicUrl(filePath);

      // Add timestamp to prevent browser caching of old image
      const cacheBustingUrl = `${data.publicUrl}?t=${Date.now()}`;
      this.formData.logoUrl = cacheBustingUrl;
      this.toast.show(this.lang.t('profile.logoUploadedSuccess'), 'success');
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

      // Get public URL with cache-busting timestamp
      const { data } = this.supabaseService.client.storage
        .from('branding')
        .getPublicUrl(filePath);

      // Add timestamp to prevent browser caching of old image
      const cacheBustingUrl = `${data.publicUrl}?t=${Date.now()}`;
      this.formData.imageUrl = cacheBustingUrl;
      this.toast.show(this.lang.t('profile.imageUploadedSuccess'), 'success');
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

      // Validate username
      const usernameValidation = this.validateName(this.formData.username || '');
      if (!usernameValidation.valid) {
        this.toast.show(usernameValidation.message, 'error');
        this.errors.username = true;
        this.scrollToField('username');
        return;
      }

      // Validate email
      const emailValidation = this.validateEmail(this.formData.email || '');
      if (!emailValidation.valid) {
        this.toast.show(emailValidation.message, 'error');
        this.errors.email = true;
        this.scrollToField('email');
        return;
      }

      // Check if email already exists
      const emailExists = await this.checkEmailExists(this.formData.email || '');
      if (emailExists) {
        this.toast.show(this.lang.t('profile.emailAlreadyExists'), 'error');
        this.errors.email = true;
        this.errorMessages.email = this.lang.t('profile.emailAlreadyExists');
        this.scrollToField('email');
        return;
      }

      // Validate mobile
      const mobileValidation = this.validateIsraeliPhone(this.formData.mobile || '');
      if (!mobileValidation.valid) {
        this.toast.show(mobileValidation.message, 'error');
        this.errors.mobile = true;
        this.scrollToField('mobile');
        return;
      }

      // Check if mobile already exists
      const mobileExists = await this.checkMobileExists(this.formData.mobile || '');
      if (mobileExists) {
        this.toast.show(this.lang.t('profile.mobileAlreadyExists'), 'error');
        this.errors.mobile = true;
        this.errorMessages.mobile = this.lang.t('profile.mobileAlreadyExists');
        this.scrollToField('mobile');
        return;
      }

      // Validate profile before saving
      if (!this.validateProfile()) {
        this.toast.show(this.lang.t('profile.requiredFieldsList'), 'error');
        this.scrollToFirstError();
        return;
      }

      // Clean phone number before saving
      const cleanedPhone = (this.formData.mobile || '').replace(/\D/g, '');

      // Helper function to remove timestamp query parameter before saving
      const cleanUrl = (url: string | undefined) => {
        if (!url) return '';
        return url.split('?')[0]; // Remove query parameters
      };

      const profileData = {
        id: this.currentUserId,
        username: this.formData.username,
        company: this.formData.businessName,
        phone: cleanedPhone,
        email: this.formData.email,
        website: this.formData.website,
        whatsapp: this.formData.whatsapp,
        locale: this.formData.language,
        brand_primary: this.formData.primaryColor,
        brand_secondary: this.formData.secondaryColor,
        background_color: this.formData.brandColor,
        logo_url: cleanUrl(this.formData.logoUrl),
        image_url: cleanUrl(this.formData.imageUrl),
        // Save custom values if OTHER is selected, otherwise save dropdown value
        occupation: this.formData.occupation === OTHER ? this.customOccupation : this.formData.occupation,
        suboccupation: this.formData.subOccupation === OTHER ? this.customSubOccupation : this.formData.subOccupation,
        url_sources: this.formData.urlSources,
        file_sources: this.formData.fileSources,
        social_networks: this.formData.socialMedia
      };

      console.log('Saving profile data:', profileData);

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select();

      console.log('Save result:', { data, error });

      if (error) throw error;

      // Update original data after successful save
      this.originalFormData = JSON.stringify({
        ...this.formData,
        customOccupation: this.customOccupation,
        customSubOccupation: this.customSubOccupation
      });

      // Check if this is the first time profile completion
      if (this.isFirstTimeCompletion) {
        // Show completion dialog and navigate to create questionnaire
        const dialogRef = this.dialog.open(ProfileCompletionDialogComponent, {
          width: '600px',
          maxWidth: '95vw',
          panelClass: 'welcome-dialog-panel',
          disableClose: false,
          autoFocus: false,
          hasBackdrop: true,
          backdropClass: 'welcome-dialog-backdrop'
        });

        // Navigate when dialog is closed
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/questionnaires/new']).then(() => {
            // Scroll to top after navigation
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        });
      } else {
        // Normal save message
        this.toast.show(this.lang.t('profile.savedSuccessfully'), 'success');
      }
    } catch (e: any) {
      this.toast.show(e.message || String(e), 'error');
    } finally {
      this.saving = false;
    }
  }
}
