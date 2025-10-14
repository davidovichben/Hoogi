import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { QuestionnaireService } from '../../core/services/questionnaire.service';
import { ToastService } from '../../core/services/toast.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { ReferralTrackingService } from '../../core/services/referral-tracking.service';
import { Questionnaire, Question, QuestionOption } from '../../core/models/questionnaire.model';

@Component({
  selector: 'app-questionnaire-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questionnaire-chat.html',
  styleUrl: './questionnaire-chat.sass'
})
export class QuestionnaireChat implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  questionnaire: Questionnaire | null = null;
  questions: Question[] = [];
  options: QuestionOption[] = [];
  isLoading = false;
  isSubmitted = false;
  isOwnerView = false; // Flag to determine if this is owner/preview mode

  // Current question tracking
  currentQuestionIndex = 0;
  chatMessages: Array<{type: 'bot' | 'user', text: string, questionIndex?: number, isSuccess?: boolean}> = [];

  // Owner's theme colors
  primaryColor = '#199f3a';
  secondaryColor = '#9cbb54';
  backgroundColor = '#b0a0a4';
  logoUrl = '';
  imageUrl = '';
  showLogo = true;
  showProfileImage = true;
  businessName = '';

  // Store responses
  responses: Record<string, any> = {};
  multiResponses: Record<string, Record<string, boolean>> = {};
  currentAnswer: string = '';

  // Auto-scroll control
  private shouldScrollToBottom = false;
  showOptions = true; // Always show options immediately
  optionsLoading = false; // Show spinner while options are loading

  // File upload
  uploadedFileName = '';
  uploadedFile: File | null = null;

  // Audio recording
  isRecording = false;
  audioFileName = '';
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioBlob: Blob | null = null;

  // Referral tracking
  private detectedChannel: string = 'direct';

  constructor(
    private questionnaireService: QuestionnaireService,
    private toastService: ToastService,
    private supabaseService: SupabaseService,
    public lang: LanguageService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private referralTracking: ReferralTrackingService
  ) {}

  ngOnInit() {
    // Detect referral source/channel
    this.detectedChannel = this.referralTracking.detectChannel();
    console.log('Detected channel:', this.detectedChannel);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Determine view mode based on route path
    const currentPath = this.router.url;
    if (currentPath.startsWith('/q/')) {
      // Public guest view - fillable chat form
      this.isOwnerView = false;
    } else if (currentPath.startsWith('/questionnaires/chat/') || currentPath.startsWith('/c/')) {
      // Owner preview or legacy chat route - preview mode
      this.isOwnerView = true;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      if (id === 'preview') {
        this.loadPreviewData();
      } else {
        this.loadQuestionnaire(id);
      }
    }
  }

  private validateName(name: string): { valid: boolean; message: string } {
    if (!name || !name.trim()) {
      return { valid: false, message: this.lang.currentLanguage === 'he' ? 'נא להזין שם' : 'Please enter a name' };
    }
    // Hebrew and English letters, spaces, hyphens, apostrophes only
    const nameRegex = /^[\u0590-\u05FFa-zA-Z\s'\-]+$/;
    if (!nameRegex.test(name.trim())) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'שם חייב להכיל אותיות בלבד (ללא מספרים או סמלים)'
          : 'Name must contain only letters (no numbers or symbols)'
      };
    }
    return { valid: true, message: '' };
  }

  private validateEmail(email: string): { valid: boolean; message: string } {
    if (!email || !email.trim()) {
      return { valid: false, message: this.lang.currentLanguage === 'he' ? 'נא להזין כתובת מייל' : 'Please enter an email address' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין כתובת מייל תקינה'
          : 'Please enter a valid email address'
      };
    }
    return { valid: true, message: '' };
  }

  private validateIsraeliPhone(phone: string): { valid: boolean; message: string } {
    if (!phone || !phone.trim()) {
      return { valid: false, message: this.lang.currentLanguage === 'he' ? 'נא להזין מספר טלפון' : 'Please enter a phone number' };
    }
    const cleanPhone = phone.replace(/\D/g, '');
    // Israeli: 9-10 digits, mobile starts with 05, landline starts with 0 followed by 2-9
    const israeliPhoneRegex = /^(0?(5[0-9]|[2-9])\d{7})$/;
    if (!israeliPhoneRegex.test(cleanPhone)) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין מספר טלפון ישראלי תקין (לדוגמה: 050-1234567)'
          : 'Please enter a valid Israeli phone number (e.g., 050-1234567)'
      };
    }
    return { valid: true, message: '' };
  }

  ngOnDestroy() {
    // Restore body scroll
    document.body.style.overflow = '';
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTo({
          top: this.messagesContainer.nativeElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  loadPreviewData() {
    this.isLoading = true;

    // Use setTimeout to ensure the loading spinner is shown
    setTimeout(() => {
      try {
        const previewDataStr = sessionStorage.getItem('preview_questionnaire');
        if (!previewDataStr) {
          this.toastService.show('No preview data found', 'error');
          this.isLoading = false;
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
          this.businessName = data.profile.business_name || '';
        }

        // This is preview mode (owner view)
        this.isOwnerView = true;

        // Don't clear preview data yet - keep it so form view can access it too
        // It will be cleared when user navigates away from preview

        this.initializeChat();
      } catch (error) {
        console.error('Error loading preview data:', error);
        this.toastService.show('Error loading preview', 'error');
      } finally {
        this.isLoading = false;
      }
    }, 0);
  }

  async loadQuestionnaire(tokenOrId: string) {
    this.isLoading = true;
    try {
      // Check if this is a UUID or a token
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenOrId);

      let data;
      if (isUUID) {
        data = await this.questionnaireService.fetchQuestionnaireForReview(tokenOrId);
      } else {
        data = await this.questionnaireService.fetchQuestionnaireByToken(tokenOrId);
      }

      if (data) {
        this.questionnaire = data.questionnaire;
        this.questions = data.questions;
        this.options = data.options || [];

        // Load showLogo and showProfileImage settings from questionnaire
        this.showLogo = data.questionnaire.show_logo ?? true;
        this.showProfileImage = data.questionnaire.show_profile_image ?? true;

        // Load owner's profile theme colors
        await this.loadOwnerTheme(this.questionnaire.owner_id);

        this.initializeChat();
      }
    } catch (error: any) {
      this.toastService.show(error.message || 'Failed to load questionnaire', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async loadOwnerTheme(ownerId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('brand_primary, brand_secondary, background_color, logo_url, image_url, business_name')
        .eq('id', ownerId)
        .single();

      if (!error && data) {
        this.primaryColor = data.brand_primary || '#199f3a';
        this.secondaryColor = data.brand_secondary || '#9cbb54';
        this.backgroundColor = data.background_color || '#b0a0a4';
        this.logoUrl = data.logo_url || '';
        this.imageUrl = data.image_url || '';
        this.businessName = data.business_name || '';
      }
    } catch (error) {
      console.error('Error loading owner theme:', error);
    }
  }

  initializeChat() {
    // Initialize multi-choice responses
    this.questions.forEach(q => {
      if (q.question_type === 'multiple_choice' || q.question_type === 'checkbox' || q.question_type === 'multi') {
        this.multiResponses[q.id] = {};
      }
    });

    // Add AI greeting
    this.chatMessages.push({
      type: 'bot',
      text: this.lang.t('questionnaireLive.aiGreeting')
    });

    // Add user greeting
    this.chatMessages.push({
      type: 'user',
      text: this.lang.t('questionnaireLive.userGreeting')
    });

    // Show first question
    if (this.questions.length > 0) {
      this.showCurrentQuestion();
    }
  }

  showCurrentQuestion() {
    // Reset file and audio state when showing new question
    this.uploadedFileName = '';
    this.uploadedFile = null;
    this.audioFileName = '';
    this.audioBlob = null;
    this.isRecording = false;

    if (this.currentQuestionIndex < this.questions.length) {
      const question = this.questions[this.currentQuestionIndex];
      this.chatMessages.push({
        type: 'bot',
        text: question.question_text,
        questionIndex: this.currentQuestionIndex
      });
      this.currentAnswer = '';

      // Check if this question has options (choice questions)
      const hasOptions = this.isSingleChoiceQuestion(question) || this.isMultiChoiceQuestion(question);

      if (hasOptions) {
        // Show spinner for choice questions
        this.optionsLoading = true;
        this.showOptions = true;

        // Wait for DOM to render the options, then scroll
        setTimeout(() => {
          this.optionsLoading = false;
          // Use requestAnimationFrame to ensure DOM is fully updated
          requestAnimationFrame(() => {
            setTimeout(() => {
              this.shouldScrollToBottom = true;
            }, 50);
          });
        }, 400);
      } else {
        // For text questions, show immediately and scroll
        this.optionsLoading = false;
        this.showOptions = true;
        setTimeout(() => {
          this.shouldScrollToBottom = true;
        }, 100);
      }
    }
  }

  getCurrentQuestion(): Question | null {
    if (this.currentQuestionIndex < this.questions.length) {
      return this.questions[this.currentQuestionIndex];
    }
    return null;
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

  isMultiChoiceQuestion(question: Question): boolean {
    return question.question_type === 'multiple_choice' ||
           question.question_type === 'checkbox' ||
           question.question_type === 'multi';
  }

  isSingleChoiceQuestion(question: Question): boolean {
    return question.question_type === 'single_choice' ||
           question.question_type === 'radio' ||
           question.question_type === 'single' ||
           question.question_type === 'conditional';
  }

  onOptionClick(question: Question, optionValue: string) {
    if (this.isSingleChoiceQuestion(question)) {
      // For single choice, set the response and move to next
      this.responses[question.id] = optionValue;
      this.submitCurrentAnswer(optionValue);
    } else if (this.isMultiChoiceQuestion(question)) {
      // For multi choice, toggle selection
      if (!this.multiResponses[question.id]) {
        this.multiResponses[question.id] = {};
      }
      this.multiResponses[question.id][optionValue] = !this.multiResponses[question.id][optionValue];
    }
  }

  isOptionSelected(question: Question, optionValue: string): boolean {
    if (this.isSingleChoiceQuestion(question)) {
      return this.responses[question.id] === optionValue;
    } else if (this.isMultiChoiceQuestion(question)) {
      return this.multiResponses[question.id]?.[optionValue] || false;
    }
    return false;
  }

  submitCurrentAnswer(answerText?: string) {
    const question = this.getCurrentQuestion();
    if (!question) return;

    let response: any;
    let displayText: string;

    if (this.isMultiChoiceQuestion(question)) {
      // Multi-choice: get selected options
      const selected = Object.entries(this.multiResponses[question.id] || {})
        .filter(([_, checked]) => checked)
        .map(([value, _]) => value);

      if (question.is_required && selected.length === 0) {
        const message = this.lang.currentLanguage === 'he'
          ? 'נא לבחור לפחות אפשרות אחת'
          : 'Please select at least one option';
        this.toastService.show(message, 'error');
        return;
      }

      response = selected;
      displayText = selected.join(', ');
    } else if (this.isSingleChoiceQuestion(question)) {
      // Single choice
      response = answerText || this.responses[question.id];
      displayText = response;
    } else {
      // Text-based answers
      response = answerText || this.currentAnswer;
      displayText = response;

      if (question.is_required && !response) {
        const message = this.lang.currentLanguage === 'he'
          ? 'נא להזין תשובה'
          : 'Please enter an answer';
        this.toastService.show(message, 'error');
        return;
      }

      // Validate first 3 questions (name, email, phone)
      if (this.currentQuestionIndex === 0) {
        // First question: Name validation
        const nameValidation = this.validateName(response);
        if (!nameValidation.valid) {
          this.toastService.show(nameValidation.message, 'error');
          return;
        }
      } else if (this.currentQuestionIndex === 1) {
        // Second question: Email validation
        const emailValidation = this.validateEmail(response);
        if (!emailValidation.valid) {
          this.toastService.show(emailValidation.message, 'error');
          return;
        }
      } else if (this.currentQuestionIndex === 2) {
        // Third question: Israeli phone validation
        const phoneValidation = this.validateIsraeliPhone(response);
        if (!phoneValidation.valid) {
          this.toastService.show(phoneValidation.message, 'error');
          return;
        }
      }
    }

    // Store the response
    this.responses[question.id] = response;

    // Add user's answer to chat and auto-advance (same for both guest and owner)
    this.chatMessages.push({
      type: 'user',
      text: displayText
    });
    // Delay scroll to allow DOM to render the user's message
    setTimeout(() => {
      this.shouldScrollToBottom = true;
    }, 100);

    // Move to next question or finish
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex < this.questions.length) {
      setTimeout(() => {
        this.showCurrentQuestion();
      }, 300);
    } else {
      // All questions answered, submit
      setTimeout(() => {
        this.submitAllResponses();
      }, 300);
    }
  }

  async submitAllResponses() {
    if (!this.questionnaire) return;

    // Don't actually submit in owner view mode
    if (this.isOwnerView) {
      this.isSubmitted = true;
      const thankYouMessage = this.lang.currentLanguage === 'he'
        ? 'תודה רבה! התשובות שלך נשלחו בהצלחה'
        : 'Thank you! Your responses have been submitted successfully';

      this.chatMessages.push({
        type: 'bot',
        text: thankYouMessage,
        isSuccess: true
      });
      // Delay scroll to allow DOM to render the thank you message
      setTimeout(() => {
        this.shouldScrollToBottom = true;
      }, 100);
      return;
    }

    try {
      // Prepare response data
      const responseData: Record<string, any> = {};

      for (const question of this.questions) {
        responseData[question.id] = this.responses[question.id];
      }

      // Save to database
      const { data: responseInsert, error } = await this.supabaseService.client
        .from('responses')
        .insert({
          questionnaire_id: this.questionnaire.id,
          response_data: responseData,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Extract lead data and save to leads table
      await this.saveLeadData(responseData, responseInsert?.id);

      this.isSubmitted = true;

      const thankYouMessage = this.lang.currentLanguage === 'he'
        ? 'תודה רבה! התשובות שלך נשלחו בהצלחה'
        : 'Thank you! Your responses have been submitted successfully';

      this.chatMessages.push({
        type: 'bot',
        text: thankYouMessage,
        isSuccess: true
      });
      // Delay scroll to allow DOM to render the thank you message
      setTimeout(() => {
        this.shouldScrollToBottom = true;
      }, 100);

    } catch (error: any) {
      this.toastService.show('Error submitting response: ' + (error.message || 'Unknown error'), 'error');
      console.error('Submit error:', error);
    }
  }

  private extractField(data: Record<string, any>, possibleKeys: string[]): string {
    // Try to find the field by checking question text and various possible keys
    for (const key in data) {
      const value = data[key];

      // Find the question for this response
      const question = this.questions.find(q => q.id === key);
      if (question) {
        const questionText = question.question_text.toLowerCase();

        // Check if question text matches any of our possible keys
        for (const possibleKey of possibleKeys) {
          if (questionText.includes(possibleKey.toLowerCase())) {
            // Handle array values (from multi-choice questions)
            if (Array.isArray(value)) {
              return value.join(', ');
            }
            return typeof value === 'string' ? value : String(value);
          }
        }
      }

      // Also check the key itself (in case it's a direct match)
      const lowerKey = key.toLowerCase();
      for (const possibleKey of possibleKeys) {
        if (lowerKey.includes(possibleKey.toLowerCase())) {
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          return typeof value === 'string' ? value : String(value);
        }
      }
    }
    return '';
  }

  private async saveLeadData(responseData: Record<string, any>, responseId?: string) {
    if (!this.questionnaire) return;

    try {
      // Extract client name from the first question (which is always the full name)
      let clientName = 'Unknown';
      if (this.questions.length > 0) {
        const firstQuestionId = this.questions[0].id;
        const firstAnswer = responseData[firstQuestionId];

        if (firstAnswer) {
          // Handle both string and array values
          if (Array.isArray(firstAnswer)) {
            clientName = firstAnswer.join(', ');
          } else if (typeof firstAnswer === 'string' && firstAnswer.trim()) {
            clientName = firstAnswer.trim();
          }
        }
      }

      // Prepare lead data with new schema
      const leadData = {
        questionnaire_id: this.questionnaire.id,
        client_name: clientName,
        partner_id: null, // Will be assigned later by admin/user
        channel: this.detectedChannel, // Detected from referral source
        status: 'new',
        sub_status: null,
        automations: [], // Empty array, will be configured by admin
        comments: null,
        answer_json: responseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into leads table
      const { error: leadError } = await this.supabaseService.client
        .from('leads')
        .insert(leadData);

      if (leadError) {
        console.error('Error saving lead data:', leadError);
        // Don't throw error - lead saving is optional, response is already saved
      }
    } catch (error) {
      console.error('Error in saveLeadData:', error);
      // Don't throw error - lead saving is optional
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitCurrentAnswer();
    }
  }

  skipCurrentQuestion() {
    const question = this.getCurrentQuestion();
    if (!question) return;

    // Only allow skipping if question is not required
    if (question.is_required) {
      const message = this.lang.currentLanguage === 'he'
        ? 'לא ניתן לדלג על שאלה חובה'
        : 'Cannot skip a required question';
      this.toastService.show(message, 'error');
      return;
    }

    // Add a "skipped" message to chat
    const skipMessage = this.lang.currentLanguage === 'he' ? 'ללא תשובה' : 'No answer';
    this.chatMessages.push({
      type: 'user',
      text: skipMessage
    });

    // Clear the response for this question
    this.responses[question.id] = null;

    setTimeout(() => {
      this.shouldScrollToBottom = true;
    }, 100);

    // Move to next question or finish
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex < this.questions.length) {
      setTimeout(() => {
        this.showCurrentQuestion();
      }, 300);
    } else {
      // All questions answered, submit
      setTimeout(() => {
        this.submitAllResponses();
      }, 300);
    }
  }

  goBackToEdit() {
    // For preview mode, close the tab and clear preview data
    if (this.questionnaire && this.questionnaire.id === 'preview') {
      sessionStorage.removeItem('preview_questionnaire');
      window.close();
      return;
    }

    // For non-preview owner view, navigate back to the questionnaire edit page
    if (this.questionnaire && this.questionnaire.id !== 'preview') {
      this.router.navigate(['/questionnaires/edit', this.questionnaire.id]);
    } else {
      // Fallback to questionnaires list
      this.router.navigate(['/questionnaires']);
    }
  }

  switchToFormView() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/questionnaires/live', id]);
    }
  }

  // Navigation methods for owner view
  goToPreviousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      if (this.isOwnerView) {
        this.updateOwnerViewQuestion();
      }
    }
  }

  goToNextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      if (this.isOwnerView) {
        this.updateOwnerViewQuestion();
      }
    }
  }

  updateOwnerViewQuestion() {
    // In owner view, clear current answer and file/audio state for the new question
    const question = this.getCurrentQuestion();
    if (!question) return;

    // Clear chat messages and show only the preview message and current question
    this.chatMessages = [];
    this.chatMessages.push({
      type: 'bot',
      text: this.lang.currentLanguage === 'he'
        ? 'מצב תצוגה מקדימה - השתמש בכפתורים למטה לניווט בין שאלות'
        : 'Preview mode - Use buttons below to navigate between questions'
    });
    this.chatMessages.push({
      type: 'bot',
      text: question.question_text,
      questionIndex: this.currentQuestionIndex
    });

    this.currentAnswer = this.responses[question.id] || '';
    this.uploadedFileName = '';
    this.uploadedFile = null;
    this.audioFileName = '';
    this.audioBlob = null;
    this.isRecording = false;

    // Update options loading state for choice questions
    const hasOptions = this.isSingleChoiceQuestion(question) || this.isMultiChoiceQuestion(question);
    if (hasOptions) {
      this.optionsLoading = true;
      this.showOptions = true;
      setTimeout(() => {
        this.optionsLoading = false;
        this.cdr.detectChanges();
      }, 100);
    } else {
      this.showOptions = true;
    }
  }

  canGoToPrevious(): boolean {
    return this.currentQuestionIndex > 0;
  }

  canGoToNext(): boolean {
    return this.currentQuestionIndex < this.questions.length - 1;
  }

  // File upload handler
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      try {
        // Upload file to Supabase Storage
        const timestamp = new Date().getTime();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `uploads/${fileName}`;

        const { data, error } = await this.supabaseService.client.storage
          .from('questionnaire-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: publicUrlData } = this.supabaseService.client.storage
          .from('questionnaire-files')
          .getPublicUrl(filePath);

        this.uploadedFile = file;
        this.uploadedFileName = file.name;
        this.currentAnswer = `File: ${publicUrlData.publicUrl}`;

        this.toastService.show(
          this.lang.currentLanguage === 'he' ? 'הקובץ הועלה בהצלחה' : 'File uploaded successfully',
          'success'
        );
      } catch (error: any) {
        console.error('Error uploading file:', error);
        this.toastService.show(
          this.lang.currentLanguage === 'he' ? 'שגיאה בהעלאת הקובץ' : 'Error uploading file',
          'error'
        );
      }
    }
  }

  // Audio recording methods
  async toggleAudioRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // Run inside Angular zone to ensure change detection works properly
        this.ngZone.run(() => {
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          this.audioFileName = `audio_${timestamp}.webm`;
          this.currentAnswer = `Audio recorded: ${this.audioFileName}`;

          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        });
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.toastService.show(
        this.lang.currentLanguage === 'he'
          ? 'שגיאה בגישה למיקרופון'
          : 'Error accessing microphone',
        'error'
      );
    }
  }

  async stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Wait a bit for the onstop event to fire and create the blob
      setTimeout(async () => {
        if (this.audioBlob) {
          try {
            // Upload audio to Supabase Storage
            const timestamp = new Date().getTime();
            const fileName = `audio_${timestamp}_${Math.random().toString(36).substring(7)}.webm`;
            const filePath = `uploads/${fileName}`;

            const { data, error } = await this.supabaseService.client.storage
              .from('questionnaire-files')
              .upload(filePath, this.audioBlob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'audio/webm'
              });

            if (error) throw error;

            // Get public URL
            const { data: publicUrlData } = this.supabaseService.client.storage
              .from('questionnaire-files')
              .getPublicUrl(filePath);

            // Update response with URL
            this.currentAnswer = `Audio: ${publicUrlData.publicUrl}`;

            this.toastService.show(
              this.lang.currentLanguage === 'he' ? 'ההקלטה נשמרה בהצלחה' : 'Recording saved successfully',
              'success'
            );
          } catch (error: any) {
            console.error('Error uploading audio:', error);
            this.toastService.show(
              this.lang.currentLanguage === 'he' ? 'שגיאה בשמירת ההקלטה' : 'Error saving recording',
              'error'
            );
          }
        }
      }, 500);
    }
  }

  getExternalUrl(url: string): string {
    if (!url) return '';
    // Check if URL already has a protocol
    if (url.match(/^https?:\/\//i)) {
      return url;
    }
    // Add https:// if no protocol is present
    return 'https://' + url;
  }
}
