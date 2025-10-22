import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

interface Questionnaire {
  id: string;
  title: string;
  token?: string | null;
}

interface Distribution {
  id: string;
  questionnaire_id: string;
  automation_template_ids: Array<{
    template_id: string;
    channels: Array<'email' | 'whatsapp' | 'sms'>;
  }>;
  token: string | null;
  is_active: boolean;
  social_network?: string | null;
  link_text?: string | null;
  link_label?: string | null;
}

interface SelectedTemplate {
  id: string;
  name: string;
  channels: Array<'email' | 'whatsapp' | 'sms'>;
}

interface AutomationTemplate {
  id: string;
  name: string;
  message_type: string;
  created_at: string;
}

type LinkMode = 'form' | 'chat' | 'qr' | null;
type SocialNetwork = 'facebook' | 'instagram' | 'linkedin' | 'general' | null;

@Component({
  selector: 'app-distribution-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './distribution-hub.component.html',
  styleUrls: ['./distribution-hub.component.sass']
})
export class DistributionHubComponent implements OnInit {
  @ViewChild('previewSection') previewSection?: ElementRef;

  selectedQuestionnaire = '';
  questionnaires: Questionnaire[] = [];
  loading = false;
  currentMode: LinkMode = null;
  currentUrl = '';
  currentDistribution: Distribution | null = null;

  // Social network and link text
  selectedSocialNetwork: SocialNetwork = null;
  linkText = '';
  linkLabel = '';
  distributionSaved = false;

  // Template management
  selectedTemplates: SelectedTemplate[] = [];
  availableTemplates: AutomationTemplate[] = [];
  newTemplateId = '';

  constructor(
    public lang: LanguageService,
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await Promise.all([
      this.loadQuestionnaires(),
      this.loadAutomationTemplates()
    ]);

    // Check for questionnaireId from query params
    this.route.queryParams.subscribe(params => {
      if (params['questionnaireId']) {
        this.selectedQuestionnaire = params['questionnaireId'];
      }
    });
  }

  async loadQuestionnaires() {
    try {
      this.loading = true;
      const userId = this.supabaseService.currentUser?.id;
      if (!userId) return;

      const { data, error } = await this.supabaseService.client
        .from('questionnaires')
        .select('id, title, token, is_active')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.questionnaires = (data || []).map(q => ({
        id: q.id,
        title: q.title || this.lang.t('questionnaires.untitled'),
        token: q.token
      }));
    } catch (e: any) {
      console.error('Error loading questionnaires:', e);
    } finally {
      this.loading = false;
    }
  }

  async loadAutomationTemplates() {
    try {
      const userId = this.supabaseService.currentUser?.id;
      if (!userId) return;

      const { data, error } = await this.supabaseService.client
        .from('automation_templates')
        .select('id, name, message_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.availableTemplates = data || [];
    } catch (e: any) {
      console.error('Error loading automation templates:', e);
      this.toast.show(this.lang.t('errors.loadTemplates'), 'error');
    }
  }

  goBack() {
    window.history.back();
  }

  onQuestionnaireChange() {
    // Hide the generated link when questionnaire selection changes
    this.currentMode = null;
    this.currentUrl = '';
    this.currentDistribution = null;
    this.selectedTemplates = [];
    this.selectedSocialNetwork = null;
    this.linkText = '';
    this.linkLabel = '';
    this.distributionSaved = false;

    // Load existing distribution if available
    this.loadExistingDistribution();
  }

  onTemplatesChange() {
    // Hide the generated link when templates change
    this.currentMode = null;
    this.currentUrl = '';
    // Force new distribution on next link click
    this.currentDistribution = null;
  }

  async loadExistingDistribution() {
    if (!this.selectedQuestionnaire) return;

    try {
      const { data: existingDistributions, error } = await this.supabaseService.client
        .from('distributions')
        .select('*')
        .eq('questionnaire_id', this.selectedQuestionnaire)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;

      if (existingDistributions && existingDistributions.length > 0) {
        this.currentDistribution = existingDistributions[0] as Distribution;
        // TODO: Load selected templates from distribution if needed
      }
    } catch (error) {
      console.error('Error loading existing distribution:', error);
    }
  }

  // Template management methods
  addTemplate() {
    if (!this.newTemplateId) return;

    if (this.selectedTemplates.length >= 3) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'ניתן לבחור עד 3 תבניות בלבד' : 'Can select up to 3 templates only',
        'error'
      );
      return;
    }

