import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router } from '@angular/router';
import { TemplateDemoDialogComponent } from './template-demo-dialog/template-demo-dialog.component';

interface TemplateDesign {
  logoUrl: string;
  profileImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  linkUrl: string;
  documentUrl: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  templateType: 'standard' | 'ai' | 'personal' | 'combined';
  responseType: 'new_customer' | 'reminder';
  channels: string[];
  emailSubject?: string;
  messageBody?: string;
  customAiMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-automations',
  standalone: true,
  imports: [CommonModule, FormsModule, TemplateDemoDialogComponent],
  templateUrl: './automations.component.html',
  styleUrls: ['./automations.component.sass']
})
export class AutomationsComponent implements OnInit {
  // Tab management
  activeTab: 'templates' | 'my-templates' | 'notifications' = 'templates';

  // Saved templates
  savedTemplates: SavedTemplate[] = [];
  editingTemplateId: string | null = null;

  // Basic template info
  templateName = '';
  templateType: 'standard' | 'ai' | 'personal' | 'combined' = 'standard';
  selectedChannels: string[] = [];
  singleChannel: 'email' | 'whatsapp' = 'email';

  // Message content
  emailSubject = '';
  messageBody = '';

  // Standard template specific
  responseType: 'new_customer' | 'reminder' = 'new_customer';
  reminderDays = 7;
  reminderTime = '09:00';
  leadStatus = '';
  leadSubStatus = '';
  reminderDelay = '';

  // AI template specific
  aiPosition: 'start' | 'middle' | 'end' = 'start';
  customAiMessage = '';

  // Template design
  templateDesign: TemplateDesign = {
    logoUrl: '',
    profileImageUrl: '',
    primaryColor: '#25B9B9',
    secondaryColor: '#2563EB',
    backgroundColor: '#F3F7FC',
    linkUrl: '',
    documentUrl: ''
  };

  // Files
  logoFile = '';
  profileFile = '';
  documentFile = '';

  // UI flags
  includeLogo = true;
  includeProfile = true;
  aiDecideForAI = true;
  aiDecideForCombined = true;
  aiDecideForTitle = true;

  // Demo modal
  showDemoModal = false;
  selectedChannelForDemo = '';

  // Notification timing
  notificationTiming = {
    frequency: 'daily',
    time: '09:00',
    enabled: true
  };

  // Mock data
  businessName = 'gil.arbisman';
  subCategory = 'יעוץ עסקי';
  logoUrl = 'img/logo.png';
  firstName = 'שם פרטי'; // Example first name for template preview

  // Default template messages with literal variable placeholders
  defaultMessageTitle = 'קיבלנו את השאלון שלך - {{businessName}}';
  defaultMessageContent = 'שלום {{firstName}},\nתודה שמילאת את השאלון שלנו. פנייתך התקבלה ואנו נחזור אליך בהקדם.';

  constructor(
    public lang: LanguageService,
    private toastService: ToastService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadSavedTemplates();
  }

