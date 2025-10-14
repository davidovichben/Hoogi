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

  // File upload
  uploadedFiles: Record<string, { file: File; name: string }> = {};

  // Audio recording
  isRecording: Record<string, boolean> = {};
  audioFiles: Record<string, { blob: Blob; name: string }> = {};
  private mediaRecorders: Record<string, MediaRecorder> = {};
  private audioChunks: Record<string, Blob[]> = {};

  // Referral tracking
  private detectedChannel: string = 'direct';

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
    // Detect referral source/channel
    this.detectedChannel = this.referralTracking.detectChannel();
    console.log('Detected channel:', this.detectedChannel);

    const id = this.route.snapshot.paramMap.get('id');

    // Determine view mode based on route path
    const currentPath = this.router.url;

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
      const { data: insertedLead, error: leadError } = await this.supabaseService.client
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (leadError) {
        console.error('Error saving lead data:', leadError);
        // Don't throw error - lead saving is optional, response is already saved
        return;
      }

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
      // Call the on-new-lead Edge Function to trigger automation
      const { error } = await this.supabaseService.client.functions.invoke('on-new-lead', {
        body: {
          type: 'INSERT',
          table: 'leads',
          record: lead
        }
      });

      if (error) {
        console.error('Error triggering automation:', error);
        // Don't throw - automation failure shouldn't affect the submission
      }
    } catch (error) {
      console.error('Error in triggerAutomation:', error);
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

  getRatingRange(question: Question): number[] {
    const min = (question as any).min_rating || question.minimum || question.meta?.minimum || 1;
    const max = (question as any).max_rating || question.maximum || question.meta?.maximum || 5;
    const range: number[] = [];
    for (let i = min; i <= max; i++) {
      range.push(i);
    }
    return range;
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

    // Standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        valid: false,
        message: this.lang.currentLanguage === 'he'
          ? 'נא להזין כתובת אימייל תקינה'
          : 'Please enter a valid email address'
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

    // Israeli phone number validation:
    // - Must be 9-10 digits
    // - Mobile: starts with 05 (10 digits) or 5 (9 digits)
    // - Landline: starts with 0 followed by 2-9 (9-10 digits)
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

  async submitResponse(event: Event) {
    event.preventDefault();

    if (!this.questionnaire) return;

    try {
      // Validate first three questions with specific validation rules
      if (this.questions.length >= 1) {
        // Question 1: Name validation
        const nameQuestion = this.questions[0];
        const nameValue = this.responses[nameQuestion.id] || '';
        const nameValidation = this.validateName(nameValue);
        if (!nameValidation.valid) {
          this.toastService.show(nameValidation.message, 'error');
          return;
        }
      }

      if (this.questions.length >= 2) {
        // Question 2: Email validation
        const emailQuestion = this.questions[1];
        const emailValue = this.responses[emailQuestion.id] || '';
        const emailValidation = this.validateEmail(emailValue);
        if (!emailValidation.valid) {
          this.toastService.show(emailValidation.message, 'error');
          return;
        }
      }

      if (this.questions.length >= 3) {
        // Question 3: Phone validation
        const phoneQuestion = this.questions[2];
        const phoneValue = this.responses[phoneQuestion.id] || '';
        const phoneValidation = this.validateIsraeliPhone(phoneValue);
        if (!phoneValidation.valid) {
          this.toastService.show(phoneValidation.message, 'error');
          return;
        }
      }

      // Validate all email fields (beyond the first 3 questions)
      for (let i = 3; i < this.questions.length; i++) {
        const question = this.questions[i];
        if (question.question_type === 'email') {
          const emailValue = this.responses[question.id] || '';
          // Only validate if there's a value (required check happens separately)
          if (emailValue) {
            const emailValidation = this.validateEmail(emailValue);
            if (!emailValidation.valid) {
              this.toastService.show(emailValidation.message, 'error');
              return;
            }
          } else if (question.is_required) {
            // If required and empty
            const message = this.lang.currentLanguage === 'he'
              ? `נא לענות: ${question.question_text}`
              : `Please answer: ${question.question_text}`;
            this.toastService.show(message, 'error');
            return;
          }
        }
      }

      // Validate all phone fields (beyond the first 3 questions)
      for (let i = 3; i < this.questions.length; i++) {
        const question = this.questions[i];
        if (question.question_type === 'phone') {
          const phoneValue = this.responses[question.id] || '';
          // Only validate if there's a value (required check happens separately)
          if (phoneValue) {
            const phoneValidation = this.validateIsraeliPhone(phoneValue);
            if (!phoneValidation.valid) {
              this.toastService.show(phoneValidation.message, 'error');
              return;
            }
          } else if (question.is_required) {
            // If required and empty
            const message = this.lang.currentLanguage === 'he'
              ? `נא לענות: ${question.question_text}`
              : `Please answer: ${question.question_text}`;
            this.toastService.show(message, 'error');
            return;
          }
        }
      }

      // Validate required fields for remaining questions
      for (const question of this.questions) {
        if (question.is_required) {
          // Skip email and phone as they're already validated above
          if (question.question_type === 'email' || question.question_type === 'phone') {
            continue;
          }

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

      // Save response to database for guest view
      const { data: responseInsert, error: responseError } = await this.supabaseService.client
        .from('responses')
        .insert({
          questionnaire_id: this.questionnaire.id,
          response_data: responseData,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (responseError) throw responseError;

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
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.router.navigate(['/questionnaires/chat', id]);
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
}
