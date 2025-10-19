import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.sass']
})
export class UpdatePasswordComponent implements OnInit, OnDestroy {
  @ViewChildren('digit1, digit2, digit3, digit4, digit5, digit6') digitInputs!: QueryList<ElementRef>;

  email = '';
  digits: string[] = ['', '', '', '', '', ''];
  password = '';
  confirmPassword = '';
  isLoading = false;
  isResending = false;
  isVerifyingCode = false;
  isCodeVerified = false;
  showPassword = false;
  showPasswordConfirm = false;
  passwordTouched = false;
  confirmPasswordTouched = false;
  timeLeft = 300; // 5 minutes countdown
  private timerInterval: any;

  // Resend rate limiting
  resendAttempts = 0;
  maxResendAttempts = 5;
  cooldownTimeLeft = 0; // 5 minutes cooldown
  private cooldownInterval: any;
  private readonly COOLDOWN_DURATION = 5 * 60; // 5 minutes in seconds
  private readonly STORAGE_KEY = 'password_reset_cooldown';
  private readonly CODE_EXPIRY_KEY = 'password_reset_code_expiry';

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    // Get email from query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.toastService.show(this.lang.t('updatePassword.noEmailProvided'), 'error');
        this.router.navigate(['/auth']);
        return;
      }
    });

    // Check for existing cooldown
    this.loadCooldownState();

    // Always reset timer when entering the component (don't load from localStorage)
    // This ensures a fresh 5-minute timer every time
    localStorage.removeItem(this.CODE_EXPIRY_KEY);
    this.timeLeft = 300; // 5 minutes
    this.saveCodeExpiryState();
    this.startTimer();

    // Auto-focus first digit input after view init
    setTimeout(() => {
      const inputs = this.digitInputs?.toArray();
      if (inputs && inputs.length > 0) {
        inputs[0].nativeElement.focus();
      }
    }, 300);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  loadCooldownState() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const now = Date.now();

      // Check if cooldown is still active
      if (data.cooldownEnd && data.cooldownEnd > now) {
        this.resendAttempts = data.attempts || 0;
        this.cooldownTimeLeft = Math.ceil((data.cooldownEnd - now) / 1000);
        this.startCooldownTimer();
      } else {
        // Cooldown expired, reset
        localStorage.removeItem(this.STORAGE_KEY);
        this.resendAttempts = 0;
      }
    }
  }

  loadCodeExpiryState() {
    const stored = localStorage.getItem(this.CODE_EXPIRY_KEY);
    if (stored) {
      const expiryTime = parseInt(stored, 10);
      const now = Date.now();

      if (expiryTime > now) {
        // Code hasn't expired yet, calculate remaining time
        this.timeLeft = Math.ceil((expiryTime - now) / 1000);
        this.startTimer();
      } else {
        // Code has expired
        this.timeLeft = 0;
        localStorage.removeItem(this.CODE_EXPIRY_KEY);
      }
    } else {
      // No stored expiry time, start fresh timer
      this.saveCodeExpiryState();
      this.startTimer();
    }
  }

  saveCodeExpiryState() {
    const expiryTime = Date.now() + (this.timeLeft * 1000);
    localStorage.setItem(this.CODE_EXPIRY_KEY, expiryTime.toString());
  }

  saveCooldownState() {
    const data = {
      attempts: this.resendAttempts,
      cooldownEnd: Date.now() + (this.cooldownTimeLeft * 1000)
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  startCooldownTimer() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    this.cooldownInterval = setInterval(() => {
      this.cooldownTimeLeft--;
      if (this.cooldownTimeLeft <= 0) {
        clearInterval(this.cooldownInterval);
        this.cooldownTimeLeft = 0;
        this.resendAttempts = 0;
        localStorage.removeItem(this.STORAGE_KEY);
      } else {
        this.saveCooldownState();
      }
    }, 1000);
  }

  get canResend(): boolean {
    return !this.isResending && this.cooldownTimeLeft === 0 && this.resendAttempts < this.maxResendAttempts;
  }

  get remainingAttempts(): number {
    return this.maxResendAttempts - this.resendAttempts;
  }

  get cooldownMinutes(): number {
    return Math.ceil(this.cooldownTimeLeft / 60);
  }

  get timeLeftFormatted(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async resendCode() {
    if (!this.canResend) return;

    this.isResending = true;
    try {
      // First, stop the current timer
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = undefined;
      }

      await this.authService.sendResetCode(this.email, this.lang.currentLanguage);

      // Increment attempts
      this.resendAttempts++;

      // Check if max attempts reached
      if (this.resendAttempts >= this.maxResendAttempts) {
        this.cooldownTimeLeft = this.COOLDOWN_DURATION;
        this.startCooldownTimer();
        this.toastService.show(
          `${this.lang.t('updatePassword.tooManyAttempts')} ${this.cooldownMinutes} ${this.lang.t('updatePassword.minutes')}`,
          'error'
        );
      } else {
        this.toastService.show(this.lang.t('updatePassword.codeSent'), 'success');
      }

      // Reset the timer to 5 minutes (300 seconds)
      this.timeLeft = 300;
      this.saveCodeExpiryState(); // Save new expiry time
      this.startTimer();

      // Clear the digits and reset verification
      this.digits = ['', '', '', '', '', ''];
      this.isCodeVerified = false;

      // Reset password fields and touched states
      this.password = '';
      this.confirmPassword = '';
      this.passwordTouched = false;
      this.confirmPasswordTouched = false;

      // Focus on first digit input
      setTimeout(() => {
        const inputs = this.digitInputs.toArray();
        if (inputs.length > 0) {
          inputs[0].nativeElement.focus();
        }
      }, 100);

      // Save state
      if (this.cooldownTimeLeft > 0) {
        this.saveCooldownState();
      }
    } catch (error: any) {
      this.toastService.show(error.message || this.lang.t('auth.resetCodeFailed'), 'error');

      // Restart the timer even if resend failed, so user can try again
      if (!this.timerInterval) {
        this.startTimer();
      }
    } finally {
      // Ensure isResending is always reset
      this.isResending = false;

      // Force change detection
      setTimeout(() => {
        this.isResending = false;
      }, 0);
    }
  }

  startTimer() {
    // Clear any existing timer first
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.timeLeft = 0;
        localStorage.removeItem(this.CODE_EXPIRY_KEY);
      }
    }, 1000);
  }

  async onDigitInput(event: any, index: number) {
    const input = event.target;
    let value = input.value;

    // Only allow digits - remove any non-digit characters
    value = value.replace(/\D/g, '');

    // Take only the last digit if multiple were entered
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Update the model with the sanitized value
    this.digits[index] = value;

    // Update the input field to reflect the sanitized value
    input.value = value;

    // If a digit is entered, move to next input
    if (value.length === 1 && index < 5) {
      const inputs = this.digitInputs.toArray();
      // Use setTimeout to ensure the DOM is updated before focusing
      setTimeout(() => {
        inputs[index + 1].nativeElement.focus();
      }, 0);
    }

    // Check if all 6 digits are filled, then verify
    if (value.length === 1 && index === 5) {
      // All digits filled, verify the code
      await this.verifyCode();
    }
  }

  async verifyCode() {
    if (this.isVerifyingCode || this.code.length !== 6) return;

    this.isVerifyingCode = true;
    this.isCodeVerified = false;

    try {
      const isValid = await this.authService.checkResetCode(this.email, this.code);

      if (isValid) {
        this.isCodeVerified = true;
        this.toastService.show(this.lang.t('updatePassword.codeValid'), 'success');
      } else {
        this.isCodeVerified = false;
        this.toastService.show(this.lang.t('updatePassword.codeInvalid'), 'error');
        // Clear digits and refocus
        this.digits = ['', '', '', '', '', ''];
        setTimeout(() => {
          const inputs = this.digitInputs.toArray();
          if (inputs.length > 0) {
            inputs[0].nativeElement.focus();
          }
        }, 100);
      }
    } catch (error: any) {
      this.isCodeVerified = false;
      this.toastService.show(this.lang.t('updatePassword.codeInvalid'), 'error');
      // Clear digits and refocus
      this.digits = ['', '', '', '', '', ''];
      setTimeout(() => {
        const inputs = this.digitInputs.toArray();
        if (inputs.length > 0) {
          inputs[0].nativeElement.focus();
        }
      }, 100);
    } finally {
      // Ensure isVerifyingCode is always reset
      this.isVerifyingCode = false;

      // Force change detection
      setTimeout(() => {
        this.isVerifyingCode = false;
      }, 0);
    }
  }

  onDigitKeydown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    // Handle backspace - move to previous input if current is empty
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        event.preventDefault();
        const inputs = this.digitInputs.toArray();
        setTimeout(() => {
          inputs[index - 1].nativeElement.focus();
          inputs[index - 1].nativeElement.select();
        }, 0);
      }
    }

    // Handle arrow keys for navigation
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      const inputs = this.digitInputs.toArray();
      inputs[index - 1].nativeElement.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      const inputs = this.digitInputs.toArray();
      inputs[index + 1].nativeElement.focus();
    }
  }

  async onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    digits.forEach((digit, index) => {
      if (index < 6) {
        this.digits[index] = digit;
      }
    });

    // Focus on the next empty input or last input
    const nextEmptyIndex = this.digits.findIndex(d => !d);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    const inputs = this.digitInputs.toArray();
    inputs[focusIndex].nativeElement.focus();

    // If all 6 digits are pasted, verify the code
    if (this.digits.every(d => d !== '')) {
      await this.verifyCode();
    }
  }

  get code(): string {
    return this.digits.join('');
  }

  get isCodeComplete(): boolean {
    return this.isCodeVerified;
  }

  validatePassword(password: string): { valid: boolean; error: string | null } {
    if (!password) {
      return { valid: false, error: this.lang.t('updatePassword.passwordRequired') };
    }
    if (password.length < 8) {
      return { valid: false, error: this.lang.t('updatePassword.passwordTooShort') };
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);

    if (!hasLetters || !hasNumbers) {
      return { valid: false, error: this.lang.t('updatePassword.passwordLettersAndNumbers') };
    }

    return { valid: true, error: null };
  }

  get isPasswordValid(): boolean {
    const validation = this.validatePassword(this.password);
    return validation.valid && this.password === this.confirmPassword;
  }

  get passwordError(): string | null {
    if (!this.password || !this.passwordTouched) return null;
    const validation = this.validatePassword(this.password);
    return validation.error;
  }

  get confirmPasswordError(): string | null {
    if (!this.confirmPassword || !this.confirmPasswordTouched) return null;
    if (this.password !== this.confirmPassword) {
      return this.lang.t('updatePassword.passwordsMismatch');
    }
    return null;
  }

  async handleSubmit() {
    // Mark fields as touched to show validation errors
    this.passwordTouched = true;
    this.confirmPasswordTouched = true;

    if (this.timeLeft === 0) {
      this.toastService.show(this.lang.t('updatePassword.codeExpiredError'), 'error');
      return;
    }

    if (this.code.length !== 6) {
      this.toastService.show(this.lang.t('updatePassword.enterSixDigits'), 'error');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastService.show(this.lang.t('updatePassword.passwordsMismatch'), 'error');
      return;
    }

    const passwordValidation = this.validatePassword(this.password);
    if (!passwordValidation.valid) {
      this.toastService.show(passwordValidation.error!, 'error');
      return;
    }

    this.isLoading = true;
    try {
      console.log('About to call verifyResetCode with:', {
        email: this.email,
        code: this.code,
        codeLength: this.code.length,
        password: this.password ? '***' : 'EMPTY',
        passwordLength: this.password?.length || 0
      });
      await this.authService.verifyResetCode(this.email, this.code, this.password);

      // Clear stored states on success
      localStorage.removeItem(this.CODE_EXPIRY_KEY);
      localStorage.removeItem(this.STORAGE_KEY);

      this.toastService.show(this.lang.t('updatePassword.success'), 'success');
      this.router.navigate(['/auth']);
    } catch (error: any) {
      console.error('Password reset error:', error);

      // Extract error message from various possible locations
      let errorMessage = '';

      // Try multiple possible error locations
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.msg) {
        errorMessage = error.msg;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.log('Extracted error message:', errorMessage);

      // Map English error messages to translation keys
      let translationKey = '';

      if (errorMessage) {
        const lowerError = errorMessage.toLowerCase();

        if (lowerError.includes('same password')) {
          translationKey = 'updatePassword.cannotUseSamePassword';
        } else if (lowerError.includes('invalid') && lowerError.includes('code')) {
          translationKey = 'updatePassword.invalidCode';
        } else if (lowerError.includes('expired') && lowerError.includes('code')) {
          translationKey = 'updatePassword.codeExpired';
        } else if (lowerError.includes('user not found')) {
          translationKey = 'updatePassword.userNotFound';
        } else if (lowerError.includes('edge function')) {
          translationKey = 'updatePassword.resetFailed';
        } else if (lowerError.includes('internal server error')) {
          translationKey = 'updatePassword.serverError';
        }
      }

      // Show translated message or fallback
      if (translationKey) {
        this.toastService.show(this.lang.t(translationKey), 'error');
      } else {
        this.toastService.show(this.lang.t('updatePassword.resetFailed'), 'error');
      }
    } finally {
      // Ensure isLoading is always reset
      this.isLoading = false;

      // Force change detection
      setTimeout(() => {
        this.isLoading = false;
      }, 0);
    }
  }

  goBack() {
    this.router.navigate(['/auth']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmVisibility() {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }

  onPasswordBlur() {
    this.passwordTouched = true;
  }

  onConfirmPasswordBlur() {
    this.confirmPasswordTouched = true;
  }
}
