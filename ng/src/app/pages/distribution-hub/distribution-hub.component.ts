import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

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

interface SavedLink {
  id: string;
  url: string;
  linkText: string;
  type: 'form' | 'chat' | 'qr';
  createdAt: string;
  surveyId: string;
}

type LinkMode = 'form' | 'chat' | 'qr' | null;

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
  selectedSocialNetwork: 'whatsapp' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'telegram' | 'email' | 'sms' | 'website' | null = null;
  showLinksSection = false;

  // Social networks configuration - now using getters for translations
  get socialNetworks() {
    return [
      {
        id: 'whatsapp' as const,
        name: this.lang.t('distribution.network.whatsapp'),
        icon: '💬',
        colorClass: 'whatsapp-card',
        priority: 1,
        description: this.lang.t('distribution.desc.whatsapp'),
        clickRate: '45-60%'
      },
      {
        id: 'facebook' as const,
        name: this.lang.t('distribution.network.facebook'),
        icon: '📘',
        colorClass: 'facebook-card',
        priority: 2,
        description: this.lang.t('distribution.desc.facebook'),
        clickRate: '25-35%'
      },
      {
        id: 'instagram' as const,
        name: this.lang.t('distribution.network.instagram'),
        icon: '📷',
        colorClass: 'instagram-card',
        priority: 3,
        description: this.lang.t('distribution.desc.instagram'),
        clickRate: '15-25%'
      },
      {
        id: 'linkedin' as const,
        name: this.lang.t('distribution.network.linkedin'),
        icon: '💼',
        colorClass: 'linkedin-card',
        priority: 4,
        description: this.lang.t('distribution.desc.linkedin'),
        clickRate: '10-18%'
      },
      {
        id: 'youtube' as const,
        name: this.lang.t('distribution.network.youtube'),
        icon: '🎥',
        colorClass: 'youtube-card',
        priority: 5,
        description: this.lang.t('distribution.desc.youtube'),
        clickRate: '8-12%'
      },
      {
        id: 'telegram' as const,
        name: this.lang.t('distribution.network.telegram'),
        icon: '✈️',
        colorClass: 'telegram-card',
        priority: 6,
        description: this.lang.t('distribution.desc.telegram'),
        clickRate: '8-12%'
      },
      {
        id: 'email' as const,
        name: this.lang.t('distribution.network.email'),
        icon: '✉️',
        colorClass: 'email-card',
        priority: 7,
        description: this.lang.t('distribution.desc.email'),
        clickRate: '8-12%'
      },
      {
        id: 'sms' as const,
        name: this.lang.t('distribution.network.sms'),
        icon: '📱',
        colorClass: 'sms-card',
        priority: 8,
        description: this.lang.t('distribution.desc.sms'),
        clickRate: '8-12%'
      },
      {
        id: 'website' as const,
        name: this.lang.t('distribution.network.website'),
        icon: '🌐',
        colorClass: 'website-card',
        priority: 9,
        description: this.lang.t('distribution.desc.website'),
        clickRate: '5-10%'
      }
    ];
  }

  // Main networks (first 5)
  get mainNetworks() {
    return this.socialNetworks.slice(0, 5);
  }

  // Additional networks (remaining)
  get additionalNetworks() {
    return this.socialNetworks.slice(5);
  }

  // Saved links
  savedLinks: SavedLink[] = [];

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

    // Load saved links from localStorage
    this.loadSavedLinks();

    // Check for questionnaireId from query params
    this.route.queryParams.subscribe(params => {
      if (params['questionnaireId']) {
        this.selectedQuestionnaire = params['questionnaireId'];
      }
    });
  }

  loadSavedLinks() {
    try {
      const savedLinksData = localStorage.getItem('hoogi-saved-links');
      this.savedLinks = savedLinksData ? JSON.parse(savedLinksData) : [];
    } catch (error) {
      console.error('Error loading saved links:', error);
      this.savedLinks = [];
    }
  }

  saveSavedLinks() {
    try {
      localStorage.setItem('hoogi-saved-links', JSON.stringify(this.savedLinks));
    } catch (error) {
      console.error('Error saving links:', error);
    }
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

  async onQuestionnaireChange() {
    // Hide the generated link when questionnaire selection changes
    this.currentMode = null;
    this.currentUrl = '';
    this.currentDistribution = null;
    this.selectedTemplates = [];
    this.selectedSocialNetwork = null;
    this.showLinksSection = false;

    // Load existing distribution if available
    await this.loadExistingDistribution();
  }

  async onTemplatesChange() {
    // Hide the links section when templates change
    this.currentMode = null;
    this.currentUrl = '';
    this.selectedSocialNetwork = null;
    this.showLinksSection = false;
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

        // Don't auto-load templates - let user select them manually
        // This ensures a clean slate when changing questionnaires
      }
    } catch (error) {
      console.error('Error loading existing distribution:', error);
    }
  }

  async handleShowLinks() {
    if (!this.selectedQuestionnaire) {
      this.toast.show(
        this.lang.t('distribution.chooseQuestionnaireFirst'),
        'error'
      );
      return;
    }

    // Validate that all selected templates have at least one channel (if any templates are selected)
    if (this.selectedTemplates.length > 0) {
      const templatesWithoutChannels = this.selectedTemplates.filter(t => t.channels.length === 0);
      if (templatesWithoutChannels.length > 0) {
        this.toast.show(
          this.lang.t('distribution.templatesMissingChannels'),
          'error'
        );
        return;
      }
    }

    // Save the distribution first (creates/updates distribution even without templates)
    const success = await this.saveDistribution();

    // Only show the links section if distribution was saved successfully
    if (success) {
      this.showLinksSection = true;
    } else {
      console.error('Failed to save distribution - not showing links section');
    }
  }

  // Generate a unique distribution token
  private generateDistributionToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = 'd_'; // Distribution prefix
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  async saveDistribution(): Promise<boolean> {
    if (!this.selectedQuestionnaire) return false;

    const questionnaire = this.questionnaires.find(q => q.id === this.selectedQuestionnaire);
    if (!questionnaire) return false;

    // Prepare automation template data - only include templates with at least one channel
    const automationTemplateIds = this.selectedTemplates
      .filter(template => template.channels.length > 0)
      .map(template => ({
        template_id: template.id,
        channels: template.channels
      }));

    // Generate or reuse distribution token
    const distributionToken = this.currentDistribution?.token || this.generateDistributionToken();

    const distributionData = {
      questionnaire_id: this.selectedQuestionnaire,
      automation_template_ids: automationTemplateIds, // Can be empty array if no templates
      token: distributionToken,
      is_active: true
    };

    try {
      if (this.currentDistribution) {
        // Update existing distribution
        const { data, error } = await this.supabaseService.client
          .from('distributions')
          .update(distributionData)
          .eq('id', this.currentDistribution.id)
          .select()
          .single();

        if (error) throw error;

        this.currentDistribution = data as Distribution;
        console.log('Distribution updated:', data);
      } else {
        // Create new distribution
        const { data, error } = await this.supabaseService.client
          .from('distributions')
          .insert(distributionData)
          .select()
          .single();

        if (error) throw error;

        this.currentDistribution = data as Distribution;
        console.log('Distribution created:', data);
      }
      return true; // Success
    } catch (error: any) {
      console.error('Error saving distribution:', error);
      this.toast.show(
        this.lang.t('distribution.savingError') + ': ' + (error.message || 'Unknown error'),
        'error'
      );
      return false; // Failure
    }
  }

  // Template management methods
  async addTemplate() {
    if (!this.newTemplateId) return;

    if (this.selectedTemplates.length >= 3) {
      this.toast.show(
        this.lang.t('distribution.maxTemplatesReached'),
        'error'
      );
      return;
    }

    // Check if the last template has at least one channel selected
    if (this.selectedTemplates.length > 0) {
      const lastTemplate = this.selectedTemplates[this.selectedTemplates.length - 1];
      if (lastTemplate.channels.length === 0) {
        this.toast.show(
          this.lang.t('distribution.selectChannelForPrevious'),
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
      await this.onTemplatesChange();
    }
  }

  async removeTemplate(index: number) {
    this.selectedTemplates.splice(index, 1);
    await this.onTemplatesChange();
  }

  async toggleChannelForTemplate(templateIndex: number, channel: 'email' | 'whatsapp' | 'sms') {
    const template = this.selectedTemplates[templateIndex];
    const channelIndex = template.channels.indexOf(channel);

    if (channelIndex > -1) {
      // Remove channel
      template.channels.splice(channelIndex, 1);
    } else {
      // Add channel
      template.channels.push(channel);
    }
    await this.onTemplatesChange();
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

  // Social network selection and sharing
  async selectSocialNetwork(network: 'whatsapp' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'telegram' | 'email' | 'sms' | 'website') {
    // Generate form link if not already generated
    const wasGenerated = !this.currentUrl;
    if (wasGenerated) {
      await this.handleBuildLink('form');
    }

    // If still no URL (error occurred), return
    if (!this.currentUrl) {
      return;
    }

    this.selectedSocialNetwork = network;

    // Get network name
    const networkData = this.socialNetworks.find(n => n.id === network);
    const networkName = networkData?.name || network;

    // Create URL with tracking parameter
    let urlWithTracking: string;
    try {
      const url = new URL(this.currentUrl, environment.siteUrl);
      url.searchParams.set('src', network);
      urlWithTracking = url.toString();
    } catch (error) {
      console.error('Error creating URL:', error);
      // Fallback: append parameter manually
      urlWithTracking = this.currentUrl + (this.currentUrl.includes('?') ? '&' : '?') + `src=${network}`;
    }

    // Copy URL to clipboard first for all networks
    const copySuccess = await this.copyToClipboard(urlWithTracking);

    // Show notification based on copy success
    if (copySuccess) {
      this.toast.show(
        `${networkName} - ${this.lang.t('distribution.linkCopiedToClipboard')}`,
        'success'
      );
    } else {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'שגיאה בהעתקת הקישור'
          : 'Failed to copy link',
        'error'
      );
      return; // Don't proceed if copy failed
    }

    // Get the share endpoint for the social network
    let shareUrl = '';
    const shareTitle = this.lang.currentLanguage === 'he' ? 'מלא את השאלון שלנו' : 'Fill out our questionnaire';

    switch (network) {
      case 'whatsapp':
        // WhatsApp Web/App share with pre-filled text and URL
        const whatsappMessage = this.lang.currentLanguage === 'he'
          ? `מלא את השאלון שלנו: ${urlWithTracking}`
          : `Fill out our questionnaire: ${urlWithTracking}`;
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
        break;
      case 'facebook':
        // Open Facebook share dialog
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlWithTracking)}`;
        break;
      case 'instagram':
        // Instagram doesn't have a web share API, so we only copy the link
        return;
      case 'linkedin':
        // LinkedIn share with URL (LinkedIn will auto-fetch title and description)
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlWithTracking)}`;
        break;
      case 'youtube':
        // YouTube doesn't have a share endpoint for links
        return;
      case 'telegram':
        // Telegram share with URL and text
        const telegramText = this.lang.currentLanguage === 'he' ? 'מלא את השאלון שלנו' : 'Fill out our questionnaire';
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(urlWithTracking)}&text=${encodeURIComponent(telegramText)}`;
        break;
      case 'email':
        // Email with subject and body containing the URL
        const emailSubject = this.lang.currentLanguage === 'he' ? 'מלא את השאלון שלנו' : 'Fill out our questionnaire';
        const emailMessage = this.lang.currentLanguage === 'he'
          ? `היי,\n\nאשמח אם תוכל למלא את השאלון שלנו:\n${urlWithTracking}\n\nתודה!`
          : `Hi,\n\nI'd appreciate if you could fill out our questionnaire:\n${urlWithTracking}\n\nThank you!`;
        shareUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
        break;
      case 'sms':
        // SMS with pre-filled text and URL
        const smsMessage = this.lang.currentLanguage === 'he'
          ? `מלא את השאלון שלנו: ${urlWithTracking}`
          : `Fill out our questionnaire: ${urlWithTracking}`;
        shareUrl = `sms:?body=${encodeURIComponent(smsMessage)}`;
        break;
      case 'website':
        // Generic share - only copy to clipboard
        return;
    }

    // Open the share URL after a short delay to ensure the notification is visible
    if (shareUrl) {
      setTimeout(() => {
        window.open(shareUrl, '_blank');
      }, 800);
    }
  }

  // Delete saved link
  handleDeleteSavedLink(linkId: string) {
    this.savedLinks = this.savedLinks.filter(link => link.id !== linkId);
    this.saveSavedLinks();

    this.toast.show(
      this.lang.t('links.linkDeleted'),
      'success'
    );
  }

  // Load saved link into current form
  handleLoadSavedLink(savedLink: SavedLink) {
    this.currentUrl = savedLink.url;
    this.currentMode = savedLink.type;

    this.toast.show(
      this.lang.t('links.linkLoaded'),
      'success'
    );
  }

  // Copy link with tracking parameter
  async copyLinkWithTracking(network: 'facebook' | 'instagram' | 'linkedin' | 'general') {
    if (!this.currentUrl) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'אנא יצור קישור תחילה' : 'Please create a link first',
        'error'
      );
      return;
    }

    const url = new URL(this.currentUrl);
    url.searchParams.set('src', network);
    const trackedUrl = url.toString();

    const success = await this.copyToClipboard(trackedUrl);

    if (success) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? `קישור עם מעקב ${network} הועתק ללוח` : `${network} tracked link copied to clipboard`,
        'success'
      );
    } else {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בהעתקה' : 'Copy failed',
        'error'
      );
    }
  }

  async handleBuildLink(type: 'form' | 'chat' | 'qr') {
    if (!this.selectedQuestionnaire) {
      this.toast.show(
        this.lang.t('distribution.chooseQuestionnaireFirst'),
        'error'
      );
      return;
    }

    // Check if distribution exists and has a token
    if (!this.currentDistribution || !this.currentDistribution.token) {
      this.toast.show(
        this.lang.t('distribution.chooseQuestionnaireFirst'),
        'error'
      );
      return;
    }

    const base = environment.siteUrl;
    const distributionToken = this.currentDistribution.token;
    let url = '';

    // Build URL with distribution token and add src parameter
    if (type === 'form') {
      url = `${base}/q/${distributionToken}?src=form`;
    } else if (type === 'chat') {
      url = `${base}/q/${distributionToken}/chat?src=chat`;
    } else if (type === 'qr') {
      url = `${base}/q/${distributionToken}/qr?src=qr`;
    }

    this.currentMode = type;
    this.currentUrl = url;

    // Don't show toast or copy - just mark as selected
    // User will copy when they select a social network
  }

  getTypeName(type: 'form' | 'chat' | 'qr'): string {
    switch (type) {
      case 'form': return this.lang.t('distribution.form');
      case 'chat': return this.lang.t('distribution.chat');
      case 'qr': return this.lang.t('distribution.qr');
      default: return '';
    }
  }

  navigateToAutomations() {
    this.router.navigate(['/automations'], { queryParams: { tab: 'templates' } });
  }

  getChannelNameInHebrew(channel: 'email' | 'whatsapp' | 'sms'): string {
    switch (channel) {
      case 'email': return this.lang.t('distribution.channelEmail');
      case 'whatsapp': return this.lang.t('distribution.channelWhatsapp');
      case 'sms': return this.lang.t('distribution.channelSms');
    }
  }

  getFormattedChannels(template: SelectedTemplate): string {
    return template.channels.map(ch => this.getChannelNameInHebrew(ch)).join(', ');
  }

  // Helper method to copy text to clipboard with fallback for non-HTTPS environments
  private async copyToClipboard(text: string): Promise<boolean> {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Clipboard API failed:', err);
      }
    }

    // Fallback to legacy method for HTTP environments
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      return successful;
    } catch (err) {
      console.error('Legacy copy failed:', err);
      return false;
    }
  }
}
