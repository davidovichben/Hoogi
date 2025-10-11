import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { QuestionnaireService } from '../../core/services/questionnaire.service';
import { ToastService } from '../../core/services/toast.service';
import { Questionnaire, Question } from '../../core/models/questionnaire.model';
import { TemplateAComponent } from '../../shared/components/templates/template-a.component';
import { TemplateBComponent } from '../../shared/components/templates/template-b.component';

@Component({
  selector: 'app-questionnaire-review',
  standalone: true,
  imports: [CommonModule, TemplateAComponent, TemplateBComponent],
  templateUrl: './questionnaire-review.component.html',
  styleUrls: ['./questionnaire-review.component.sass']
})
export class QuestionnaireReviewComponent implements OnInit {
  questionnaire: Questionnaire | null = null;
  questions: Question[] = [];
  isLoading = false;
  isPublishing = false;
  selectedTemplate: 'A' | 'B' = 'A';

  validationErrors: string[] = [];
  warnings: string[] = [];

  constructor(
    private questionnaireService: QuestionnaireService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadQuestionnaire(id);
    }
  }

  async loadQuestionnaire(id: string) {
    this.isLoading = true;
    try {
      const data = await this.questionnaireService.fetchQuestionnaireForReview(id);
      if (data) {
        this.questionnaire = data.questionnaire;
        this.questions = data.questions;
        this.validateQuestionnaire();
      }
    } catch (error: any) {
      this.toastService.error(error.message || 'Failed to load questionnaire');
    } finally {
      this.isLoading = false;
    }
  }

  validateQuestionnaire() {
    this.validationErrors = [];
    this.warnings = [];

    if (!this.questionnaire) return;

    // Critical validations
    if (!this.questionnaire.title?.trim()) {
      this.validationErrors.push('Questionnaire title is required');
    }

    if (this.questions.length === 0) {
      this.validationErrors.push('At least one question is required');
    }

    // Question-level validations
    this.questions.forEach((q, i) => {
      if (!q.title?.trim()) {
        this.validationErrors.push(`Question ${i + 1} is missing a title`);
      }

      if ((q.type === 'single' || q.type === 'multi') && (!q.options || q.options.length < 2)) {
        this.validationErrors.push(`Question ${i + 1} needs at least 2 options`);
      }
    });

    // Warnings
    if (!this.questionnaire.description?.trim()) {
      this.warnings.push('No description provided');
    }
  }

  selectTemplate(template: 'A' | 'B') {
    this.selectedTemplate = template;
  }

  async publish() {
    if (!this.questionnaire || this.validationErrors.length > 0) return;

    this.isPublishing = true;
    try {
      const success = await this.questionnaireService.publishQuestionnaire(this.questionnaire.id);

      if (success) {
        this.toastService.success('Questionnaire published successfully');
        this.router.navigate(['/questionnaires']);
      } else {
        this.toastService.error('Failed to publish questionnaire');
      }
    } catch (error: any) {
      this.toastService.error(error.message || 'Failed to publish questionnaire');
    } finally {
      this.isPublishing = false;
    }
  }

  backToEdit() {
    if (this.questionnaire) {
      this.router.navigate(['/questionnaires/edit', this.questionnaire.id]);
    }
  }

  cancel() {
    this.router.navigate(['/questionnaires']);
  }
}
