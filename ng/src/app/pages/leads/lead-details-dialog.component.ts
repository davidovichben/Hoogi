import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { SupabaseService } from '../../core/services/supabase.service';

interface QuestionAnswer {
  question_text: string;
  answer: any;
  question_type: string;
}

@Component({
  selector: 'app-lead-details-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lead-details-dialog.component.html',
  styleUrl: './lead-details-dialog.component.sass'
})
export class LeadDetailsDialogComponent implements OnInit {
  @Input() leadId!: string;
  @Input() questionnaireTitle!: string;
  @Input() clientName!: string;
  @Input() answerJson: any = {};
  @Input() questionnaireId!: string;
  @Output() close = new EventEmitter<void>();

  questionsAndAnswers: QuestionAnswer[] = [];
  loading = true;

  constructor(
    public lang: LanguageService,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    await this.loadQuestions();
  }

  async loadQuestions() {
    this.loading = true;
    try {
      // Fetch questions for this questionnaire
      const { data: questions, error } = await this.supabase.client
        .from('questions')
        .select('id, question_text, question_type')
        .eq('questionnaire_id', this.questionnaireId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Map questions with their answers
      this.questionsAndAnswers = (questions || []).map(question => ({
        question_text: question.question_text,
        answer: this.answerJson[question.id] || null,
        question_type: question.question_type
      }));
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      this.loading = false;
    }
  }

  formatAnswer(answer: any, questionType: string): string {
    if (!answer) return this.lang.t('common.noAnswer');

    if (Array.isArray(answer)) {
      return answer.join(', ');
    }

    if (typeof answer === 'object') {
      return JSON.stringify(answer);
    }

    return String(answer);
  }

  isAudioFile(answer: any): boolean {
    if (!answer || typeof answer !== 'string') return false;
    return answer.startsWith('Audio:') || answer.toLowerCase().includes('audio_');
  }

  isImageFile(answer: any): boolean {
    if (!answer || typeof answer !== 'string') return false;
    const lowerAnswer = answer.toLowerCase();
    // Check if it's a file and has image extension
    if (!answer.startsWith('File:') && !answer.startsWith('Image:')) return false;
    return (lowerAnswer.includes('.jpg') || lowerAnswer.includes('.jpeg') ||
            lowerAnswer.includes('.png') || lowerAnswer.includes('.gif') ||
            lowerAnswer.includes('.webp') || lowerAnswer.includes('.svg'));
  }

  isDownloadableFile(answer: any): boolean {
    if (!answer || typeof answer !== 'string') return false;
    // Must start with File: or Image: but not be an image or audio file
    return (answer.startsWith('File:') || answer.startsWith('Image:')) &&
           !this.isImageFile(answer) && !this.isAudioFile(answer);
  }

  getFileName(answer: string): string {
    // Extract URL from the prefixed string
    if (answer.startsWith('Audio:')) {
      return answer.replace('Audio:', '').trim();
    }
    if (answer.startsWith('File:')) {
      return answer.replace('File:', '').trim();
    }
    if (answer.startsWith('Image:')) {
      return answer.replace('Image:', '').trim();
    }
    return answer;
  }

  getFileNameOnly(answer: string): string {
    // Get just the filename from the URL for display
    const url = this.getFileName(answer);
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || url;
    } catch {
      return url;
    }
  }

  closeDialog() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    // Close dialog when clicking on backdrop (not the dialog content)
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }
}
