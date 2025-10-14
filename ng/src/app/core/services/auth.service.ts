import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { ProfileValidatorService } from './profile-validator.service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private profileValidator: ProfileValidatorService
  ) {
    // Initialize with current user state
    this.isAuthenticated$.next(!!this.supabaseService.currentUser);

    this.supabaseService.user$.subscribe(user => {
      this.isAuthenticated$.next(!!user);
    });
  }

  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  get user$(): Observable<User | null> {
    return this.supabaseService.user$;
  }

  get currentUser(): User | null {
    return this.supabaseService.currentUser;
  }

  async signIn(email: string, password: string) {
    const result = await this.supabaseService.signIn(email, password);
    if (result.data.user) {
      // Check if profile is complete
      const isComplete = await this.profileValidator.isProfileComplete(result.data.user.id);

      if (isComplete) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/profile']);
      }
    }
    return result;
  }

  async signUp(email: string, password: string) {
    return await this.supabaseService.signUp(email, password);
  }

  async signOut() {
    await this.supabaseService.signOut();
    this.router.navigate(['/auth']);
  }

  async sendResetCode(email: string, language: string = 'en') {
    return await this.supabaseService.sendResetCode(email, language);
  }

  async checkResetCode(email: string, code: string) {
    return await this.supabaseService.checkResetCode(email, code);
  }

  async verifyResetCode(email: string, code: string, newPassword: string) {
    return await this.supabaseService.verifyResetCode(email, code, newPassword);
  }

  async resetPassword(email: string) {
    return await this.supabaseService.resetPassword(email);
  }

  async updatePassword(newPassword: string) {
    return await this.supabaseService.updatePassword(newPassword);
  }
}
