import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { LandingHeroComponent } from '../../shared/components/landing-hero/landing-hero.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LandingHeroComponent],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  constructor(public lang: LanguageService) {}
}
