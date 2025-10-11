import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // Wait for session to be initialized before checking authentication
    return this.supabaseService.sessionInitialized.pipe(
      filter(initialized => initialized === true),
      take(1),
      switchMap(() => this.authService.isAuthenticated),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        }
        return this.router.createUrlTree(['/auth']);
      })
    );
  }
}
