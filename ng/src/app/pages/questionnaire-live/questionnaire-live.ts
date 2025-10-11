import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { QuestionnaireService } from '../../core/services/questionnaire.service';
import { ToastService } from '../../core/services/toast.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { Questionnaire, Question, QuestionOption } from '../../core/models/questionnaire.model';

@Component({
  selector: 'app-questionnaire-live',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questionnaire-live.html',
  styleUrl: './questionnaire-live.sass'
})
export class QuestionnaireLive implements OnInit {
  questionnaire: Questionnaire | null = null;
  questions: Question[] = [];
  options: QuestionOption[] = [];
  isLoading = false;
  isOwner = false; // Track if current user is the owner
  isSubmitted = false; // Track if form has been submitted
  viewMode: 'form' | 'chat' = 'form'; // Track current view mode

  // Owner's theme colors
  primaryColor = '#199f3a';
  secondaryColor = '#9cbb54';
  backgroundColor = '#b0a0a4';
  logoUrl = '';
  imageUrl = '';
  showLogo = true;
  showProfileImage = true;

  // Preview-specific data
  isPreviewMode = false;
  questionnaireDate = new Date();

  // Store responses
  responses: Record<string, any> = {};
  multiResponses: Record<string, Record<string, boolean>> = {};

  constructor(
    private questionnaireService: QuestionnaireService,
    private toastService: ToastService,
    private supabaseService: SupabaseService,
    public lang: LanguageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    // Determine view mode based on route path
    const currentPath = this.router.url;
    if (currentPath.startsWith('/q/')) {
      // Public guest view - always show fillable form
      this.isOwner = false;
    } else if (currentPath.startsWith('/questionnaires/live/')) {
      // Owner preview - show disabled preview
      this.isOwner = true;
    }

    if (id) {
      // Check if this is a preview request
      if (id === 'preview') {
        this.loadPreviewData();
      } else {
        this.loadQuestionnaire(id);
      }
    }
  }

  loadPreviewData() {
    try {
      const previewDataStr = sessionStorage.getItem('preview_questionnaire');
      if (!previewDataStr) {
        this.toastService.show('No preview data found', 'error');
        return;
      }

      const data = JSON.parse(previewDataStr);

      this.questionnaire = {
        id: 'preview',
        title: data.questionnaire.title,
        description: data.questionnaire.description,
        language: data.questionnaire.language,
        owner_id: data.questionnaire.owner_id,
        status: 'draft',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: data.questionnaire.owner_id
      } as Questionnaire;

      this.questions = data.questions;
      this.options = data.options || [];
      this.isOwner = true; // Always show as owner view for preview
      this.isPreviewMode = true; // Enable preview mode
      this.questionnaireDate = new Date();

      // Load showLogo and showProfileImage from preview data
      this.showLogo = data.questionnaire.show_logo ?? true;
      this.showProfileImage = data.questionnaire.show_profile_image ?? true;

      // Apply theme from preview data
      if (data.profile) {
        this.primaryColor = data.profile.brand_primary || '#199f3a';
        this.secondaryColor = data.profile.brand_secondary || '#9cbb54';
        this.backgroundColor = data.profile.background_color || '#b0a0a4';
        this.logoUrl = data.profile.logo_url || '';
        this.imageUrl = data.profile.image_url || '';
      }

      // Initialize multi-choice responses
      this.questions.forEach(q => {
        if (q.question_type === 'multiple_choice' || q.question_type === 'checkbox' || q.question_type === 'multi') {
          this.multiResponses[q.id] = {};
        }
      });

      // Clear preview data after loading
      sessionStorage.removeItem('preview_questionnaire');
    } catch (error) {
      console.error('Error loading preview data:', error);
      this.toastService.show('Error loading preview', 'error');
    }
  }