    // Check if the last template has at least one channel selected
    if (this.selectedTemplates.length > 0) {
      const lastTemplate = this.selectedTemplates[this.selectedTemplates.length - 1];
      if (lastTemplate.channels.length === 0) {
        this.toast.show(
          this.lang.currentLanguage === 'he'
            ? 'יש לבחור לפחות ערוץ אחד לתבנית הקודמת לפני הוספת תבנית נוספת'
            : 'Please select at least one channel for the previous template before adding another',
          'error'
        );
        return;
      }
    }

    const template = this.availableTemplates.find(t => t.id === this.newTemplateId);
    if (template) {
      this.selectedTemplates.push({
        id: template.id,
        name: template.name,
        channels: []
      });
      this.newTemplateId = '';
      this.onTemplatesChange();
    }
  }

  removeTemplate(index: number) {
    this.selectedTemplates.splice(index, 1);
    this.onTemplatesChange();
  }

  toggleChannelForTemplate(templateIndex: number, channel: 'email' | 'whatsapp' | 'sms') {
    const template = this.selectedTemplates[templateIndex];
    const channelIndex = template.channels.indexOf(channel);

    if (channelIndex > -1) {
      // Remove channel
      template.channels.splice(channelIndex, 1);
    } else {
      // Add channel
      template.channels.push(channel);
    }
    this.onTemplatesChange();
  }

  isChannelUsedByOtherTemplates(currentTemplateIndex: number, channel: 'email' | 'whatsapp' | 'sms'): boolean {
    return this.selectedTemplates.some((t, idx) =>
      idx !== currentTemplateIndex && t.channels.includes(channel)
    );
  }

  getUsedChannels(): Array<'email' | 'whatsapp' | 'sms'> {
    return this.selectedTemplates.flatMap(t => t.channels);
  }

  getAvailableChannels(templateIndex: number): Array<'email' | 'whatsapp' | 'sms'> {
    const allChannels: Array<'email' | 'whatsapp' | 'sms'> = ['email', 'whatsapp', 'sms'];
    return allChannels.filter(channel =>
      !this.isChannelUsedByOtherTemplates(templateIndex, channel)
    );
  }

  isTemplateAlreadySelected(templateId: string): boolean {
    return this.selectedTemplates.some(t => t.id === templateId);
  }

  async handleSaveDistribution() {
    // Validate all templates have at least one channel
    const hasInvalidTemplate = this.selectedTemplates.some(t => t.channels.length === 0);
    if (hasInvalidTemplate) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'כל תבנית חייבת להכיל לפחות ערוץ אחד'
          : 'Each template must have at least one channel',
        'error'
      );
      return;
    }

    try {
      this.loading = true;

      // Build automation_template_ids array with channel mapping
      const automationTemplateIds = this.selectedTemplates.map(t => ({
        template_id: t.id,
        channels: t.channels
      }));

      // Always update existing distribution (created on first link click)
      if (this.currentDistribution) {
        const { data, error } = await this.supabaseService.client
          .from('distributions')
          .update({
            automation_template_ids: automationTemplateIds,
            is_active: true,
            social_network: this.selectedSocialNetwork,
            link_text: this.linkText || null,
            link_label: this.linkLabel || null
          })
          .eq('id', this.currentDistribution.id)
          .select('*')
          .single();

        if (error) throw error;
        this.currentDistribution = data as Distribution;

        this.toast.show(
          this.lang.currentLanguage === 'he'
            ? 'ההפצה נשמרה בהצלחה'
            : 'Distribution saved successfully',
          'success'
        );
      }
    } catch (error) {
      console.error('Error saving distribution:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'שגיאה בשמירת ההפצה'
          : 'Error saving distribution',
        'error'
      );
    } finally {
      this.loading = false;
    }
  }

  handleSocialNetworkSelect(network: SocialNetwork) {
    this.selectedSocialNetwork = network;
    this.currentMode = null;
    this.currentUrl = '';

    // If general, mark as saved immediately so link buttons appear
    if (network === 'general') {
      this.distributionSaved = true;
    }
  }

  async saveLinkDetails() {
    if (!this.selectedQuestionnaire || !this.selectedSocialNetwork) return;

    try {
      this.loading = true;

      // Build automation_template_ids array with channel mapping
      const automationTemplateIds = this.selectedTemplates.map(t => ({
        template_id: t.id,
        channels: t.channels
      }));

      // Generate a unique token manually
      const tokenBytes = new Uint8Array(16);
      crypto.getRandomValues(tokenBytes);
      const token = 'd_' + Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      // Create new distribution
      const { data, error } = await this.supabaseService.client
        .from('distributions')
        .insert([{
          questionnaire_id: this.selectedQuestionnaire,
          automation_template_ids: automationTemplateIds,
          token: token,
          is_active: true,
          social_network: this.selectedSocialNetwork,
          link_text: this.linkText || null,
          link_label: this.linkLabel || null
        }])
        .select('*')
        .single();

      if (error) throw error;
      this.currentDistribution = data as Distribution;
      this.distributionSaved = true;

      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'פרטי הקישור נשמרו בהצלחה'
          : 'Link details saved successfully',
        'success'
      );
    } catch (error) {
      console.error('Error saving link details:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'שגיאה בשמירת פרטי הקישור'
          : 'Error saving link details',
        'error'
      );
    } finally {
      this.loading = false;
    }
  }

  async handleBuildLink(type: 'form' | 'chat' | 'qr') {
    if (!this.selectedQuestionnaire || !this.selectedSocialNetwork) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'יש לבחור שאלון ומקור הפצה תחילה'
          : 'Please select a questionnaire and distribution source first',
        'error'
      );
      return;
    }

    // If distribution doesn't exist (for general), create it now
    if (!this.currentDistribution || !this.currentDistribution.token) {
      try {
        // Build automation_template_ids array with channel mapping
        const automationTemplateIds = this.selectedTemplates.map(t => ({
          template_id: t.id,
          channels: t.channels
        }));

        // Generate a unique token manually
        const tokenBytes = new Uint8Array(16);
        crypto.getRandomValues(tokenBytes);
        const token = 'd_' + Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

        // Create new distribution
        const { data, error } = await this.supabaseService.client
          .from('distributions')
          .insert([{
            questionnaire_id: this.selectedQuestionnaire,
            automation_template_ids: automationTemplateIds,
            token: token,
            is_active: true,
            social_network: this.selectedSocialNetwork,
            link_text: this.linkText || null,
            link_label: this.linkLabel || null
          }])
          .select('*')
          .single();

        if (error) throw error;
        this.currentDistribution = data as Distribution;
      } catch (error) {
        console.error('Error creating distribution:', error);
        this.toast.show(
          this.lang.currentLanguage === 'he'
            ? 'שגיאה ביצירת ההפצה'
            : 'Error creating distribution',
          'error'
        );
        return;
      }
    }

    const base = window.location.origin;
    let url = '';

    // Determine src parameter based on social network
    const srcParam = this.selectedSocialNetwork;

    if (type === 'form') {
      url = `${base}/q/${this.currentDistribution.token}?src=${srcParam}`;
    } else if (type === 'chat') {
      url = `${base}/q/${this.currentDistribution.token}/chat?src=${srcParam}`;
    } else if (type === 'qr') {
      url = `${base}/q/${this.currentDistribution.token}/qr?src=${srcParam}`;
    }

    this.currentMode = type;
    this.currentUrl = url;

    // Scroll to the preview section after the DOM updates
    setTimeout(() => {
      this.scrollToPreview();
    }, 300);
  }

  getEmbedCode(): string {
    if (!this.currentUrl) return '';

    const buttonText = this.linkText || 'לחץ כאן';
    return `<a href="${this.currentUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">${buttonText}</a>`;
  }

  async handleCopyEmbed() {
    const embedCode = this.getEmbedCode();
    if (!embedCode) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(embedCode);
        this.toast.show(
          this.lang.currentLanguage === 'he' ? 'קוד ההטמעה הועתק ללוח' : 'Embed code copied to clipboard',
          'success'
        );
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = embedCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          this.toast.show(
            this.lang.currentLanguage === 'he' ? 'קוד ההטמעה הועתק ללוח' : 'Embed code copied to clipboard',
            'success'
          );
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בהעתקת קוד ההטמעה' : 'Failed to copy embed code',
        'error'
      );
    }
  }

  private scrollToPreview() {
    if (this.previewSection) {
      this.previewSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  async handleCopyUrl() {
    if (!this.currentUrl) return;

    try {
      // Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(this.currentUrl);
        this.toast.show(
          this.lang.currentLanguage === 'he' ? 'הקישור הועתק ללוח' : 'Link copied to clipboard',
          'success'
        );
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = this.currentUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          this.toast.show(
            this.lang.currentLanguage === 'he' ? 'הקישור הועתק ללוח' : 'Link copied to clipboard',
            'success'
          );
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בהעתקת הקישור' : 'Failed to copy link',
        'error'
      );
    }
  }

  navigateToAutomations() {
    this.router.navigate(['/automations'], { queryParams: { tab: 'templates' } });
  }

  getChannelNameInHebrew(channel: 'email' | 'whatsapp' | 'sms'): string {
    switch (channel) {
      case 'email': return 'מייל';
      case 'whatsapp': return 'וואטסאפ';
      case 'sms': return 'SMS';
    }
  }

  getFormattedChannels(template: SelectedTemplate): string {
    return template.channels.map(ch => this.getChannelNameInHebrew(ch)).join(', ');
  }
}
