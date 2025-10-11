import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { ProfileValidatorService } from '../../core/services/profile-validator.service';
import { OCCUPATIONS, OTHER } from '../../core/constants/occupations.constant';
import { take } from 'rxjs/operators';
import { CreateQuestionnaireQuestionsComponent, Question, QuestionnaireProfile } from './create-questionnaire-questions/create-questionnaire-questions.component';

interface Link {
  title: string;
  url: string;
}

interface QuestionnaireState {
  id?: string;
  title: string;
  description?: string;
  brandColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  imageUrl?: string;
  showLogo?: boolean;
  showProfileImage?: boolean;
  questions: Question[];
  status: 'draft' | 'locked' | 'pending';
  language: string;
  links?: Link[];
  businessName?: string;
  mobile?: string;
  email?: string;
  website?: string;
  occupation?: string;
  subOccupation?: string;
  occupationFree?: string;
  subOccupationFree?: string;
  linkUrl?: string;
  attachmentUrl?: string;
}

@Component({
  selector: 'app-create-questionnaire',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-questionnaire.component.html',
  styleUrls: ['./create-questionnaire.component.sass']
})
export class CreateQuestionnaireComponent implements OnInit {
  currentStep = 1;
  questionnaireId: string | null = null;

  formData: QuestionnaireState = {
    title: '',
    description: '',
    questions: [],
    status: 'draft',
    language: 'he',
    primaryColor: '#199f3a',
    secondaryColor: '#9cbb54',
    brandColor: '#b0a0a4',
    showLogo: true,
    showProfileImage: true,
    links: [],
    businessName: '',
    mobile: '',
    email: '',
    website: '',
    occupation: '',
    subOccupation: '',
    occupationFree: '',
    subOccupationFree: ''
  };

  loading = false;
  saving = false;
  selectedFileName = '';
  attachmentFileName = '';
  uploadingAttachment = false;
  currentUserId: string | null = null;
  
  // Error tracking for required fields
  errors = {
    businessName: false,
    email: false,
    mobile: false,
    occupation: false,
    subOccupation: false
  };

  get occupationKeys() {
    return Object.keys(OCCUPATIONS);
  }

  get OTHER() {
    return OTHER;
  }

  goBack() {
    this.router.navigate(['/questionnaires']);
  }

