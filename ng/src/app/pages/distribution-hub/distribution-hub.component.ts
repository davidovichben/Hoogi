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

interface SelectedTemplate {
  id: string;
  name: string;
  channels: Array<'email' | 'whatsapp' | 'sms'>;
}

type LinkMode = 'form' | 'chat' | 'qr' | null;

// Mock automation templates
const AUTOMATION_TEMPLATES = [
  { id: 'template-1', name: 'תבנית תודה בסיסית', triggerType: 'lead' },
  { id: 'template-2', name: 'תבנית מעקב לאחר מילוי', triggerType: 'lead' },
  { id: 'template-3', name: 'תבנית הנחה מיוחדת', triggerType: 'lead' },
  { id: 'template-4', name: 'תבנית זימון לפגישה', triggerType: 'lead' },
];

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

  // Template management
  selectedTemplates: SelectedTemplate[] = [];
  availableTemplates = AUTOMATION_TEMPLATES;
  newTemplateId = '';

  constructor(
    public lang: LanguageService,
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.loadQuestionnaires();

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

  goBack() {
    window.history.back();
  }

  onQuestionnaireChange() {
    // Hide the generated link when questionnaire selection changes
    this.currentMode = null;
    this.currentUrl = '';
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

  handleBuildLink(type: 'form' | 'chat' | 'qr') {
    if (!this.selectedQuestionnaire) {
      this.toast.show(this.lang.t('distribution.selectQuestionnaireFirst'), 'error');
      return;
    }

    // Find the selected questionnaire to get its token
    const questionnaire = this.questionnaires.find(q => q.id === this.selectedQuestionnaire);

    if (!questionnaire) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שאלון לא נמצא' : 'Questionnaire not found',
        'error'
      );
      return;
    }

    if (!questionnaire.token) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'השאלון חייב להיות פעיל כדי לקבל קישור. אנא פרסם את השאלון תחילה.'
          : 'Questionnaire must be active to get a link. Please publish the questionnaire first.',
        'error'
      );
      return;
    }

    const base = window.location.origin;
    let url = '';

    if (type === 'form' || type === 'qr') {
      url = `${base}/q/${questionnaire.token}`;
    } else if (type === 'chat') {
      url = `${base}/q/${questionnaire.token}/chat`;
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
