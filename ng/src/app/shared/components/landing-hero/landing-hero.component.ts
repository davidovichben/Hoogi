import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LanguageService } from '../../../core/services/language.service';

type HeroVariant = 'landing' | 'signup';

interface Benefit {
  iconSvg?: SafeHtml;
  iconEmoji?: string;
  titleKey: string;
  descKey: string;
}

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-hero.component.html',
  styleUrls: ['./landing-hero.component.sass']
})
export class LandingHeroComponent {
  @Input() variant: HeroVariant = 'landing';

  constructor(
    public lang: LanguageService,
    private sanitizer: DomSanitizer
  ) {}

  get logoClass(): string {
    return this.variant === 'signup' ? 'h-20 w-20 sm-h-24 sm-w-24 object-contain' : 'h-24 sm-h-28 md-h-32 mx-auto';
  }

  get containerClass(): string {
    return this.variant === 'signup' ? 'max-w-6xl' : 'landing-hero';
  }

  get titleClass(): string {
    return this.variant === 'signup'
      ? 'text-2xl sm-text-3xl md-text-5xl font-extrabold'
      : 'text-3xl sm-text-4xl md-text-5xl lg-text-6xl font-bold mb-4';
  }

  get subtitleClass(): string {
    return this.variant === 'signup'
      ? 'mt-3 text-muted max-w-2xl mx-auto text-base sm-text-lg'
      : 'mt-3 text-muted max-w-2xl mx-auto text-base sm-text-lg md-text-xl';
  }

  get subtitleKey(): string {
    return this.variant === 'signup'
      ? 'landingHero.subtitleSignup'
      : 'landingHero.subtitleLanding';
  }

  get cardClass(): string {
    return this.variant === 'signup'
      ? 'bg-card border border-border p-5 rounded-xl shadow-sm hover-shadow-md transition-shadow'
      : 'bg-white rounded-lg p-6 shadow-sm text-right';
  }

  get iconContainerClass(): string {
    return this.variant === 'signup'
      ? 'p-3 bg-primary-light rounded-lg'
      : 'flex-shrink-0';
  }

  get iconClass(): string {
    return this.variant === 'signup'
      ? 'icon-primary'
      : 'text-4xl';
  }

  get textContainerClass(): string {
    return this.variant === 'signup'
      ? 'text-right'
      : 'text-right flex-1';
  }

  get benefitTitleClass(): string {
    return this.variant === 'signup'
      ? 'font-semibold text-base sm-text-lg mb-1'
      : 'text-base sm-text-lg md-text-xl font-bold';
  }

  get benefitDescClass(): string {
    return this.variant === 'signup'
      ? 'text-sm sm-text-base text-muted leading-relaxed'
      : 'text-gray-600 text-sm sm-text-base';
  }

  get benefits(): Benefit[] {
    if (this.variant === 'signup') {
      const messageSquare = this.sanitizer.bypassSecurityTrustHtml('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>');
      const mapPin = this.sanitizer.bypassSecurityTrustHtml('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>');
      const target = this.sanitizer.bypassSecurityTrustHtml('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>');
      const zap = this.sanitizer.bypassSecurityTrustHtml('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>');

      return [
        { iconSvg: messageSquare, titleKey: 'landingHero.smartSalesTool', descKey: 'landingHero.smartSalesToolDescSignup' },
        { iconSvg: mapPin, titleKey: 'landingHero.centralizedHub', descKey: 'landingHero.centralizedHubDescSignup' },
        { iconSvg: target, titleKey: 'landingHero.qualifiedLeads', descKey: 'landingHero.qualifiedLeadsDescSignup' },
        { iconSvg: zap, titleKey: 'landingHero.smartAutomation', descKey: 'landingHero.smartAutomationDescSignup' }
      ];
    } else {
      return [
        { iconEmoji: '💬', titleKey: 'landingHero.smartSalesTool', descKey: 'landingHero.smartSalesToolDescLanding' },
        { iconEmoji: '🎯', titleKey: 'landingHero.centralizedHub', descKey: 'landingHero.centralizedHubDescLanding' },
        { iconEmoji: '🎯', titleKey: 'landingHero.qualifiedLeads', descKey: 'landingHero.qualifiedLeadsDescLanding' },
        { iconEmoji: '⚡', titleKey: 'landingHero.smartAutomation', descKey: 'landingHero.smartAutomationDescLanding' }
      ];
    }
  }
}