  constructor(
    public lang: LanguageService,
    private router: Router,
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private toast: ToastService,
    private profileValidator: ProfileValidatorService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    // Check if profile is complete before allowing questionnaire creation
    this.supabaseService.user$.pipe(take(1)).subscribe(async user => {
      if (user) {
        this.currentUserId = user.id;

        // Check profile completion
        const isComplete = await this.profileValidator.isProfileComplete(user.id);
        if (!isComplete) {
          this.showProfileIncompleteDialog();
          return;
        }

        await this.loadProfileData(user.id);
      }
    });

    // Get questionnaire ID from route params (for /questionnaires/edit/:id) or query params (legacy)
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.questionnaireId = id;
        this.loadQuestionnaire(id);
      }
    });

    // Also check query params for backwards compatibility
    this.route.queryParams.subscribe(params => {
      if (params['id'] && !this.questionnaireId) {
        this.questionnaireId = params['id'];
        this.loadQuestionnaire(params['id']);
      }
      if (params['step']) {
        this.currentStep = parseInt(params['step']) || 2;
      }
    });
  }

  showProfileIncompleteDialog() {
    const message = this.lang.t('createQuestionnaire.profileIncomplete');

    if (confirm(message)) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  async loadProfileData(userId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      if (data) {
        this.formData.businessName = data.company || '';
        this.formData.mobile = data.phone || '';
        this.formData.email = data.email || '';
        this.formData.website = data.website || '';
        this.formData.language = data.locale || 'he';
        this.formData.primaryColor = data.brand_primary || '#199f3a';
        this.formData.secondaryColor = data.brand_secondary || '#9cbb54';
        this.formData.brandColor = data.background_color || '#b0a0a4';
        this.formData.logoUrl = data.logo_url || '';
        this.formData.imageUrl = data.image_url || '';

        // Handle occupation
        const occupation = data.occupation || '';
        if (occupation && !this.occupationKeys.includes(occupation)) {
          // Custom occupation - set to "אחר" and populate free text
          this.formData.occupation = OTHER;
          this.formData.occupationFree = occupation;
        } else {
          this.formData.occupation = occupation;
        }

        // Handle suboccupation
        const suboccupation = data.suboccupation || '';
        if (suboccupation && this.formData.occupation && this.formData.occupation !== OTHER) {
          const validSubOccupations = OCCUPATIONS[this.formData.occupation] || [];
          if (!validSubOccupations.includes(suboccupation)) {
            // Custom suboccupation - set to "אחר" and populate free text
            this.formData.subOccupation = OTHER;
            this.formData.subOccupationFree = suboccupation;
          } else {
            this.formData.subOccupation = suboccupation;
          }
        } else {
          this.formData.subOccupation = suboccupation;
        }

        this.formData.links = data.links || [];
      }
    } catch (e: any) {
      console.error('Error loading profile data:', e);
    }
  }

  async loadQuestionnaire(id: string) {
    try {
      this.loading = true;

      // Load questionnaire
      const { data: questionnaire, error: qError } = await this.supabaseService.client
        .from('questionnaires')
        .select('*')
        .eq('id', id)
        .single();

      if (qError) throw qError;

      if (questionnaire) {
        // Load questions from questions table
        const { data: questions, error: questionsError } = await this.supabaseService.client
          .from('questions')
          .select('*')
          .eq('questionnaire_id', id)
          .order('question_order', { ascending: true });

        if (questionsError) {
          console.error('Error loading questions:', questionsError);
        }

        // Load question options
        let allOptions: any[] = [];
        if (questions && questions.length > 0) {
          const questionIds = questions.map(q => q.id);
          const { data: options, error: optionsError } = await this.supabaseService.client
            .from('question_options')
            .select('*')
            .in('question_id', questionIds)
            .order('order_index', { ascending: true });

          if (!optionsError && options) {
            allOptions = options;
          }
        }

        // Convert questions from database format to form format
        const convertedQuestions: Question[] = (questions || []).map(q => {
          // Find options for this question
          const questionOptions = allOptions.filter(opt => opt.question_id === q.id);

          return {
            id: q.id,
            text: q.question_text || '',
            type: q.question_type || 'text',
            isRequired: q.is_required || false,
            options: questionOptions.map(opt => opt.label || opt.value),
            minRating: (q as any).min_rating || (q as any).minimum || undefined,
            maxRating: (q as any).max_rating || (q as any).maximum || undefined
          } as Question;
        });

        // Update form data with questionnaire and questions
        this.formData.title = questionnaire.title || '';
        this.formData.description = questionnaire.description || '';
        this.formData.language = questionnaire.language || 'he';
        this.formData.linkUrl = questionnaire.link_url || '';
        this.formData.attachmentUrl = questionnaire.attachment_url || '';
        this.formData.questions = convertedQuestions;

        // Set attachment file name if attachment exists
        if (this.formData.attachmentUrl) {
          const urlParts = this.formData.attachmentUrl.split('/');
          this.attachmentFileName = urlParts[urlParts.length - 1] || 'attachment';
        }

        console.log('Loaded questionnaire:', questionnaire);
        console.log('Loaded questions:', convertedQuestions);
      }
    } catch (e: any) {
      console.error('Error loading questionnaire:', e);
      this.toast.show(e.message || String(e), 'error');
    } finally {
      this.loading = false;
    }
  }
  
  get questionnaireProfile(): QuestionnaireProfile {
    return {
      businessName: this.formData.businessName,
      occupation: this.formData.occupation,
      subOccupation: this.formData.subOccupation,
      occupationFree: this.formData.occupationFree,
      subOccupationFree: this.formData.subOccupationFree,
      email: this.formData.email,
      mobile: this.formData.mobile,
      links: this.formData.links
    };
  }
  
  openQuestionsDialog() {
    const dialogRef = this.dialog.open(CreateQuestionnaireQuestionsComponent, {
      width: '1000px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        questions: this.formData.questions,
        profile: this.questionnaireProfile,
        questionnaireId: this.questionnaireId,
        branding: {
          primaryColor: this.formData.primaryColor,
          secondaryColor: this.formData.secondaryColor,
          brandColor: this.formData.brandColor,
          logoUrl: this.formData.logoUrl,
          imageUrl: this.formData.imageUrl
        }
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.formData.questions = result;
      }
    });
  }
  
  async publishQuestionnaire() {
    await this.saveQuestionnaire('published');
  }

  async saveAndPublish() {
    const success = await this.saveQuestionnaire('published', '/distribution-hub');
    if (success && this.questionnaireId) {
      this.router.navigate(['/distribution-hub'], {
        queryParams: { questionnaireId: this.questionnaireId }
      });
    }
  }

  async saveQuestionnaire(status: 'draft' | 'published', navigationPath?: string): Promise<boolean> {
    try {
      this.saving = true;

      if (!this.currentUserId) {
        this.toast.show(this.lang.t('createQuestionnaire.pleaseLoginToSave'), 'error');
        return false;
      }

      // Validate that all questions have text
      const emptyQuestions = this.formData.questions.filter(q => !q.text || !q.text.trim());
      if (emptyQuestions.length > 0) {
        this.toast.show(this.lang.t('createQuestionnaire.allQuestionsRequired'), 'error');
        return false;
      }

      // Validate that choice questions have at least one non-empty option
      const choiceTypes = ['single_choice', 'multiple_choice', 'radio', 'checkbox', 'single', 'multi'];
      const questionsWithEmptyOptions = this.formData.questions.filter(q => {
        if (choiceTypes.includes(q.type)) {
          // Check if options array exists and has at least one non-empty option
          return !q.options || q.options.length === 0 || !q.options.some((opt: any) => {
            const optionText = typeof opt === 'string' ? opt : (opt.label || opt.value || '');
            return optionText.trim().length > 0;
          });
        }
        return false;
      });

      if (questionsWithEmptyOptions.length > 0) {
        const message = this.lang.currentLanguage === 'he'
          ? 'שאלות בחירה חייבות להכיל לפחות אפשרות אחת'
          : 'Choice questions must have at least one option';
        this.toast.show(message, 'error');
        return false;
      }

      const questionnaireData = {
        title: this.formData.title || this.lang.t('createQuestionnaire.untitled'),
        description: this.formData.description || '',
        language: this.formData.language,
        status,
        user_id: this.currentUserId,
        owner_id: this.currentUserId,
        is_active: status === 'published',
        link_url: this.formData.linkUrl || null,
        attachment_url: this.formData.attachmentUrl || null
      };

      if (this.questionnaireId) {
        // Update existing questionnaire
        const { error: updateError } = await this.supabaseService.client
          .from('questionnaires')
          .update(questionnaireData)
          .eq('id', this.questionnaireId);

        if (updateError) throw updateError;

        // Delete existing questions and their options
        const { error: deleteError } = await this.supabaseService.client
          .from('questions')
          .delete()
          .eq('questionnaire_id', this.questionnaireId);

        if (deleteError) throw deleteError;

        // Insert new questions
        await this.saveQuestions(this.questionnaireId);

        this.toast.show(status === 'draft' ? this.lang.t('createQuestionnaire.draftSaved') : this.lang.t('createQuestionnaire.publishedSuccessfully'), 'success');
      } else {
        // Create new questionnaire
        const { data, error } = await this.supabaseService.client
          .from('questionnaires')
          .insert([questionnaireData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          this.questionnaireId = data.id;

          // Insert questions
          await this.saveQuestions(data.id);

          this.toast.show(status === 'draft' ? this.lang.t('createQuestionnaire.draftSaved') : this.lang.t('createQuestionnaire.publishedSuccessfully'), 'success');
        }
      }

      // Only navigate if not going to distribution hub (we'll handle that in saveAndPublish)
      if (navigationPath !== '/distribution-hub') {
        this.router.navigate([navigationPath || '/questionnaires']);
      }

      return true;
    } catch (e: any) {
      this.toast.show(e.message || String(e), 'error');
      return false;
    } finally {
      this.saving = false;
    }
  }

  async saveQuestions(questionnaireId: string) {
    if (this.formData.questions.length === 0) return;

    // Prepare questions data
    const questionsData = this.formData.questions.map((q, index) => ({
      questionnaire_id: questionnaireId,
      question_text: q.text,
      is_active: true,
      question_type: q.type,
      is_required: q.isRequired,
      question_order: index + 1,
      min_rating: (q as any).minRating || null,
      max_rating: (q as any).maxRating || null
    }));

    // Insert questions
    const { data: savedQuestions, error: questionsError } = await this.supabaseService.client
      .from('questions')
      .insert(questionsData)
      .select();

    if (questionsError) throw questionsError;

    // Save question options if they exist
    if (savedQuestions && savedQuestions.length > 0) {
      const optionsData = [];
      for (let i = 0; i < savedQuestions.length; i++) {
        const question = savedQuestions[i];
        const originalQuestion = this.formData.questions[i];

        if (originalQuestion.options && originalQuestion.options.length > 0) {
          const questionOptions = originalQuestion.options.map((option: any, optionIndex: number) => ({
            question_id: question.id,
            value: typeof option === 'string' ? option : (option.value || option),
            label: typeof option === 'string' ? option : (option.label || option),
            order_index: optionIndex + 1
          }));
          optionsData.push(...questionOptions);
        }
      }

      if (optionsData.length > 0) {
        const { error: optionsError } = await this.supabaseService.client
          .from('question_options')
          .insert(optionsData);

        if (optionsError) {
          console.warn('Warning: Could not save question options:', optionsError);
          // Don't throw error for options, just log warning
        }
      }
    }
  }

  async onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.attachmentFileName = file.name;

    try {
      if (!this.currentUserId) {
        this.toast.show(this.lang.t('createQuestionnaire.pleaseLoginToUpload'), 'error');
        return;
      }

      this.uploadingAttachment = true;

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUserId}-${Date.now()}.${fileExt}`;
      const filePath = `questionnaire-attachments/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await this.supabaseService.client.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = this.supabaseService.client.storage
        .from('uploads')
        .getPublicUrl(filePath);

      this.formData.attachmentUrl = data.publicUrl;
      this.toast.show(this.lang.t('createQuestionnaire.fileUploadSuccess'), 'success');
    } catch (e: any) {
      this.toast.show(e.message || String(e), 'error');
      this.attachmentFileName = '';
    } finally {
      this.uploadingAttachment = false;
    }
  }

  triggerFileUpload() {
    const fileInput = document.getElementById('attachmentFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeAttachment() {
    this.formData.attachmentUrl = '';
    this.attachmentFileName = '';
    const fileInput = document.getElementById('attachmentFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
