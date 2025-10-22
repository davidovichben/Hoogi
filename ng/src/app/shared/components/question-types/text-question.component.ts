import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question } from '../../../core/models/questionnaire.model';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-text-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ question.title }}
          <span *ngIf="question.required" class="text-red-500">*</span>
        </label>
        <input
          type="text"
          [(ngModel)]="answer"
          (ngModelChange)="answerChange.emit($event)"
          [placeholder]="lang.t('questions.enterAnswer')"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
    </div>
  `
})
export class TextQuestionComponent {
  @Input() question!: Question;
  @Input() answer: string = '';
  @Output() answerChange = new EventEmitter<string>();

  constructor(public lang: LanguageService) {}
}
