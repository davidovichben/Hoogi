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
  response_template_ids: string[];
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
  template_type: string;
  response_type: string;
  channels: string[];
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
        .select('id, name, template_type, response_type, channels')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.availableTemplates = data || [];
    } catch (e: any) {
      console.error('Error loading automation templates:', e);
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

    // Load existing distribution if available
    this.loadExistingDistribution();
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

    const template = this.availableTemplates.find(t => t.id === this.newTemplateId);
    if (template) {
      this.selectedTemplates.push({
        id: template.id,
        name: template.name,
        channels: []
      });
      this.newTemplateId = '';
    }
  }

  removeTemplate(index: number) {
    this.selectedTemplates.splice(index, 1);
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
    // Validate questionnaire is selected
    if (!this.selectedQuestionnaire) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'יש לבחור שאלון תחילה'
          : 'Please select a questionnaire first',
        'error'
      );
      return;
    }

    try {
      this.loading = true;

      // Get template IDs from selected templates
      const templateIds = this.selectedTemplates.map(t => t.id);

      // Check if distribution already exists
      if (this.currentDistribution) {
        // Update existing distribution
        const { data, error } = await this.supabaseService.client
          .from('distributions')
          .update({
            response_template_ids: templateIds,
            is_active: true
          })
          .eq('id', this.currentDistribution.id)
          .select()
          .single();

        if (error) throw error;
        this.currentDistribution = data as Distribution;
      } else {
        // Create new distribution
        const { data, error } = await this.supabaseService.client
          .from('distributions')
          .insert([{
            questionnaire_id: this.selectedQuestionnaire,
            response_template_ids: templateIds,
            is_active: true
          }])
          .select()
          .single();

        if (error) throw error;
        this.currentDistribution = data as Distribution;
      }

      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'ההפצה נשמרה בהצלחה'
          : 'Distribution saved successfully',
        'success'
      );
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

  handleBuildLink(type: 'form' | 'chat' | 'qr') {
    if (!this.currentDistribution || !this.currentDistribution.token) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'יש לשמור את ההפצה תחילה'
          : 'Please save the distribution first',
        'error'
      );
      return;
    }

    const base = window.location.origin;
    let url = '';

    if (type === 'form') {
      url = `${base}/q/${this.currentDistribution.token}`;
    } else if (type === 'chat') {
      url = `${base}/q/${this.currentDistribution.token}/chat`;
    } else if (type === 'qr') {
      url = `${base}/q/${this.currentDistribution.token}/qr`;
    }

    this.currentMode = type;
    this.currentUrl = url;

    // Scroll to the preview section after the DOM updates
    setTimeout(() => {
      this.scrollToPreview();
    }, 300);
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
