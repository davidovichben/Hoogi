import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.sass']
})
export class TermsComponent {
  currentYear = new Date().getFullYear();

  constructor(
    public lang: LanguageService,
    private router: Router
  ) {}

  goBack() {
    this.router.navigate(['/register']);
  }

  toggleLanguage() {
    const newLang = this.lang.currentLanguage === 'he' ? 'en' : 'he';
    this.lang.setLanguage(newLang);
  }
}
