import { Injectable, OnDestroy } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService implements OnDestroy {
  private supabase: SupabaseClient;
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private initialized = false;
  private authSubscription: any;
  private sessionInitialized$ = new BehaviorSubject<boolean>(false);

  constructor() {
    console.log('[SupabaseService] Initializing...');

    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Prevent concurrent lock acquisition
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'sb-auth-token'
        }
      }
    );

    // Initialize session immediately
    this.initializeSession();

    // ONLY listen to auth state changes - don't make any auth calls
    // Use setTimeout to ensure this runs after any existing auth operations
    setTimeout(() => {
      this.authSubscription = this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('[SupabaseService] Auth state change:', event, !!session);
        this.currentUser$.next(session?.user ?? null);
        if (!this.initialized && session) {
          this.initialized = true;
        }
      });
    }, 0);
  }

  private async initializeSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        console.log('[SupabaseService] Session restored on init:', !!session.user);
        this.currentUser$.next(session.user);
        this.initialized = true;
      }
    } catch (error) {
      console.error('[SupabaseService] Error getting session:', error);
    } finally {
      // Mark session as initialized even if no session was found
      this.sessionInitialized$.next(true);
    }
  }

  get sessionInitialized(): Observable<boolean> {
    return this.sessionInitialized$.asObservable();
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  get currentUser(): User | null {
    return this.currentUser$.value;
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({ email, password });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async sendResetCode(email: string, language: string = 'en') {
    const { data, error } = await this.supabase.functions.invoke('send-reset-code', {
      body: { email, language }
    });
    if (error) throw error;
    return data;
  }

  async verifyResetCode(email: string, code: string, newPassword: string) {
    console.log('Calling verify-reset-code with:', { email, code: code.length + ' digits', hasPassword: !!newPassword });

    const { data, error } = await this.supabase.functions.invoke('verify-reset-code', {
      body: { email, code, newPassword }
    });

    console.log('Edge function response - data:', data);
    console.log('Edge function response - error:', error);

    // Handle function invocation errors (network issues, etc.)
    if (error) {
      console.error('Function invocation error:', error);
      throw error;
    }

    // Check if the edge function returned an error in the response body
    if (data && !data.success && data.error) {
      console.log('Edge function returned error:', data.error);
      throw new Error(data.error);
    }

    return data;
  }

  async checkResetCode(email: string, code: string) {
    // Check if code is valid without resetting password
    const { data, error } = await this.supabase.functions.invoke('check-reset-code', {
      body: { email, code }
    });
    if (error) throw error;
    return data?.valid ?? false; // Returns true if valid code found
  }

  async resetPassword(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email);
  }

  async updatePassword(newPassword: string) {
    return await this.supabase.auth.updateUser({ password: newPassword });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
