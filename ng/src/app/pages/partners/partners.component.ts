import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ lang.t('partners.title') }}</h1>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">{{ lang.t('partners.program') }}</h3>
          <p class="text-gray-600 mb-4">{{ lang.t('partners.description') }}</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border rounded-lg p-4">
              <h4 class="font-semibold mb-2">{{ lang.t('partners.activePartners') }}</h4>
              <p class="text-2xl text-blue-600">0</p>
            </div>
            <div class="border rounded-lg p-4">
              <h4 class="font-semibold mb-2">{{ lang.t('partners.revenueShare') }}</h4>
              <p class="text-2xl text-green-600">$0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PartnersComponent {
  constructor(public lang: LanguageService) {}
}
