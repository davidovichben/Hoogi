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

  onQuestionnaireChange() {
    // Hide the generated link when questionnaire selection changes
    this.currentMode = null;
    this.currentUrl = '';
    this.currentDistribution = null;
    this.selectedTemplates = [];
    this.selectedSocialNetwork = null;

    // Load existing distribution if available
    this.loadExistingDistribution();
  }

  onTemplatesChange() {
    // Hide the generated link when templates change
    this.currentMode = null;
    this.currentUrl = '';
    this.selectedSocialNetwork = null;
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
      const url = new URL(this.currentUrl, window.location.origin);
      url.searchParams.set('src', network);
      urlWithTracking = url.toString();
    } catch (error) {
      console.error('Error creating URL:', error);
      // Fallback: append parameter manually
      urlWithTracking = this.currentUrl + (this.currentUrl.includes('?') ? '&' : '?') + `src=${network}`;
    }

    // Get the share endpoint for the social network
    let shareUrl = '';
    switch (network) {
      case 'whatsapp':
        // WhatsApp share with text
        const whatsappText = encodeURIComponent(`מלא את השאלון שלנו: ${urlWithTracking}`);
        shareUrl = `https://wa.me/?text=${whatsappText}`;
        break;
      case 'facebook':
        // Using Facebook's share dialog - this pre-fills the URL in the post
        shareUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(urlWithTracking)}`;
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, so we'll just copy the link
        navigator.clipboard.writeText(urlWithTracking);
        this.toast.show(
          `${networkName} ${this.lang.t('distribution.linkCopiedToClipboard')}`,
          'success'
        );
        return;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlWithTracking)}`;
        break;
      case 'youtube':
        // YouTube - copy link for video description
        navigator.clipboard.writeText(urlWithTracking);
        this.toast.show(
          `${networkName} ${this.lang.t('distribution.linkCopiedAddToVideo')}`,
          'success'
        );
        return;
      case 'telegram':
        // Telegram share
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(urlWithTracking)}`;
        break;
      case 'email':
        // Email with subject and body
        const emailSubject = encodeURIComponent('מלא את השאלון שלנו');
        const emailBody = encodeURIComponent(`היי,\n\nאשמח אם תוכל למלא את השאלון שלנו:\n${urlWithTracking}\n\nתודה!`);
        shareUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
        break;
      case 'sms':
        // SMS with text
        const smsBody = encodeURIComponent(`מלא את השאלון שלנו: ${urlWithTracking}`);
        shareUrl = `sms:?body=${smsBody}`;
        break;
      case 'website':
        // For website, just copy the link
        navigator.clipboard.writeText(urlWithTracking);
        this.toast.show(
          `${networkName} ${this.lang.t('distribution.linkCopiedToClipboard')}`,
          'success'
        );
        return;
    }

    // Open the share URL in a new tab or trigger the action
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      this.toast.show(
        `${networkName} ${this.lang.t('distribution.linkCreatedSuccessfully')}`,
        'success'
      );
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

    try {
      await navigator.clipboard.writeText(trackedUrl);
      this.toast.show(
        this.lang.currentLanguage === 'he' ? `קישור עם מעקב ${network} הועתק ללוח` : `${network} tracked link copied to clipboard`,
        'success'
      );
    } catch (error) {
      console.error('Copy failed:', error);
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

    // Get the selected questionnaire to access its token
    const questionnaire = this.questionnaires.find(q => q.id === this.selectedQuestionnaire);
    if (!questionnaire || !questionnaire.token) {
      this.toast.show(
        this.lang.t('distribution.questionnaireNotActive'),
        'error'
      );
      return;
    }

    const base = window.location.origin;
    let url = '';

    if (type === 'form') {
      url = `${base}/q/${questionnaire.token}`;
    } else if (type === 'chat') {
      url = `${base}/q/${questionnaire.token}/chat`;
    } else if (type === 'qr') {
      url = `${base}/q/${questionnaire.token}/qr`;
    }

    this.currentMode = type;
    this.currentUrl = url;

    this.toast.show(
      this.lang.t('distribution.linkCreated'),
      'success'
    );
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
}
