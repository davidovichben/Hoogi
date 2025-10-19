import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LanguageService } from '../core/services/language.service';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.sass']
})
export class LayoutComponent {
  sidebarOpen = false;
  isDemoMode = false;

  navigation: NavItem[] = [
    { name: 'nav.myHoogi', href: '/dashboard', icon: '📝' },
    { name: 'nav.myQuestionnaires', href: '/questionnaires', icon: '📚' },
    { name: 'nav.distribution', href: '/distribution-hub', icon: '📤' },
    { name: 'nav.responsesAndLeads', href: '/leads', icon: '💬' },
    { name: 'nav.automations', href: '/automations', icon: '🎧' },
    { name: 'nav.createQuestionnaire', href: '/questionnaires/new', icon: '📝' },
    { name: 'nav.myProfile', href: '/profile', icon: '👤' },
    { name: 'nav.customerService', href: '/customerService', icon: '🎧' },
    { name: 'nav.contact', href: '/contact', icon: '✉️' },
    { name: 'nav.myPartners', href: '/partners', icon: '🤝' },
    { name: 'nav.myOrganization', href: '/organization', icon: '🏢' },
    { name: 'nav.billings', href: '/billings', icon: '💳' },
  ];

  constructor(
    public lang: LanguageService,
    public router: Router,
    private authService: AuthService
  ) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile() {
    // Close sidebar on mobile after clicking a link
    this.sidebarOpen = false;
  }

  toggleDemoMode() {
    this.isDemoMode = !this.isDemoMode;
  }

  isActive(href: string): boolean {
    if (href === '/distribution-hub') {
      return this.router.url.startsWith('/distribution-hub');
    }
    return this.router.url === href;
  }

  goToOnboarding() {
    this.router.navigate(['/onboarding']);
  }

  async logout() {
    await this.authService.signOut();
  }
}
