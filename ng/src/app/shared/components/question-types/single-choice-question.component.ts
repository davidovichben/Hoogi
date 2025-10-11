import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question } from '../../../core/models/questionnaire.model';

@Component({
  selector: 'app-single-choice-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ question.title }}
          <span *ngIf="question.required" class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          <div *ngFor="let option of question.options" class="flex items-center">
            <input
              type="radio"
              [name]="'question-' + question.id"
              [value]="option"
              [(ngModel)]="answer"
              (ngModelChange)="answerChange.emit($event)"
              class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500">
            <label class="ml-3 text-sm text-gray-700">{{ option }}</label>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SingleChoiceQuestionComponent {
  @Input() question!: Question;
  @Input() answer: string = '';
  @Output() answerChange = new EventEmitter<string>();
}