  async loadUserProfile() {
    try {
      const userId = this.supabaseService.currentUser?.id;
      if (!userId) return;

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('company, email, image_url, logo_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.company) {
        this.businessName = data.company;
      } else if (data?.email) {
        this.businessName = data.email.split('@')[0];
      }

      // Set logo and profile image from user's profile
      if (data?.logo_url) {
        this.logoUrl = data.logo_url;
        this.templateDesign.logoUrl = data.logo_url;
      }

      if (data?.image_url) {
        this.profileFile = data.image_url;
        this.templateDesign.profileImageUrl = data.image_url;
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  }

  handleChannelToggle(channel: string) {
    if (this.selectedChannels.includes(channel)) {
      this.selectedChannels = this.selectedChannels.filter(c => c !== channel);
    } else {
      this.selectedChannels.push(channel);
    }
  }

  handleShowDemo(channel: string) {
    // Show demo modal without toggling selection
    this.selectedChannelForDemo = channel;
    this.showDemoModal = true;
  }

  closeDemoModal() {
    this.showDemoModal = false;
    this.selectedChannelForDemo = '';
  }

  async handleSaveTemplate() {
    if (!this.templateName.trim()) {
      this.toastService.error(this.lang.t('automations.errorEnterTemplateName'));
      return;
    }

    if (this.responseType === 'reminder' && !this.leadStatus) {
      this.toastService.error(this.lang.t('automations.errorSelectLeadStatus'));
      return;
    }

    if (this.templateType !== 'standard' && !this.emailSubject.trim()) {
      this.toastService.error(this.lang.t('automations.errorEnterEmailSubject'));
      return;
    }

    if (this.templateType !== 'standard' && !this.messageBody.trim()) {
      this.toastService.error(this.lang.t('automations.errorEnterMessageBody'));
      return;
    }

    if (this.templateType === 'ai' && this.selectedChannels.length === 0) {
      this.toastService.error(this.lang.t('automations.errorSelectChannel'));
      return;
    }

    try {
      const userId = this.supabaseService.currentUser?.id;
      if (!userId) {
        this.toastService.error(this.lang.t('automations.errorPleaseLogin'));
        return;
      }

      const templateData = {
        name: this.templateName,
        template_type: this.templateType,
        response_type: this.responseType,
        channels: this.selectedChannels,
        email_subject: this.emailSubject || null,
        message_body: this.messageBody || null,
        custom_ai_message: this.customAiMessage || null,
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      if (this.editingTemplateId) {
        // Update existing template
        const { error } = await this.supabaseService.client
          .from('automation_templates')
          .update(templateData)
          .eq('id', this.editingTemplateId);

        if (error) throw error;

        this.toastService.success(this.lang.t('automations.templateUpdatedSuccessfully'));
      } else {
        // Create new template
        const { error } = await this.supabaseService.client
          .from('automation_templates')
          .insert([{
            ...templateData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        this.toastService.success(this.lang.t('automations.templateSavedSuccessfully'));
      }

      // Reload templates and reset form
      await this.loadSavedTemplates();
      this.resetTemplateForm();
      this.activeTab = 'my-templates';
    } catch (e: any) {
      console.error('Error saving template:', e);
      this.toastService.error(e.message || this.lang.t('automations.errorSavingTemplate'));
    }
  }

  createExampleTemplate() {
    this.templateName = 'תבנית דוגמה';
    this.emailSubject = `תודה על מילוי השאלון - {{businessName}}`;
    this.messageBody = `שלום {{firstName}},\n\nתודה שמילאת את השאלון שלנו.\nפנייתך התקבלה ואנו נחזור אליך בהקדם.\n\nבברכה,\n{{businessName}}`;
    this.customAiMessage = 'הודעה מותאמת אישית שתופיע לפני תגובת ה-AI';
    this.templateDesign.linkUrl = 'https://example.com';
    this.templateDesign.primaryColor = '#10B981';
    this.templateDesign.secondaryColor = '#F59E0B';

    this.toastService.success(this.lang.t('automations.exampleTemplateCreated'));
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getChannelName(channel: string): string {
    const keyMap: { [key: string]: string } = {
      general: 'automations.general',
      message: 'automations.message',
      whatsapp: 'automations.whatsapp',
      email: 'automations.email'
    };
    return this.lang.t(keyMap[channel] || 'automations.general');
  }

  getTemplateTypeName(): string {
    const keyMap: { [key: string]: string } = {
      standard: 'automations.standardTemplate',
      ai: 'templates.typeAI',
      personal: 'automations.personalFeedback',
      combined: 'automations.combinedAiPersonal'
    };
    return this.lang.t(keyMap[this.templateType] || 'automations.standardTemplate');
  }

  async saveNotificationSettings() {
    this.toastService.success(
      this.lang.t('automations.notificationsSaved', {
        frequency: this.notificationTiming.frequency,
        time: this.notificationTiming.time
      })
    );
  }

  async loadSavedTemplates() {
    try {
      const userId = this.supabaseService.currentUser?.id;
      if (!userId) return;

      const { data, error } = await this.supabaseService.client
        .from('automation_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database format to SavedTemplate interface
      this.savedTemplates = (data || []).map(template => ({
        id: template.id,
        name: template.name,
        templateType: template.template_type,
        responseType: template.response_type,
        channels: template.channels || [],
        emailSubject: template.email_subject,
        messageBody: template.message_body,
        customAiMessage: template.custom_ai_message,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }));
    } catch (e: any) {
      console.error('Error loading templates:', e);
      this.toastService.error(this.lang.t('automations.errorLoadingTemplates'));
    }
  }

  resetTemplateForm() {
    this.editingTemplateId = null;
    this.templateName = '';
    this.templateType = 'standard';
    this.selectedChannels = [];
    this.emailSubject = '';
    this.messageBody = '';
    this.customAiMessage = '';
    this.responseType = 'new_customer';
    this.leadStatus = '';
    this.leadSubStatus = '';
    this.reminderDelay = '';
  }

  editTemplate(template: SavedTemplate) {
    // Load template data into the form
    this.editingTemplateId = template.id;
    this.templateName = template.name;
    this.templateType = template.templateType;
    this.responseType = template.responseType;
    this.selectedChannels = [...template.channels];
    this.emailSubject = template.emailSubject || '';
    this.messageBody = template.messageBody || '';
    this.customAiMessage = template.customAiMessage || '';

    // Switch to templates tab
    this.activeTab = 'templates';

    this.toastService.info(this.lang.t('automations.templateLoadedForEditing'));
  }

  async deleteTemplate(templateId: string) {
    const confirmMessage = this.lang.currentLanguage === 'he'
      ? 'האם אתה בטוח שברצונך למחוק תבנית זו?'
      : 'Are you sure you want to delete this template?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('automation_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await this.loadSavedTemplates();

      this.toastService.success(this.lang.t('automations.templateDeleted'));
    } catch (e: any) {
      console.error('Error deleting template:', e);
      this.toastService.error(this.lang.t('automations.errorDeletingTemplate'));
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(this.lang.currentLanguage === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTemplateTypeLabel(type: string): string {
    const keyMap: { [key: string]: string } = {
      standard: 'automations.standard',
      ai: 'AI',
      personal: 'automations.personal',
      combined: 'automations.combined'
    };
    return this.lang.t(keyMap[type] || 'automations.standard');
  }
}