  async loadQuestionnaire(tokenOrId: string) {
    this.isLoading = true;
    try {
      // Check if this is a UUID or a token
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenOrId);

      console.log('Loading questionnaire:', { tokenOrId, isUUID });

      let data;
      if (isUUID) {
        // Load by ID (for authenticated/owner view)
        data = await this.questionnaireService.fetchQuestionnaireForReview(tokenOrId);
      } else {
        // Load by token (for public view)
        data = await this.questionnaireService.fetchQuestionnaireByToken(tokenOrId);
      }

      console.log('Questionnaire data received:', data);

      if (data) {
        this.questionnaire = data.questionnaire;
        this.questions = data.questions;
        this.options = data.options || [];

        // Load showLogo and showProfileImage settings from questionnaire
        this.showLogo = data.questionnaire.show_logo ?? true;
        this.showProfileImage = data.questionnaire.show_profile_image ?? true;

        console.log('Questions loaded:', this.questions.length);
        console.log('Options loaded:', this.options.length);

        // Load owner's profile theme colors
        await this.loadOwnerTheme(this.questionnaire.owner_id);

        // Initialize multi-choice responses
        this.questions.forEach(q => {
          if (q.question_type === 'multiple_choice' || q.question_type === 'checkbox' || q.question_type === 'multi') {
            this.multiResponses[q.id] = {};
          }
        });
      } else {
        console.error('No data returned from service');
        this.toastService.show('Questionnaire not found', 'error');
      }
    } catch (error: any) {
      console.error('Error loading questionnaire:', error);
      this.toastService.show(error.message || 'Failed to load questionnaire', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async loadOwnerTheme(ownerId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('brand_primary, brand_secondary, background_color, logo_url, image_url')
        .eq('id', ownerId)
        .single();

      if (!error && data) {
        this.primaryColor = data.brand_primary || '#199f3a';
        this.secondaryColor = data.brand_secondary || '#9cbb54';
        this.backgroundColor = data.background_color || '#b0a0a4';
        this.logoUrl = data.logo_url || '';
        this.imageUrl = data.image_url || '';
      }
    } catch (error) {
      // Silently fail and use default colors
      console.error('Error loading owner theme:', error);
    }
  }

  getQuestionOptions(questionId: string): QuestionOption[] {
    // First check if the question has options stored directly
    const question = this.questions.find(q => q.id === questionId);
    if (question && (question as any).options && Array.isArray((question as any).options)) {
      // Convert inline options array to QuestionOption format
      return (question as any).options.map((opt: string, index: number) => ({
        id: `${questionId}_opt_${index}`,
        question_id: questionId,
        label: opt,
        value: opt,
        order_index: index
      }));
    }

    // Fall back to separate options array
    return this.options.filter(opt => opt.question_id === questionId);
  }

  getRatingRange(question: Question): number[] {
    const min = (question as any).min_rating || question.minimum || question.meta?.minimum || 1;
    const max = (question as any).max_rating || question.maximum || question.meta?.maximum || 5;
    const range: number[] = [];
    for (let i = min; i <= max; i++) {
      range.push(i);
    }
    return range;
  }

  async submitResponse(event: Event) {
    event.preventDefault();

    if (!this.questionnaire) return;

    try {
      // Validate required fields
      for (const question of this.questions) {
        if (question.is_required) {
          if (question.question_type === 'multiple_choice' || question.question_type === 'checkbox' || question.question_type === 'multi') {
            const selected = Object.values(this.multiResponses[question.id] || {}).some(v => v);
            if (!selected) {
              const message = this.lang.currentLanguage === 'he'
                ? `נא לענות: ${question.question_text}`
                : `Please answer: ${question.question_text}`;
              this.toastService.show(message, 'error');
              return;
            }
          } else if (!this.responses[question.id]) {
            const message = this.lang.currentLanguage === 'he'
              ? `נא לענות: ${question.question_text}`
              : `Please answer: ${question.question_text}`;
            this.toastService.show(message, 'error');
            return;
          }
        }
      }

      // For owner view, just mark as submitted without saving to database
      if (this.isOwner) {
        this.isSubmitted = true;
        this.toastService.show(
          this.lang.currentLanguage === 'he' ? 'בדיקה הושלמה - לא נשמר במסד הנתונים' : 'Test completed - not saved to database',
          'success'
        );
        return;
      }

      // Prepare response data for guest view
      const responseData: Record<string, any> = {};

      for (const question of this.questions) {
        if (question.question_type === 'multiple_choice' || question.question_type === 'checkbox' || question.question_type === 'multi') {
          // Convert checkbox responses to array of selected values
          const selected = Object.entries(this.multiResponses[question.id] || {})
            .filter(([_, checked]) => checked)
            .map(([value, _]) => value);
          responseData[question.id] = selected;
        } else {
          responseData[question.id] = this.responses[question.id];
        }
      }

      // Save to database for guest view
      const { error } = await this.supabaseService.client
        .from('responses')
        .insert({
          questionnaire_id: this.questionnaire.id,
          response_data: responseData,
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;

      // Show success message for guest view
      this.toastService.show(
        this.lang.currentLanguage === 'he' ? 'השאלון נשלח בהצלחה' : 'Response submitted successfully!',
        'success'
      );
      this.isSubmitted = true;
    } catch (error: any) {
      this.toastService.show('Error submitting response: ' + (error.message || 'Unknown error'), 'error');
      console.error('Submit error:', error);
    }
  }

  cancel() {
    this.router.navigate(['/questionnaires']);
  }

  backToCreation() {
    // If in preview mode from a popup, close the window
    if (this.isPreviewMode) {
      window.close();
    } else {
      // Otherwise navigate back to questionnaires list
      this.router.navigate(['/questionnaires']);
    }
  }

  toggleViewMode(mode: 'form' | 'chat') {
    this.viewMode = mode;
  }

  resetForm() {
    this.responses = {};
    this.multiResponses = {};
    this.isSubmitted = false;

    // Re-initialize multi-choice responses
    this.questions.forEach(q => {
      if (q.question_type === 'multiple_choice' || q.question_type === 'checkbox' || q.question_type === 'multi') {
        this.multiResponses[q.id] = {};
      }
    });

    this.toastService.show(
      this.lang.currentLanguage === 'he' ? 'הטופס אופס' : 'Form reset',
      'success'
    );
  }
}
