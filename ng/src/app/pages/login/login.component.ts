import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent {
  activeTab: 'login' | 'forgot' = 'login';
  email = '';
  password = '';
  isLoading = false;
  showPassword = false;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    public lang: LanguageService,
    private toast: ToastService
  ) {}
  
  async handleLogin() {
    this.isLoading = true;
    try {
      const result = await this.authService.signIn(this.email, this.password);
      if (result.error) throw result.error;

      this.toast.show(this.lang.t('dashboard.welcomeBack'), 'success');
      // Navigation is handled by AuthService
    } catch (error: any) {
      const errorMessage = error.message ? this.lang.translateError(error.message) : this.lang.t('auth.loginFailed');
      this.toast.show(errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }


  async handleForgotPassword() {
    if (!this.email) {
      this.toast.show(this.lang.t('auth.enterEmailFirst'), 'error');
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.sendResetCode(this.email, this.lang.currentLanguage);
      this.toast.show(this.lang.t('auth.resetCodeSent'), 'success');
      // Navigate to update-password page with email
      this.router.navigate(['/auth/update-password'], {
        queryParams: { email: this.email }
      });
    } catch (error: any) {
      const errorMessage = error.message ? this.lang.translateError(error.message) : this.lang.t('auth.resetCodeFailed');
      this.toast.show(errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
