import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question } from '../../../core/models/questionnaire.model';

@Component({
  selector: 'app-multi-choice-question',
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
          <div *ngFor="let option of question.options; let i = index" class="flex items-center">
            <input
              type="checkbox"
              [id]="'option-' + question.id + '-' + i"
              [value]="option"
              [checked]="isSelected(option)"
              (change)="toggleOption(option)"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
            <label [for]="'option-' + question.id + '-' + i" class="ml-3 text-sm text-gray-700">{{ option }}</label>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MultiChoiceQuestionComponent {
  @Input() question!: Question;
  @Input() answer: string[] = [];
  @Output() answerChange = new EventEmitter<string[]>();

  isSelected(option: string): boolean {
    return this.answer.includes(option);
  }

  toggleOption(option: string) {
    const currentAnswer = [...this.answer];
    const index = currentAnswer.indexOf(option);

    if (index > -1) {
      currentAnswer.splice(index, 1);
    } else {
      currentAnswer.push(option);
    }

    this.answer = currentAnswer;
    this.answerChange.emit(this.answer);
  }
}
