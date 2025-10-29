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
  isOwnerView = false; // Flag to determine if this is owner view (shows header)
  isPreviewMode = false; // Flag to determine if this is preview mode (guest UI, no saving)

  // Current question tracking
  currentQuestionIndex = 0;
  highestQuestionReached = 0; // Track the highest question user has reached
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
  otherTextResponses: Record<string, string> = {}; // Store "other" text inputs
  currentAnswer: string = '';
  currentAnswerError: string = ''; // Validation error for current answer
  currentAnswerModified: boolean = false; // Track if user has modified the current answer

  // Auto-scroll control
  private shouldScrollToBottom = false;
  showOptions = true; // Always show options immediately
  optionsLoading = false; // Show spinner while options are loading
  isScrolling = false; // Prevent clicks during scroll animation

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
  private distributionToken: string | null = null;

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

    const token = this.route.snapshot.paramMap.get('token');
    const id = this.route.snapshot.paramMap.get('id');
    const tokenOrId = token || id;

    // Store distribution token if it's a distribution link
    if (token && token.startsWith('d_')) {
      this.distributionToken = token;
      console.log('Distribution token detected:', this.distributionToken);
    }

    // Check if this is a preview request (by path, not ID)
    if (currentPath.includes('/preview')) {
      this.loadPreviewData();
    } else if (tokenOrId) {
      this.loadQuestionnaire(tokenOrId);
    }
  }

  // Clear current answer validation error and mark as modified
  clearCurrentAnswerError() {
    this.currentAnswerError = '';
    this.currentAnswerModified = true; // User is typing, mark as modified
  }

  // Validate current answer based on question type (only if user has modified it)
  validateCurrentAnswer() {
    // Don't validate on blur if user hasn't modified the field yet
    if (!this.currentAnswerModified) {
      return;
    }

    const question = this.getCurrentQuestion();
    if (!question) return;

    if (question.question_type === 'email' && this.currentAnswer) {
      const validation = this.validateEmail(this.currentAnswer);
      if (!validation.valid) {
        this.currentAnswerError = validation.message;
      } else {
        this.currentAnswerError = '';
      }
    } else if (question.question_type === 'phone' && this.currentAnswer) {
      const validation = this.validateIsraeliPhone(this.currentAnswer);
      if (!validation.valid) {
        this.currentAnswerError = validation.message;
      } else {
        this.currentAnswerError = '';
      }
    } else if (question.question_type === 'url' && this.currentAnswer) {
      const validation = this.validateUrl(this.currentAnswer);
      if (!validation.valid) {
        this.currentAnswerError = validation.message;
      } else {
        this.currentAnswerError = '';
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

    const trimmedEmail = email.trim();

    // Check for consecutive dots
    if (/\.\./.test(trimmedEmail)) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'כתובת מייל לא יכולה להכיל נקודות רצופות'
          : 'Email cannot contain consecutive dots'
      };
    }

    // Strict email validation: xxxx@xxxx.xxx format
    // - Must start and end with alphanumeric in local part
    // - Can contain letters, numbers, dots, underscores, hyphens, plus in middle
    // - Domain must be valid
    // - TLD must be at least 2 characters
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._+-]*[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

    // Special case: single character before @
    const singleCharRegex = /^[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(trimmedEmail) && !singleCharRegex.test(trimmedEmail)) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין כתובת מייל בפורמט: example@domain.com'
          : 'Please enter email in format: example@domain.com'
      };
    }

    // Additional validation: check for valid structure
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'כתובת מייל חייבת להכיל @ אחד בלבד'
          : 'Email must contain exactly one @'
      };
    }

    const [localPart, domainPart] = parts;

    // Check local part doesn't start or end with dot
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'כתובת מייל לא תקינה'
          : 'Invalid email address'
      };
    }

    // Check domain has at least one dot
    if (!domainPart.includes('.')) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'דומיין חייב להכיל נקודה'
          : 'Domain must contain a dot'
      };
    }

    return { valid: true, message: '' };
  }

  private validateIsraeliPhone(phone: string): { valid: boolean; message: string } {
    if (!phone || !phone.trim()) {
      return { valid: false, message: this.lang.currentLanguage === 'he' ? 'נא להזין מספר טלפון' : 'Please enter a phone number' };
    }

    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');

    // Israeli mobile phone validation (strict):
    // - Must be exactly 10 digits
    // - Must start with 05
    // - Second digit after 05 must be 0-9 (050, 051, 052, 053, 054, 055, 056, 057, 058, 059)
    // - Followed by 7 more digits
    const israeliMobileRegex = /^05[0-9]\d{7}$/;

    if (!israeliMobileRegex.test(cleanPhone)) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין מספר סלולרי ישראלי תקין (10 ספרות, מתחיל ב-05)'
          : 'Please enter a valid Israeli mobile number (10 digits, starts with 05)'
      };
    }

    // Additional check: verify it's a known Israeli mobile prefix
    const prefix = cleanPhone.substring(0, 3);
    const validPrefixes = ['050', '051', '052', '053', '054', '055', '056', '057', '058', '059'];

    if (!validPrefixes.includes(prefix)) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'קידומת מספר לא תקינה (חייב להתחיל ב-050 עד 059)'
          : 'Invalid prefix (must start with 050-059)'
      };
    }

    return { valid: true, message: '' };
  }

  private validateUrl(url: string): { valid: boolean; message: string } {
    if (!url || !url.trim()) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he' ? 'נא להזין כתובת URL' : 'Please enter a URL'
      };
    }

    const trimmedUrl = url.trim();

    // URL validation:
    // - Must start with http:// or https:// or www.
    // - Must have a valid domain structure
    // - Can contain path, query params, etc.
    try {
      // If URL doesn't start with protocol, add https:// for validation
      let urlToValidate = trimmedUrl;
      if (!trimmedUrl.match(/^https?:\/\//i)) {
        if (trimmedUrl.startsWith('www.')) {
          urlToValidate = 'https://' + trimmedUrl;
        } else {
          // Check if it looks like a domain (contains a dot)
          if (trimmedUrl.includes('.')) {
            urlToValidate = 'https://' + trimmedUrl;
          } else {
            return {
              valid: false,
              message: this.lang.currentLanguage === 'he'
                ? 'נא להזין כתובת URL תקינה (לדוגמה: https://example.com)'
                : 'Please enter a valid URL (e.g., https://example.com)'
            };
          }
        }
      }

      // Try to create a URL object - will throw if invalid
      const urlObj = new URL(urlToValidate);

      // Check that the hostname has at least one dot (domain.tld)
      if (!urlObj.hostname.includes('.')) {
        return {
          valid: false,
          message: this.lang.currentLanguage === 'he'
            ? 'כתובת URL חייבת להכיל דומיין תקין'
            : 'URL must contain a valid domain'
        };
      }

      return { valid: true, message: '' };
    } catch (e) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין כתובת URL תקינה (לדוגמה: https://example.com)'
          : 'Please enter a valid URL (e.g., https://example.com)'
      };
    }
  }

  ngOnDestroy() {
    // Restore body scroll
    document.body.style.overflow = '';
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.isScrolling = true;
        this.messagesContainer.nativeElement.scrollTo({
          top: this.messagesContainer.nativeElement.scrollHeight,
          behavior: 'smooth'
        });
        // Re-enable clicks after scroll animation completes (smooth scroll takes ~300-500ms)
        setTimeout(() => {
          this.isScrolling = false;
        }, 600);
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
      this.isScrolling = false;
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
          user_id: data.questionnaire.owner_id,
          link_url: data.questionnaire.link_url || null,
          link_label: data.questionnaire.link_label || null,
          attachment_url: data.questionnaire.attachment_url || null
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

        // This is preview mode - show header but don't save
        this.isPreviewMode = true;
        this.isOwnerView = true; // Show preview header with back button and toggle

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
      // Check if this is a distribution token
      const isDistributionToken = tokenOrId.startsWith('d_');
      // Check if this is a UUID or a token
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenOrId);

      console.log('Loading questionnaire:', { tokenOrId, isUUID, isDistributionToken });

      let data;

      if (isDistributionToken) {
        // Load distribution first to get questionnaire_id using RPC (bypasses RLS)
        const { data: distributions, error: distError } = await this.supabaseService.client
          .rpc('get_distribution_by_token', { p_token: tokenOrId });

        if (distError || !distributions || distributions.length === 0) {
          console.error('Distribution not found or inactive:', distError);
          // Fallback to direct query in case RPC doesn't exist yet
          const { data: distribution, error: fallbackError } = await this.supabaseService.client
            .from('distributions')
            .select('questionnaire_id, is_active')
            .eq('token', tokenOrId)
            .eq('is_active', true)
            .single();

          if (fallbackError || !distribution) {
            console.error('Distribution not found (fallback also failed):', fallbackError);
            throw new Error('Distribution not found or inactive. Please check the URL.');
          }

          console.log('Distribution found (via fallback):', distribution);
          data = await this.questionnaireService.fetchQuestionnaireForReview(distribution.questionnaire_id);
        } else {
          const distribution = distributions[0];
          console.log('Distribution found (via RPC):', distribution);
          // Load questionnaire by ID from distribution
          data = await this.questionnaireService.fetchQuestionnaireForReview(distribution.questionnaire_id);
        }
      } else if (isUUID) {
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

    // Pre-render all questions in the DOM but keep them hidden
    this.questions.forEach((question, index) => {
      this.chatMessages.push({
        type: 'bot',
        text: question.question_text,
        questionIndex: index
      });

      // Add placeholder for user answer (will be updated when answered)
      this.chatMessages.push({
        type: 'user',
        text: '',
        questionIndex: index
      });
    });

    // Trigger initial scroll after DOM updates
    if (this.questions.length > 0) {
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.shouldScrollToBottom = true;
            this.cdr.detectChanges();
          }, 100);
        });
      });
    }
  }

  showCurrentQuestion() {
    // Reset file and audio state when showing new question
    this.uploadedFileName = '';
    this.uploadedFile = null;
    this.audioFileName = '';
    this.audioBlob = null;
    this.isRecording = false;
    this.currentAnswer = '';
    this.currentAnswerModified = false; // Reset modified flag for new question

    // Questions are pre-rendered, just trigger scroll to current question
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        }, 100);
      });
    });
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

  isRatingQuestion(question: Question): boolean {
    return question.question_type === 'rating';
  }

  getRatingRange(question: Question): number[] {
    const min = (question as any).min_rating || 1;
    const max = (question as any).max_rating || 5;
    const range: number[] = [];
    for (let i = min; i <= max; i++) {
      range.push(i);
    }
    return range;
  }

  hasOtherOption(questionId: string): boolean {
    const question = this.questions.find(q => q.id === questionId);

    // First check if hasOther is explicitly set
    if ((question as any)?.hasOther === true) {
      return true;
    }

    // Fallback: check if any of the options contain "אחר" or "other"
    const options = this.getQuestionOptions(questionId);
    const hasOtherInOptions = options.some(opt => {
      const lowerLabel = opt.label.toLowerCase().trim();
      const lowerValue = opt.value.toLowerCase().trim();
      return lowerLabel === 'אחר' || lowerLabel === 'other' ||
             lowerValue === 'אחר' || lowerValue === 'other';
    });

    return hasOtherInOptions;
  }

  // Check if "other" option is selected for single choice
  isOtherSelected(questionId: string): boolean {
    const response = this.responses[questionId];
    if (!response) return false;

    const lowerResponse = response.toString().toLowerCase().trim();
    return lowerResponse === 'אחר' || lowerResponse === 'other';
  }

  // Check if "other" option is checked for multiple choice
  isOtherChecked(questionId: string): boolean {
    const multiResponse = this.multiResponses[questionId];
    if (!multiResponse) return false;

    // Check if any of the checked options is "אחר" or "other"
    return Object.keys(multiResponse).some(key => {
      const lowerKey = key.toLowerCase();
      return multiResponse[key] && (lowerKey === 'אחר' || lowerKey === 'other');
    });
  }

  onOptionClick(question: Question, optionValue: string) {
    // Prevent clicks during scroll animation
    if (this.isScrolling) {
      return;
    }

    if (this.isSingleChoiceQuestion(question)) {
      // For single choice, set the response
      this.responses[question.id] = optionValue;

      // Check if "Other" was selected
      const lowerValue = optionValue.toLowerCase().trim();
      const isOther = lowerValue === 'אחר' || lowerValue === 'other';

      // Check if this is the last question
      const isLastQuestion = this.currentQuestionIndex === this.questions.length - 1;

      // Only auto-submit if it's NOT "Other" AND NOT the last question
      // (last question should show a send button)
      if (!isOther && !isLastQuestion) {
        this.submitCurrentAnswer(optionValue);
      }
    } else if (this.isMultiChoiceQuestion(question)) {
      // For multi choice, toggle selection
      if (!this.multiResponses[question.id]) {
        this.multiResponses[question.id] = {};
      }
      this.multiResponses[question.id][optionValue] = !this.multiResponses[question.id][optionValue];
    } else if (this.isRatingQuestion(question)) {
      // For rating, set the response and move to next
      this.responses[question.id] = optionValue;
      this.submitCurrentAnswer(optionValue);
    }
  }

  isOptionSelected(question: Question, optionValue: string): boolean {
    if (this.isSingleChoiceQuestion(question)) {
      return this.responses[question.id] === optionValue;
    } else if (this.isMultiChoiceQuestion(question)) {
      return this.multiResponses[question.id]?.[optionValue] || false;
    } else if (this.isRatingQuestion(question)) {
      return this.responses[question.id] === optionValue;
    }
    return false;
  }

  submitCurrentAnswer(answerText?: string) {
    // Prevent submission during scroll animation
    if (this.isScrolling) {
      return;
    }

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

      // Format the selected options for display, including "Other" text if applicable
      const displayOptions = selected.map(value => {
        const lowerValue = value.toLowerCase().trim();
        if ((lowerValue === 'אחר' || lowerValue === 'other') && this.otherTextResponses[question.id]) {
          return `${value}: ${this.otherTextResponses[question.id]}`;
        }
        return value;
      });

      response = selected;
      displayText = displayOptions.join(', ');
    } else if (this.isSingleChoiceQuestion(question)) {
      // Single choice
      response = answerText || this.responses[question.id];
      displayText = response;

      // If "Other" is selected, append the text input
      if (this.isOtherSelected(question.id) && this.otherTextResponses[question.id]) {
        displayText = `${response}: ${this.otherTextResponses[question.id]}`;
      }
    } else {
      // Text-based answers
      response = answerText || this.currentAnswer;
      displayText = response;

      if (question.is_required && !response) {
        const message = this.lang.currentLanguage === 'he'
          ? 'נא להזין תשובה'
          : 'Please enter an answer';
        this.currentAnswerError = message;
        return;
      }

      // Validate based on question type (only if there's a response OR if required)
      if (question.question_type === 'text' && this.currentQuestionIndex === 0) {
        // First question: Name validation (always validate if required, or if there's input)
        if (response || question.is_required) {
          const nameValidation = this.validateName(response);
          if (!nameValidation.valid) {
            this.currentAnswerError = nameValidation.message;
            return;
          }
        }
      } else if (question.question_type === 'email') {
        // Email validation: only if there's a response (format check)
        if (response && response.trim()) {
          const emailValidation = this.validateEmail(response);
          if (!emailValidation.valid) {
            this.currentAnswerError = emailValidation.message;
            return;
          }
        }
      } else if (question.question_type === 'phone') {
        // Phone validation: only if there's a response (format check)
        if (response && response.trim()) {
          const phoneValidation = this.validateIsraeliPhone(response);
          if (!phoneValidation.valid) {
            this.currentAnswerError = phoneValidation.message;
            return;
          }
        }
      } else if (question.question_type === 'url') {
        // URL validation: only if there's a response (format check)
        if (response && response.trim()) {
          const urlValidation = this.validateUrl(response);
          if (!urlValidation.valid) {
            this.currentAnswerError = urlValidation.message;
            return;
          }
        }
      }
    }

    // Store the response
    this.responses[question.id] = response;

    // Clear validation error and reset modified flag since submission was successful
    this.currentAnswerError = '';
    this.currentAnswerModified = false;

    // Update the existing user message for this question
    const userMessageIndex = this.chatMessages.findIndex(
      msg => msg.type === 'user' && msg.questionIndex === this.currentQuestionIndex
    );
    if (userMessageIndex !== -1) {
      this.chatMessages[userMessageIndex].text = displayText;
    }

    // Move to next question or finish
    this.currentQuestionIndex++;
    // Track the highest question reached so we can show all visited questions
    if (this.currentQuestionIndex > this.highestQuestionReached) {
      this.highestQuestionReached = this.currentQuestionIndex;
    }
    this.cdr.detectChanges();

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

    // Don't actually submit in preview mode
    if (this.isPreviewMode) {
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
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.shouldScrollToBottom = true;
            this.cdr.detectChanges();
          }, 100);
        });
      });
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
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.shouldScrollToBottom = true;
            this.cdr.detectChanges();
          }, 100);
        });
      });

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

      // Extract email, phone, name from responseData (usually first 3 questions)
      let email = null;
      let phone = null;
      let name = clientName;

      if (this.questions.length >= 2) {
        const emailAnswer = responseData[this.questions[1]?.id];
        if (emailAnswer && typeof emailAnswer === 'string') email = emailAnswer;
      }
      if (this.questions.length >= 3) {
        const phoneAnswer = responseData[this.questions[2]?.id];
        if (phoneAnswer && typeof phoneAnswer === 'string') phone = phoneAnswer;
      }

      // Use RPC function to insert lead (bypasses RLS)
      const { data: leadId, error: leadError } = await this.supabaseService.client
        .rpc('submit_lead', {
          p_questionnaire_id: this.questionnaire.id,
          p_client_name: clientName,
          p_answer_json: responseData,
          p_email: email,
          p_phone: phone,
          p_name: name,
          p_distribution_token: this.distributionToken,
          p_channel: this.detectedChannel
        });

      if (leadError) {
        console.error('Error saving lead data:', leadError);
        // Don't throw error - lead saving is optional, response is already saved
        return;
      }

      // Create a minimal lead object for compatibility
      const insertedLead = {
        id: leadId,
        questionnaire_id: this.questionnaire.id,
        client_name: clientName,
        answer_json: responseData,
        email,
        phone,
        name,
        distribution_token: this.distributionToken,
        channel: this.detectedChannel
      };

      // Trigger automation by calling the Edge Function directly
      if (insertedLead) {
        this.triggerAutomation(insertedLead);
      }
    } catch (error) {
      console.error('Error in saveLeadData:', error);
      // Don't throw error - lead saving is optional
    }
  }

  private async triggerAutomation(lead: any) {
    try {
      console.log('🚀 [CLIENT] Triggering automation for lead:', lead.id);
      console.log('📦 [CLIENT] Lead data:', lead);

      // Call the on-new-lead Edge Function to trigger automation
      const { data, error } = await this.supabaseService.client.functions.invoke('on-new-lead', {
        body: {
          type: 'INSERT',
          table: 'leads',
          record: lead
        }
      });

      if (error) {
        console.error('❌ [CLIENT] Error triggering automation:', error);
        // Don't throw - automation failure shouldn't affect the submission
      } else {
        console.log('✅ [CLIENT] Automation triggered successfully:', data);
      }
    } catch (error) {
      console.error('❌ [CLIENT] Error in triggerAutomation:', error);
      // Don't throw - automation failure shouldn't affect the submission
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitCurrentAnswer();
    }
  }

  goBackOneQuestion() {
    // Prevent going back during scroll animation
    if (this.isScrolling) {
      return;
    }

    // Can't go back if at the first question or already submitted
    if (this.currentQuestionIndex === 0 || this.isSubmitted) {
      return;
    }

    // Move back to previous question
    this.currentQuestionIndex--;
    const previousQuestion = this.getCurrentQuestion();

    if (!previousQuestion) return;

    // Pre-populate input fields with existing responses so user can see and edit them
    if (this.responses[previousQuestion.id]) {
      const existingResponse = this.responses[previousQuestion.id];
      // For text-based questions, populate the input field with existing answer
      if (!this.isSingleChoiceQuestion(previousQuestion) &&
          !this.isMultiChoiceQuestion(previousQuestion) &&
          !this.isRatingQuestion(previousQuestion)) {
        if (Array.isArray(existingResponse)) {
          this.currentAnswer = existingResponse.join(', ');
        } else {
          this.currentAnswer = String(existingResponse);
        }
      } else {
        this.currentAnswer = '';
      }
    } else {
      this.currentAnswer = '';
    }

    // Clear validation error and reset modified flag
    this.currentAnswerError = '';
    this.currentAnswerModified = false; // Reset so validation doesn't trigger on blur

    // Clear UI-only state (files/audio) - actual stored responses remain intact
    this.uploadedFileName = '';
    this.uploadedFile = null;
    this.audioFileName = '';
    this.audioBlob = null;
    this.isRecording = false;

    // IMPORTANT: Do NOT delete or modify the following:
    // - this.responses[previousQuestion.id] - keeps the stored answer data
    // - this.multiResponses[previousQuestion.id] - keeps checkbox/radio selections
    // - this.otherTextResponses[previousQuestion.id] - keeps "Other" text input
    // - chatMessages[].text - keeps the visible answer in the chat bubble
    // This allows users to review their previous answers and modify them if needed

    // Trigger change detection and scroll to show the question again
    this.cdr.detectChanges();
    this.shouldScrollToBottom = true;
  }

  shouldShowSendButton(): boolean {
    const question = this.getCurrentQuestion();
    if (!question || this.isSubmitted || this.currentQuestionIndex !== this.questions.length - 1) {
      return false;
    }

    // Show for single-choice (but not when "Other" is selected, as that's handled in bubble)
    if (this.isSingleChoiceQuestion(question)) {
      return !!this.responses[question.id] && !this.isOtherSelected(question.id);
    }

    // Show for multi-choice if at least one option is selected
    if (this.isMultiChoiceQuestion(question)) {
      const selections = this.multiResponses[question.id];
      if (!selections) return false;
      return Object.values(selections).some(checked => checked);
    }

    return false;
  }

  skipCurrentQuestion() {
    // Prevent skipping during scroll animation
    if (this.isScrolling) {
      return;
    }

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

    // Update the existing user message for this question with skip message
    const skipMessage = this.lang.currentLanguage === 'he' ? 'ללא תשובה' : 'No answer';
    const userMessageIndex = this.chatMessages.findIndex(
      msg => msg.type === 'user' && msg.questionIndex === this.currentQuestionIndex
    );
    if (userMessageIndex !== -1) {
      this.chatMessages[userMessageIndex].text = skipMessage;
    }

    // Clear the response for this question
    this.responses[question.id] = null;

    // Move to next question or finish
    this.currentQuestionIndex++;
    // Track the highest question reached so we can show all visited questions
    if (this.currentQuestionIndex > this.highestQuestionReached) {
      this.highestQuestionReached = this.currentQuestionIndex;
    }
    this.cdr.detectChanges();

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
    // For preview mode, switch to form preview
    if (this.router.url.includes('/preview')) {
      this.router.navigate(['/questionnaires/live/preview']);
    } else {
      const token = this.route.snapshot.paramMap.get('token');
      const id = this.route.snapshot.paramMap.get('id');
      const tokenOrId = token || id;
      if (tokenOrId) {
        // If it's a public route (token), navigate to q/:token
        if (token) {
          this.router.navigate(['/q', tokenOrId]);
        } else {
          this.router.navigate(['/questionnaires/live', tokenOrId]);
        }
      }
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

    // Update options loading state for choice questions and rating
    const hasOptions = this.isSingleChoiceQuestion(question) || this.isMultiChoiceQuestion(question) || this.isRatingQuestion(question);
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

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '';

    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }
}
