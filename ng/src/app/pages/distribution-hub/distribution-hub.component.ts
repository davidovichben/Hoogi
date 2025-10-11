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

type ActiveTab = 'triggers' | 'response' | 'preferences';
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

  activeTab: ActiveTab = 'response';
  selectedQuestionnaire = '';
  selectedTemplate = '';
  enableWhatsApp = false;
  enableEmail = false;
  enableSMS = false;
  questionnaires: Questionnaire[] = [];
  loading = false;
  currentMode: LinkMode = null;
  currentUrl = '';

  constructor(
    public lang: LanguageService,
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.loadQuestionnaires();

    // Check for tab from query params
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'] as ActiveTab;
      }
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

  setActiveTab(tab: ActiveTab) {
    this.activeTab = tab;
  }

  goBack() {
    window.history.back();
  }

  navigateToAutomations() {
    this.router.navigate(['/automations'], { queryParams: { tab: 'templates' } });
  }

  onQuestionnaireChange() {
    // Hide the generated link when questionnaire selection changes
    this.currentMode = null;
    this.currentUrl = '';
  }

  toggleChannel(channel: 'whatsapp' | 'email' | 'sms') {
    if (!this.selectedQuestionnaire) return;

    if (channel === 'whatsapp') {
      this.enableWhatsApp = !this.enableWhatsApp;
    } else if (channel === 'email') {
      this.enableEmail = !this.enableEmail;
    } else if (channel === 'sms') {
      this.enableSMS = !this.enableSMS;
    }
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

  handleCopyUrl() {
    if (this.currentUrl) {
      navigator.clipboard.writeText(this.currentUrl);
      this.toast.show(this.lang.t('distribution.linkCopied'), 'success');
    }
  }

  get enabledChannels(): string[] {
    const channels: string[] = [];
    if (this.enableWhatsApp) channels.push('WhatsApp');
    if (this.enableEmail) channels.push(this.lang.t('distribution.email'));
    if (this.enableSMS) channels.push('SMS');
    return channels;
  }
}
