import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ProfileComponent } from '../../pages/profile/profile.component';
import { ToastService } from '../services/toast.service';
import { LanguageService } from '../services/language.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard implements CanDeactivate<ProfileComponent> {
  constructor(
    private toast: ToastService,
    private lang: LanguageService
  ) {}

  canDeactivate(
    component: ProfileComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): boolean {
    // Allow navigation to logout/login/landing pages regardless of profile completion
    const allowedPaths = ['/login', '/logout', '/landing', '/auth', '/register'];
    if (nextState && allowedPaths.some(path => nextState.url.startsWith(path))) {
      return true;
    }

    // Check for unsaved changes first
    if (component.profileDetailsComponent && component.profileDetailsComponent.hasUnsavedChanges()) {
      const confirmLeave = confirm(this.lang.t('profile.unsavedChangesWarning'));
      if (!confirmLeave) {
        return false;
      }
    }

    // If profile details component exists and profile is not complete, prevent navigation
    if (component.profileDetailsComponent && !component.profileDetailsComponent.checkProfileComplete()) {
      this.toast.show(this.lang.t('profile.completeRequiredFields'), 'error');
      return false;
    }

    return true;
  }
}
