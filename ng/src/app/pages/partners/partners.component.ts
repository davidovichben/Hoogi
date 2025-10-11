import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Partners</h1>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">Partner Program</h3>
          <p class="text-gray-600 mb-4">Manage your partnerships and collaborations.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border rounded-lg p-4">
              <h4 class="font-semibold mb-2">Active Partners</h4>
              <p class="text-2xl text-blue-600">0</p>
            </div>
            <div class="border rounded-lg p-4">
              <h4 class="font-semibold mb-2">Revenue Share</h4>
              <p class="text-2xl text-green-600">$0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PartnersComponent {}
