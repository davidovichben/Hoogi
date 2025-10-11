import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Questionnaire, Question } from '../../../core/models/questionnaire.model';

@Component({
  selector: 'app-template-a',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-xl mx-auto">
      <h1 class="text-2xl font-bold mb-2">{{ questionnaire?.title }}</h1>
      <p class="opacity-70 mb-4">{{ questionnaire?.meta?.primaryLanguage?.toUpperCase() }}</p>

      <!-- Display questions -->
      <div *ngIf="questions && questions.length > 0" class="space-y-4">
        <div *ngFor="let question of questions; let i = index" class="border rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-medium text-gray-600">שאלה {{ i + 1 }}</span>
            <span *ngIf="question.required" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
              חובה
            </span>
          </div>
          <h3 class="font-medium mb-2">{{ question.title }}</h3>

          <!-- Question type: text -->
          <input *ngIf="question.type === 'text'"
                 type="text"
                 placeholder="הקלד תשובתך כאן..."
                 class="w-full p-2 border rounded"
                 disabled>

          <!-- Question type: audio -->
          <div *ngIf="question.type === 'audio'" class="w-full p-4 border rounded bg-gray-50">
            <div class="flex items-center gap-2 text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
              <span>Audio Recording</span>
            </div>
          </div>

          <!-- Question type: single choice (radio) -->
          <div *ngIf="question.type === 'single' && question.options" class="space-y-2">
            <label *ngFor="let option of question.options; let optIndex = index"
                   class="flex items-center gap-2">
              <input type="radio" [name]="'q' + i" disabled>
              <span>{{ option }}</span>
            </label>
          </div>

          <!-- Question type: multiple choice (checkbox) -->
          <div *ngIf="question.type === 'multi' && question.options" class="space-y-2">
            <label *ngFor="let option of question.options" class="flex items-center gap-2">
              <input type="checkbox" disabled>
              <span>{{ option }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- No questions message -->
      <div *ngIf="!questions || questions.length === 0"
           class="rounded-lg border p-4 text-center text-gray-500">
        אין שאלות להצגה
      </div>
    </div>
  `
})
export class TemplateAComponent {
  @Input() questionnaire: Questionnaire | null = null;
  @Input() questions: Question[] = [];
}
