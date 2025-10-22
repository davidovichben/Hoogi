import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { LandingHeroComponent } from '../../shared/components/landing-hero/landing-hero.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, LandingHeroComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.sass']
})
export class RegisterComponent {
  fullName = '';
  email = '';
  emailConfirm = '';
  password = '';
  passwordConfirm = '';
  language = 'עברית';
  agreeToTerms = false;
  agreeToMarketing = true;
  isLoading = false;

  emailTouched = false;
  emailConfirmTouched = false;
  passwordTouched = false;
  passwordConfirmTouched = false;
  showPassword = false;
  showPasswordConfirm = false;
  emailExistsError = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public lang: LanguageService,
    private toast: ToastService,
    private supabaseService: SupabaseService
  ) {}

  validateEmail(email: string): boolean {
    // Check for consecutive dots
    if (/\.\./.test(email)) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): { valid: boolean; error: string | null } {
    if (!password) {
      return { valid: false, error: this.lang.t('register.errors.passwordRequired') };
    }
    if (password.length < 8) {
      return { valid: false, error: this.lang.t('register.errors.passwordTooShort') };
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);

    if (!hasLetters || !hasNumbers) {
      return { valid: false, error: this.lang.t('register.errors.passwordLettersAndNumbers') };
    }

    return { valid: true, error: null };
  }

  get emailError(): string | null {
    if (this.emailExistsError) return this.lang.t('register.errors.emailExists');
    if (!this.emailTouched) return null;
    if (!this.email.trim()) return this.lang.t('register.errors.emailRequired');
    if (!this.validateEmail(this.email)) return this.lang.t('register.errors.emailInvalid');
    return null;
  }

  get emailConfirmError(): string | null {
    if (!this.emailConfirmTouched) return null;
    if (!this.emailConfirm.trim()) return this.lang.t('register.errors.emailConfirmRequired');
    if (!this.validateEmail(this.emailConfirm)) return this.lang.t('register.errors.emailInvalid');
    if (this.email && this.emailConfirm && this.email !== this.emailConfirm) {
      return this.lang.t('register.errors.emailMismatch');
    }
    return null;
  }

  onEmailBlur() {
    this.emailTouched = true;
  }

  onEmailChange() {
    this.emailExistsError = false;
  }

  onEmailConfirmBlur() {
    this.emailConfirmTouched = true;
  }

  onPasswordBlur() {
    this.passwordTouched = true;
  }

  onPasswordConfirmBlur() {
    this.passwordConfirmTouched = true;
  }

  get passwordError(): string | null {
    if (!this.passwordTouched) return null;
    const validation = this.validatePassword(this.password);
    return validation.error;
  }

  get passwordConfirmError(): string | null {
    if (!this.passwordConfirmTouched) return null;
    if (!this.passwordConfirm) return this.lang.t('register.errors.passwordRequired');
    if (this.password && this.passwordConfirm && this.password !== this.passwordConfirm) {
      return this.lang.t('register.errors.passwordMismatch');
    }
    return null;
  }

  async handleRegister() {
    // Mark fields as touched for validation
    this.emailTouched = true;
    this.emailConfirmTouched = true;
    this.passwordTouched = true;
    this.passwordConfirmTouched = true;

    if (!this.fullName.trim()) {
      this.toast.show(this.lang.t('register.errors.fullNameRequired'), 'error');
      return;
    }

    if (!this.email.trim()) {
      this.toast.show(this.lang.t('register.errors.emailRequired'), 'error');
      return;
    }

    if (!this.validateEmail(this.email)) {
      this.toast.show(this.lang.t('register.errors.emailInvalid'), 'error');
      return;
    }

    if (!this.emailConfirm.trim()) {
      this.toast.show(this.lang.t('register.errors.emailConfirmRequired'), 'error');
      return;
    }

    if (!this.validateEmail(this.emailConfirm)) {
      this.toast.show(this.lang.t('register.errors.emailInvalid'), 'error');
      return;
    }

    if (this.email !== this.emailConfirm) {
      this.toast.show(this.lang.t('register.errors.emailMismatch'), 'error');
      return;
    }

    const passwordValidation = this.validatePassword(this.password);
    if (!passwordValidation.valid) {
      this.toast.show(passwordValidation.error!, 'error');
      return;
    }

    if (this.password !== this.passwordConfirm) {
      this.toast.show(this.lang.t('register.errors.passwordMismatch'), 'error');
      return;
    }

    if (!this.agreeToTerms) {
      this.toast.show(this.lang.t('register.errors.termsRequired'), 'error');
      return;
    }

    this.isLoading = true;
    this.emailExistsError = false;
    try {
      const { data, error } = await this.authService.signUp(this.email, this.password);
      if (error) {
        // Check if the error is about user already existing
        if (error.message.toLowerCase().includes('already') ||
            error.message.toLowerCase().includes('exists') ||
            error.message.toLowerCase().includes('registered')) {
          this.emailExistsError = true;
          this.isLoading = false;
          return;
        }
        throw error;
      }

      // Set language based on preferred locale
      const locale = this.language === 'עברית' ? 'he' : 'en';
      this.lang.setLanguage(locale);

      // Save profile data if user was created
      if (data.user) {
        try {
          const { data: profileData, error: profileError } = await this.supabaseService.client
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: this.fullName,
              email: this.email,
              locale: locale,
              created_at: new Date().toISOString()
            })
            .select();

          if (profileError) {
            console.error('Error saving profile:', profileError);
          } else {
            console.log('Profile saved successfully:', profileData);
          }
        } catch (profileError: any) {
          console.error('Exception saving profile:', profileError);
          // Don't block the registration flow if profile save fails
        }
      }

      // If confirmation is not required, session will exist
      if (data.session) {
        this.toast.show(this.lang.t('register.success.registered'), 'success');
        this.router.navigate(['/onboarding']);
        return;
      }

      // Otherwise, try to sign-in automatically
      const { error: signInErr } = await this.authService.signIn(this.email, this.password);
      if (!signInErr) {
        this.toast.show(this.lang.t('register.success.signingIn'), 'success');
        this.router.navigate(['/onboarding']);
        return;
      }

      // Fallback: move to login
      this.toast.show(this.lang.t('register.success.registeredPleaseLogin'), 'success');
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.toast.show(error.message || this.lang.t('register.errors.registrationFailed'), 'error');
    } finally {
      this.isLoading = false;
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  openTerms() {
    this.router.navigate(['/terms']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmVisibility() {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }
}
