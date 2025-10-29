import { Component, OnInit } from '@angular/core';
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
  businessName = '';

  // Preview-specific data
  isPreviewMode = false;
  questionnaireDate = new Date();

  // Store responses
  responses: Record<string, any> = {};
  multiResponses: Record<string, Record<string, boolean>> = {};
  otherTextResponses: Record<string, string> = {}; // Store "other" text inputs
  validationErrors: Record<string, string> = {}; // Store validation errors per question

  // File upload
  uploadedFiles: Record<string, { file: File; name: string }> = {};

  // Audio recording
  isRecording: Record<string, boolean> = {};
  audioFiles: Record<string, { blob: Blob; name: string }> = {};
  private mediaRecorders: Record<string, MediaRecorder> = {};
  private audioChunks: Record<string, Blob[]> = {};

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
    private referralTracking: ReferralTrackingService
  ) {}

  ngOnInit() {
    console.log('=== QuestionnaireLive ngOnInit called ===');
    console.log('Current URL:', this.router.url);

    // Detect referral source/channel
    this.detectedChannel = this.referralTracking.detectChannel();
    console.log('Detected channel:', this.detectedChannel);

    const token = this.route.snapshot.paramMap.get('token');
    const id = this.route.snapshot.paramMap.get('id');
    const tokenOrId = token || id;
    console.log('Route parameters:', { token, id, tokenOrId });

    // Store distribution token if it's a distribution link
    if (token && token.startsWith('d_')) {
      this.distributionToken = token;
      console.log('Distribution token detected:', this.distributionToken);
    }

    // Determine view mode based on route path
    const currentPath = this.router.url;
    console.log('Current path:', currentPath);

    // Always form view (chat has its own component now)
    this.viewMode = 'form';

    // Determine ownership
    if (currentPath.startsWith('/q/')) {
      // Public guest view - always show fillable form
      this.isOwner = false;
    } else if (currentPath.startsWith('/questionnaires/')) {
      // Owner preview - show disabled preview
      this.isOwner = true;
    }

    // Check if this is a preview request (by path, not ID)
    if (currentPath.includes('/preview')) {
      console.log('Loading preview mode...');
      this.loadPreviewData();
    } else if (tokenOrId) {
      console.log('Loading questionnaire by ID/token...');
      this.loadQuestionnaire(tokenOrId);
    } else {
      console.error('No ID or token parameter found in route!');
    }
  }

  loadPreviewData() {
    this.isLoading = true;

    // Use setTimeout to ensure the loading spinner is shown
    setTimeout(() => {
      try {
        const previewDataStr = sessionStorage.getItem('preview_questionnaire');
        console.log('Preview data from storage:', previewDataStr);

        if (!previewDataStr) {
          console.error('No preview data found in sessionStorage');
          this.toastService.show('No preview data found', 'error');
          this.isLoading = false;
          return;
        }

        const data = JSON.parse(previewDataStr);
        console.log('Parsed preview data:', data);

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
        this.isOwner = true; // Always show as owner view for preview
        this.isPreviewMode = true; // Enable preview mode
        this.questionnaireDate = new Date();

        console.log('Loaded questions:', this.questions);
        console.log('Loaded options:', this.options);

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

        // Initialize multi-choice responses
        this.questions.forEach(q => {
          if (q.question_type === 'multiple_choice' || q.question_type === 'checkbox' || q.question_type === 'multi') {
            this.multiResponses[q.id] = {};
          }
        });

        // Don't clear preview data yet - keep it so chat view can access it too
        // It will be cleared when user navigates away from preview
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
      // Silently fail and use default colors
      console.error('Error loading owner theme:', error);
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

  getQuestionOptions(questionId: string): QuestionOption[] {
    // First check if the question has options stored directly
    const question = this.questions.find(q => q.id === questionId);
    if (question && (question as any).options && Array.isArray((question as any).options)) {
      // Convert inline options array to QuestionOption format
      const inlineOptions = (question as any).options.map((opt: string, index: number) => ({
        id: `${questionId}_opt_${index}`,
        question_id: questionId,
        label: opt,
        value: opt,
        order_index: index
      }));

      // Remove duplicates based on value
      const uniqueOptions = inlineOptions.filter((opt: QuestionOption, index: number, self: QuestionOption[]) =>
        index === self.findIndex((o: QuestionOption) => o.value === opt.value)
      );

      return uniqueOptions;
    }

    // Fall back to separate options array and remove duplicates
    const separateOptions = this.options.filter(opt => opt.question_id === questionId);
    const uniqueOptions = separateOptions.filter((opt, index, self) =>
      index === self.findIndex(o => o.value === opt.value)
    );

    return uniqueOptions;
  }

  // Check if question has "other" option
  hasOtherOption(questionId: string): boolean {
    const question = this.questions.find(q => q.id === questionId);

    // First check if hasOther is explicitly set
    if ((question as any)?.hasOther === true) {
      console.log('hasOtherOption: true (explicit hasOther field)', { questionId });
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

    console.log('hasOtherOption check:', { questionId, hasOtherInOptions, options });
    return hasOtherInOptions;
  }

  // Check if "other" option is selected for single choice
  isOtherSelected(questionId: string): boolean {
    const response = this.responses[questionId];
    if (!response) return false;

    const lowerResponse = response.toString().toLowerCase().trim();
    const isOther = lowerResponse === 'אחר' || lowerResponse === 'other';
    console.log('isOtherSelected check:', { questionId, response, lowerResponse, isOther });
    return isOther;
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

  getRatingRange(question: Question): number[] {
    const min = (question as any).min_rating || question.minimum || question.meta?.minimum || 1;
    const max = (question as any).max_rating || question.maximum || question.meta?.maximum || 5;
    const range: number[] = [];
    for (let i = min; i <= max; i++) {
      range.push(i);
    }
    return range;
  }

  // Clear validation error for a specific question
  clearValidationError(questionId: string) {
    if (this.validationErrors[questionId]) {
      delete this.validationErrors[questionId];
    }
  }

  // Validate email on blur
  validateEmailField(questionId: string) {
    const emailValue = this.responses[questionId] || '';
    if (emailValue) {
      const emailValidation = this.validateEmail(emailValue);
      if (!emailValidation.valid) {
        this.validationErrors[questionId] = emailValidation.message;
      } else {
        this.clearValidationError(questionId);
      }
    }
  }

  // Validate phone on blur
  validatePhoneField(questionId: string) {
    const phoneValue = this.responses[questionId] || '';
    if (phoneValue) {
      const phoneValidation = this.validateIsraeliPhone(phoneValue);
      if (!phoneValidation.valid) {
        this.validationErrors[questionId] = phoneValidation.message;
      } else {
        this.clearValidationError(questionId);
      }
    }
  }

  // Validate URL on blur
  validateUrlField(questionId: string) {
    const urlValue = this.responses[questionId] || '';
    if (urlValue) {
      const urlValidation = this.validateUrl(urlValue);
      if (!urlValidation.valid) {
        this.validationErrors[questionId] = urlValidation.message;
      } else {
        this.clearValidationError(questionId);
      }
    }
  }

  // Validation methods
  private validateName(name: string): { valid: boolean; message: string } {
    if (!name || !name.trim()) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he' ? 'נא להזין שם' : 'Please enter a name'
      };
    }

    // Check for numbers or symbols (allow letters, spaces, hyphens, and apostrophes)
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
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he' ? 'נא להזין אימייל' : 'Please enter an email'
      };
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
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he' ? 'נא להזין מספר טלפון' : 'Please enter a phone number'
      };
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

  // Check if there are any validation errors
  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  // Get count of validation errors
  getValidationErrorCount(): number {
    return Object.keys(this.validationErrors).length;
  }

  async submitResponse(event: Event) {
    event.preventDefault();

    if (!this.questionnaire) return;

    // Clear all validation errors before validating
    this.validationErrors = {};

    try {
      let hasErrors = false;

      // Validate first question as name (if it's a text field)
      if (this.questions.length >= 1) {
        const firstQuestion = this.questions[0];
        if (firstQuestion.question_type === 'text') {
          const nameValue = this.responses[firstQuestion.id] || '';
          const nameValidation = this.validateName(nameValue);
          if (!nameValidation.valid) {
            this.validationErrors[firstQuestion.id] = nameValidation.message;
            hasErrors = true;
          }
        }
      }

      // Validate all email fields by question type
      for (const question of this.questions) {
        if (question.question_type === 'email') {
          const emailValue = this.responses[question.id] || '';
          // Only validate if there's a value (required check happens separately)
          if (emailValue) {
            const emailValidation = this.validateEmail(emailValue);
            if (!emailValidation.valid) {
              this.validationErrors[question.id] = emailValidation.message;
              hasErrors = true;
            }
          } else if (question.is_required) {
            // If required and empty
            const message = this.lang.currentLanguage === 'he'
              ? 'שדה חובה'
              : 'This field is required';
            this.validationErrors[question.id] = message;
            hasErrors = true;
          }
        }
      }

      // Validate all phone fields by question type
      for (const question of this.questions) {
        if (question.question_type === 'phone') {
          const phoneValue = this.responses[question.id] || '';
          // Only validate if there's a value (required check happens separately)
          if (phoneValue) {
            const phoneValidation = this.validateIsraeliPhone(phoneValue);
            if (!phoneValidation.valid) {
              this.validationErrors[question.id] = phoneValidation.message;
              hasErrors = true;
            }
          } else if (question.is_required) {
            // If required and empty
            const message = this.lang.currentLanguage === 'he'
              ? 'שדה חובה'
              : 'This field is required';
            this.validationErrors[question.id] = message;
            hasErrors = true;
          }
        }
      }

      // Validate all URL fields by question type
      for (const question of this.questions) {
        if (question.question_type === 'url') {
          const urlValue = this.responses[question.id] || '';
          // Only validate if there's a value (required check happens separately)
          if (urlValue) {
            const urlValidation = this.validateUrl(urlValue);
            if (!urlValidation.valid) {
              this.validationErrors[question.id] = urlValidation.message;
              hasErrors = true;
            }
          } else if (question.is_required) {
            // If required and empty
            const message = this.lang.currentLanguage === 'he'
              ? 'שדה חובה'
              : 'This field is required';
            this.validationErrors[question.id] = message;
            hasErrors = true;
          }
        }
      }

      // Validate required fields for remaining questions
      for (const question of this.questions) {
        if (question.is_required) {
          // Skip email, phone, and url as they're already validated above
          if (question.question_type === 'email' || question.question_type === 'phone' || question.question_type === 'url') {
            continue;
          }

          if (question.question_type === 'multiple_choice' || question.question_type === 'checkbox' || question.question_type === 'multi') {
            const selected = Object.values(this.multiResponses[question.id] || {}).some(v => v);
            if (!selected) {
              const message = this.lang.currentLanguage === 'he'
                ? 'שדה חובה'
                : 'This field is required';
              this.validationErrors[question.id] = message;
              hasErrors = true;
            }
          } else if (!this.responses[question.id]) {
            const message = this.lang.currentLanguage === 'he'
              ? 'שדה חובה'
              : 'This field is required';
            this.validationErrors[question.id] = message;
            hasErrors = true;
          }
        }
      }

      // If there are validation errors, stop here
      if (hasErrors) {
        return;
      }

      // For owner/preview view, just mark as submitted without saving to database
      if (this.isOwner || this.isPreviewMode) {
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
            .map(([value, _]) => {
              // If this is "other" and there's custom text, include it
              const lowerValue = value.toLowerCase();
              if ((lowerValue === 'אחר' || lowerValue === 'other') && this.otherTextResponses[question.id]) {
                return `${value}: ${this.otherTextResponses[question.id]}`;
              }
              return value;
            });
          responseData[question.id] = selected;
        } else {
          // For single choice, check if "other" is selected and append custom text
          let response = this.responses[question.id];
          if (response && this.isOtherSelected(question.id) && this.otherTextResponses[question.id]) {
            response = `${response}: ${this.otherTextResponses[question.id]}`;
          }
          responseData[question.id] = response;
        }
      }

      // Save response to database for guest view using RPC function to bypass RLS
      const { data: responseId, error: responseError } = await this.supabaseService.client
        .rpc('submit_questionnaire_response', {
          p_questionnaire_id: this.questionnaire.id,
          p_response_data: responseData,
          p_submitted_at: new Date().toISOString()
        });

      if (responseError) throw responseError;

      // Create a minimal response object for compatibility
      const responseInsert = { id: responseId };

      // Extract lead data and save to leads table
      // Automation will be triggered automatically by the database trigger when the lead is created
      await this.saveLeadData(responseData, responseInsert?.id);

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

  // File upload handler
  async onFileSelected(event: Event, questionId: string) {
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

        this.uploadedFiles[questionId] = {
          file: file,
          name: file.name
        };
        this.responses[questionId] = `File: ${publicUrlData.publicUrl}`;

        // Clear validation error
        this.clearValidationError(questionId);

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

  triggerFileInput(questionId: string) {
    const fileInput = document.getElementById(`file-${questionId}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Audio recording methods
  async toggleAudioRecording(questionId: string) {
    if (this.isRecording[questionId]) {
      this.stopRecording(questionId);
    } else {
      await this.startRecording(questionId);
    }
  }

  async startRecording(questionId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorders[questionId] = new MediaRecorder(stream);
      this.audioChunks[questionId] = [];

      this.mediaRecorders[questionId].ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks[questionId].push(event.data);
        }
      };

      this.mediaRecorders[questionId].onstop = () => {
        const audioBlob = new Blob(this.audioChunks[questionId], { type: 'audio/webm' });
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const audioName = `audio_${timestamp}.webm`;

        this.audioFiles[questionId] = {
          blob: audioBlob,
          name: audioName
        };
        this.responses[questionId] = `Audio: ${audioName}`;

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorders[questionId].start();
      this.isRecording[questionId] = true;
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

  async stopRecording(questionId: string) {
    if (this.mediaRecorders[questionId] && this.isRecording[questionId]) {
      this.mediaRecorders[questionId].stop();
      this.isRecording[questionId] = false;

      // Wait a bit for the onstop event to fire and create the blob
      setTimeout(async () => {
        const audioData = this.audioFiles[questionId];
        if (audioData && audioData.blob) {
          try {
            // Upload audio to Supabase Storage
            const timestamp = new Date().getTime();
            const fileName = `audio_${timestamp}_${Math.random().toString(36).substring(7)}.webm`;
            const filePath = `uploads/${fileName}`;

            const { data, error } = await this.supabaseService.client.storage
              .from('questionnaire-files')
              .upload(filePath, audioData.blob, {
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
            this.responses[questionId] = `Audio: ${publicUrlData.publicUrl}`;

            // Clear validation error
            this.clearValidationError(questionId);

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

  getRecordingButtonText(questionId: string): string {
    if (this.isRecording[questionId]) {
      return this.lang.currentLanguage === 'he' ? 'עצור הקלטה' : 'Stop Recording';
    }
    if (this.audioFiles[questionId]) {
      return this.audioFiles[questionId].name;
    }
    return this.lang.t('questionnaireLive.clickToRecord');
  }

  getUploadButtonText(questionId: string): string {
    if (this.uploadedFiles[questionId]) {
      return this.uploadedFiles[questionId].name;
    }
    return this.lang.t('questionnaireLive.uploadFile');
  }

  cancel() {
    this.router.navigate(['/questionnaires']);
  }

  backToCreation() {
    // Clear preview data when navigating away
    if (this.isPreviewMode) {
      sessionStorage.removeItem('preview_questionnaire');
      window.close();
    } else {
      // Otherwise navigate back to questionnaires list
      this.router.navigate(['/questionnaires']);
    }
  }

  toggleViewMode(mode: 'form' | 'chat') {
    if (mode === 'chat') {
      // Navigate to chat view
      // For preview mode, switch to chat preview
      if (this.router.url.includes('/preview')) {
        this.router.navigate(['/questionnaires/chat/preview']);
      } else {
        const token = this.route.snapshot.paramMap.get('token');
        const id = this.route.snapshot.paramMap.get('id');
        const tokenOrId = token || id;
        if (tokenOrId) {
          // If it's a public route (token), navigate to q/:token/chat
          if (token) {
            this.router.navigate(['/q', tokenOrId, 'chat']);
          } else {
            this.router.navigate(['/questionnaires/chat', tokenOrId]);
          }
        }
      }
    } else {
      this.viewMode = mode;
    }
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
