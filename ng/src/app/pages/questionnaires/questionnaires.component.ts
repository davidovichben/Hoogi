import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { ProfileValidatorService } from '../../core/services/profile-validator.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import * as QRCode from 'qrcode';
import { environment } from '../../../environments/environment';

interface Questionnaire {
  id: string;
  title: string | null;
  token: string | null;
  created_at: string | null;
  is_active?: boolean | null;
  status?: string;
}

@Component({
  selector: 'app-questionnaires',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './questionnaires.component.html',
  styleUrls: ['./questionnaires.component.sass']
})
export class QuestionnairesComponent implements OnInit {
  questionnaires: Questionnaire[] = [];
  loading = true;
  error: string | null = null;
  respCount: Record<string, number> = {};
  leadCount: Record<string, number> = {};
  newLeadCount: Record<string, number> = {}; // Leads from last 3 days
  openDistributionId: string | null = null;
  showQRCodeId: string | null = null;
  qrCodeDataUrl: string = '';

  constructor(
    private supabaseService: SupabaseService,
    public lang: LanguageService,
    private router: Router,
    private toast: ToastService,
    private profileValidator: ProfileValidatorService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadQuestionnaires();
  }

  async loadQuestionnaires() {
    try {
      this.loading = true;
      const user = this.supabaseService.currentUser;

      if (!user) {
        const local = JSON.parse(localStorage.getItem('hoogiQuestionnaires') || '[]');
        this.questionnaires = local;
        return;
      }

      let res = await this.supabaseService.client
        .from('questionnaires')
        .select('id,title,token,created_at,is_active')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (res.error) {
        // Fallback to user_id if owner_id fails
        res = await this.supabaseService.client
          .from('questionnaires')
          .select('id,title,token,created_at,is_active')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      }

      if (res.error) throw res.error;

      this.questionnaires = (res.data || []).map((q: any) => ({
        ...q,
        status: q.is_active ? 'active' : 'draft'
      })) as Questionnaire[];
      await this.loadCounts();
    } catch (e: any) {
      const local = JSON.parse(localStorage.getItem('hoogiQuestionnaires') || '[]');
      this.questionnaires = local;
      this.error = e.message || String(e);
    } finally {
      this.loading = false;
    }
  }

  async loadCounts() {
    if (!this.questionnaires.length) return;

    const questionnaireIds = this.questionnaires.map(q => q.id);

    // Calculate date for "new" leads (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoISO = threeDaysAgo.toISOString();

    // Fetch all responses and leads in parallel for all questionnaires at once
    const [responsesResult, leadsResult] = await Promise.all([
      this.supabaseService.client
        .from('responses')
        .select('questionnaire_id')
        .in('questionnaire_id', questionnaireIds),
      this.supabaseService.client
        .from('leads')
        .select('questionnaire_id, created_at')
        .in('questionnaire_id', questionnaireIds)
    ]);

    // Count responses per questionnaire
    const responseData = responsesResult.data || [];
    this.questionnaires.forEach(q => {
      this.respCount[q.id] = responseData.filter(r => r.questionnaire_id === q.id).length;
    });

    // Count leads per questionnaire (total and new)
    const leadData = leadsResult.data || [];
    this.questionnaires.forEach(q => {
      const questionnaireLeads = leadData.filter(l => l.questionnaire_id === q.id);
      this.leadCount[q.id] = questionnaireLeads.length;

      // Count new leads (last 3 days)
      this.newLeadCount[q.id] = questionnaireLeads.filter(l =>
        new Date(l.created_at) >= threeDaysAgo
      ).length;
    });
  }

  getStatus(q: Questionnaire): string {
    return q.is_active ? 'active' : 'draft';
  }

  getConversionRate(qid: string): number {
    const responses = this.respCount[qid] ?? 0;
    const leads = this.leadCount[qid] ?? 0;
    return responses > 0 ? Math.round((leads / responses) * 100) : 0;
  }

  async handleShare(q: Questionnaire) {
    try {
      // Check if questionnaire is published
      const { data: questionnaireData, error: qError } = await this.supabaseService.client
        .from('questionnaires')
        .select('is_published')
        .eq('id', q.id)
        .single();

      if (qError || !questionnaireData?.is_published) {
        this.toast.show(
          this.lang.t('questionnaires.publishToShare'),
          'error'
        );
        return;
      }

      // Get or create an active distribution for this questionnaire
      let { data: distributions, error: distError } = await this.supabaseService.client
        .from('distributions')
        .select('token')
        .eq('questionnaire_id', q.id)
        .eq('is_active', true)
        .limit(1);

      if (distError) throw distError;

      let token: string;

      if (distributions && distributions.length > 0) {
        // Use existing distribution token
        token = distributions[0].token;
      } else {
        // Create a new distribution
        const { data: newDist, error: createError } = await this.supabaseService.client
          .from('distributions')
          .insert([{
            questionnaire_id: q.id,
            automation_template_ids: [],
            is_active: true
          }])
          .select('token')
          .single();

        if (createError) throw createError;
        token = newDist.token;
      }

      if (!token) {
        throw new Error('No token generated');
      }

      const url = `${environment.siteUrl}/q/${token}`;
      const success = await this.copyToClipboard(url);

      if (success) {
        this.toast.show(this.lang.t('questionnaires.linkCopiedDesc'), 'success');
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      console.error('Error sharing questionnaire:', error);
      this.toast.show(this.lang.t('questionnaires.copyErrorDesc'), 'error');
    }
  }

  handleEdit(qid: string) {
    this.router.navigate(['/questionnaires/edit', qid]);
  }

  async handleViewLive(qid: string) {
    try {
      // Load full questionnaire data
      const { data: questionnaire, error: qError } = await this.supabaseService.client
        .from('questionnaires')
        .select('*')
        .eq('id', qid)
        .single();

      if (qError || !questionnaire) throw qError;

      // Load questions
      const { data: questions, error: questionsError } = await this.supabaseService.client
        .from('questions')
        .select('*')
        .eq('questionnaire_id', qid)
        .order('question_order', { ascending: true });

      if (questionsError) throw questionsError;

      // Load question options
      let allOptions: any[] = [];
      if (questions && questions.length > 0) {
        const questionIds = questions.map((q: any) => q.id);
        const { data: options, error: optionsError } = await this.supabaseService.client
          .from('question_options')
          .select('*')
          .in('question_id', questionIds)
          .order('order_index', { ascending: true });

        if (!optionsError && options) {
          allOptions = options;
        }
      }

      // Load profile data for branding
      const { data: profile, error: profileError } = await this.supabaseService.client
        .from('profiles')
        .select('brand_primary, brand_secondary, background_color, logo_url, image_url, business_name')
        .eq('id', questionnaire.owner_id)
        .single();

      // Convert questions to preview format
      const previewQuestions = (questions || []).map((q: any, index: number) => {
        // Find options for this question
        const questionOptions = allOptions.filter((opt: any) => opt.question_id === q.id);

        return {
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          question_order: index + 1,
          order_index: index,
          min_rating: q.min_rating || null,
          max_rating: q.max_rating || null,
          options: questionOptions.map((opt: any) => opt.label || opt.value)
        };
      });

      // Store preview data in session storage
      const previewData = {
        questionnaire: {
          id: qid,
          title: questionnaire.title,
          description: questionnaire.description || '',
          language: questionnaire.language || 'he',
          owner_id: questionnaire.owner_id,
          show_logo: questionnaire.show_logo ?? true,
          show_profile_image: questionnaire.show_profile_image ?? true,
          link_url: questionnaire.link_url || null,
          attachment_url: questionnaire.attachment_url || null
        },
        questions: previewQuestions,
        options: allOptions,
        profile: {
          brand_primary: profile?.brand_primary || '#199f3a',
          brand_secondary: profile?.brand_secondary || '#9cbb54',
          background_color: profile?.background_color || '#b0a0a4',
          logo_url: profile?.logo_url || '',
          image_url: profile?.image_url || '',
          business_name: profile?.business_name || ''
        }
      };

      sessionStorage.setItem('preview_questionnaire', JSON.stringify(previewData));

      // Open preview in new tab with absolute URL (form view by default)
      const url = `${environment.siteUrl}/questionnaires/live/preview`;
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Error loading questionnaire for preview:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בטעינת שאלון' : 'Error loading questionnaire',
        'error'
      );
    }
  }

  handlePreview(q: Questionnaire) {
    if (q.token) {
      window.open(`/q/${q.token}`, '_blank');
    }
  }

  async handleDuplicate(q: Questionnaire) {
    try {
      const user = this.supabaseService.currentUser;
      if (!user) {
        this.toast.show(
          this.lang.currentLanguage === 'he' ? 'יש להתחבר כדי לשכפל שאלון' : 'Please login to copy a questionnaire',
          'error'
        );
        return;
      }

      // Load the full questionnaire data
      const { data: questionnaire, error: qError } = await this.supabaseService.client
        .from('questionnaires')
        .select('*')
        .eq('id', q.id)
        .single();

      if (qError || !questionnaire) throw qError;

      // Load questions
      const { data: questions, error: questionsError } = await this.supabaseService.client
        .from('questions')
        .select('*')
        .eq('questionnaire_id', q.id)
        .order('question_order', { ascending: true });

      if (questionsError) throw questionsError;

      // Create new questionnaire with copied data
      const newQuestionnaireData = {
        title: `${questionnaire.title} (${this.lang.currentLanguage === 'he' ? 'עותק' : 'Copy'})`,
        language: questionnaire.language,
        status: 'draft',
        user_id: user.id,
        owner_id: user.id,
        is_active: false
      };

      const { data: newQuestionnaire, error: createError } = await this.supabaseService.client
        .from('questionnaires')
        .insert(newQuestionnaireData)
        .select()
        .single();

      if (createError || !newQuestionnaire) throw createError;

      // Copy questions if any
      if (questions && questions.length > 0) {
        const questionIds: string[] = questions.map(q => q.id);

        // Load options for all questions
        const { data: options, error: optionsError } = await this.supabaseService.client
          .from('question_options')
          .select('*')
          .in('question_id', questionIds)
          .order('order_index', { ascending: true });

        if (optionsError) throw optionsError;

        // Insert questions
        const questionsData = questions.map((q: any, index: number) => ({
          questionnaire_id: newQuestionnaire.id,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          question_order: index + 1
        }));

        const { data: newQuestions, error: insertQuestionsError } = await this.supabaseService.client
          .from('questions')
          .insert(questionsData)
          .select();

        if (insertQuestionsError) throw insertQuestionsError;

        // Copy options if any
        if (options && options.length > 0 && newQuestions && newQuestions.length > 0) {
          const optionsData = options.map((opt: any) => {
            const oldQuestionIndex = questions.findIndex(q => q.id === opt.question_id);
            const newQuestion = newQuestions[oldQuestionIndex];
            return {
              question_id: newQuestion.id,
              value: opt.value,
              label: opt.label,
              order_index: opt.order_index
            };
          });

          const { error: insertOptionsError } = await this.supabaseService.client
            .from('question_options')
            .insert(optionsData);

          if (insertOptionsError) throw insertOptionsError;
        }
      }

      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'השאלון שוכפל בהצלחה' : 'Questionnaire copied successfully',
        'success'
      );

      // Reload questionnaires
      await this.loadQuestionnaires();
    } catch (e: any) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בשכפול השאלון' : 'Error copying questionnaire',
        'error'
      );
      console.error('Error copying questionnaire:', e);
    }
  }

  async handleDelete(q: Questionnaire) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: this.lang.currentLanguage === 'he'
          ? `האם אתה בטוח שברצונך למחוק את השאלון "${q.title || 'ללא שם'}"?`
          : `Are you sure you want to delete the questionnaire "${q.title || 'Untitled'}"?`,
        confirmText: this.lang.t('common.delete'),
        cancelText: this.lang.t('common.cancel'),
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;

      try {
        const { error } = await this.supabaseService.client
          .from('questionnaires')
          .delete()
          .eq('id', q.id);

        if (error) throw error;

        this.toast.show(
          this.lang.currentLanguage === 'he' ? 'השאלון נמחק בהצלחה' : 'Questionnaire deleted successfully',
          'success'
        );

        // Reload questionnaires
        await this.loadQuestionnaires();
      } catch (e: any) {
        this.toast.show(
          this.lang.currentLanguage === 'he' ? 'שגיאה במחיקת השאלון' : 'Error deleting questionnaire',
          'error'
        );
        console.error('Error deleting questionnaire:', e);
      }
    });
  }

  toggleDistribution(qid: string) {
    this.openDistributionId = this.openDistributionId === qid ? null : qid;
  }

  async handleDistributeForm(q: Questionnaire) {
    // Check if questionnaire has a token
    if (!q.token) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'השאלון חייב להיות פעיל כדי לקבל קישור' : 'Questionnaire must be active to get a link',
        'error'
      );
      return;
    }

    // Generate the external URL
    const url = `${environment.siteUrl}/q/${q.token}`;

    try {
      const success = await this.copyToClipboard(url);

      if (success) {
        this.toast.show(
          this.lang.currentLanguage === 'he' ? 'הקישור הועתק ללוח' : 'Link copied to clipboard',
          'success'
        );
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בהעתקת הקישור' : 'Error copying link',
        'error'
      );
    }
  }

  handleDistributeChat(q: Questionnaire) {
    // Handle chat distribution
    this.toast.show(
      this.lang.currentLanguage === 'he' ? 'הפצה בצ\'אט - בקרוב' : 'Chat distribution - Coming soon',
      'info'
    );
    console.log('Distribute as chat:', q);
  }

  getCardColor(index: number): string {
    const colors = [
      'bg-blue-50/40 border-blue-300 border-2 shadow-md shadow-blue-100',
      'bg-green-50/40 border-green-300 border-2 shadow-md shadow-green-100',
      'bg-purple-50/40 border-purple-300 border-2 shadow-md shadow-purple-100',
      'bg-orange-50/40 border-orange-300 border-2 shadow-md shadow-orange-100',
      'bg-pink-50/40 border-pink-300 border-2 shadow-md shadow-pink-100',
      'bg-cyan-50/40 border-cyan-300 border-2 shadow-md shadow-cyan-100',
    ];
    return colors[index % colors.length];
  }

  getDataBackgroundColor(index: number): string {
    const colors = [
      'bg-blue-100/60',
      'bg-green-100/60',
      'bg-purple-100/60',
      'bg-orange-100/60',
      'bg-pink-100/60',
      'bg-cyan-100/60',
    ];
    return colors[index % colors.length];
  }

  async toggleActive(id: string) {
    try {
      const questionnaire = this.questionnaires.find(q => q.id === id);
      if (!questionnaire) return;

      const newStatus = questionnaire.status === 'active' ? 'draft' : 'active';
      const newIsActive = newStatus === 'active';

      const { error } = await this.supabaseService.client
        .from('questionnaires')
        .update({ is_active: newIsActive, status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      questionnaire.is_active = newIsActive;
      questionnaire.status = newStatus;

      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? `השאלון ${newStatus === 'active' ? 'הופעל' : 'הושבת'} בהצלחה`
          : `Questionnaire ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    } catch (e: any) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בעדכון סטטוס' : 'Error updating status',
        'error'
      );
      console.error('Error toggling status:', e);
    }
  }

  async handleView(id: string) {
    try {
      // Load full questionnaire data
      const { data: questionnaire, error: qError } = await this.supabaseService.client
        .from('questionnaires')
        .select('*')
        .eq('id', id)
        .single();

      if (qError || !questionnaire) throw qError;

      // Load questions
      const { data: questions, error: questionsError } = await this.supabaseService.client
        .from('questions')
        .select('*')
        .eq('questionnaire_id', id)
        .order('question_order', { ascending: true });

      if (questionsError) throw questionsError;

      // Load question options
      let allOptions: any[] = [];
      if (questions && questions.length > 0) {
        const questionIds = questions.map((q: any) => q.id);
        const { data: options, error: optionsError } = await this.supabaseService.client
          .from('question_options')
          .select('*')
          .in('question_id', questionIds)
          .order('order_index', { ascending: true });

        if (!optionsError && options) {
          allOptions = options;
        }
      }

      // Load profile data for branding
      const { data: profile, error: profileError } = await this.supabaseService.client
        .from('profiles')
        .select('brand_primary, brand_secondary, background_color, logo_url, image_url, business_name')
        .eq('id', questionnaire.owner_id)
        .single();

      // Convert questions to preview format
      const previewQuestions = (questions || []).map((q: any, index: number) => {
        // Find options for this question
        const questionOptions = allOptions.filter((opt: any) => opt.question_id === q.id);

        return {
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          question_order: index + 1,
          order_index: index,
          min_rating: q.min_rating || null,
          max_rating: q.max_rating || null,
          options: questionOptions.map((opt: any) => opt.label || opt.value)
        };
      });

      // Store preview data in session storage
      const previewData = {
        questionnaire: {
          id: id,
          title: questionnaire.title,
          description: questionnaire.description || '',
          language: questionnaire.language || 'he',
          owner_id: questionnaire.owner_id,
          show_logo: questionnaire.show_logo ?? true,
          show_profile_image: questionnaire.show_profile_image ?? true,
          link_url: questionnaire.link_url || null,
          attachment_url: questionnaire.attachment_url || null
        },
        questions: previewQuestions,
        options: allOptions,
        profile: {
          brand_primary: profile?.brand_primary || '#199f3a',
          brand_secondary: profile?.brand_secondary || '#9cbb54',
          background_color: profile?.background_color || '#b0a0a4',
          logo_url: profile?.logo_url || '',
          image_url: profile?.image_url || '',
          business_name: profile?.business_name || ''
        }
      };

      sessionStorage.setItem('preview_questionnaire', JSON.stringify(previewData));

      // Open preview in new tab with absolute URL (form view by default)
      const url = `${environment.siteUrl}/questionnaires/live/preview`;
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Error loading questionnaire for preview:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בטעינת שאלון' : 'Error loading questionnaire',
        'error'
      );
    }
  }

  handleDistribute(id: string) {
    this.router.navigate(['/distribution-hub'], { queryParams: { questionnaireId: id } });
  }

  async handleShowQRCode(q: Questionnaire) {
    // Check if questionnaire has a token
    if (!q.token) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'השאלון חייב להיות פעיל כדי ליצור QR' : 'Questionnaire must be active to generate QR code',
        'error'
      );
      return;
    }

    try {
      // Generate the external URL for the form version
      const url = `${window.location.origin}/q/${q.token}`;

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      this.qrCodeDataUrl = qrDataUrl;
      this.showQRCodeId = q.id;
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה ביצירת QR' : 'Error generating QR code',
        'error'
      );
    }
  }

  closeQRCode() {
    this.showQRCodeId = null;
    this.qrCodeDataUrl = '';
  }

  async downloadQRCode() {
    if (!this.qrCodeDataUrl || !this.showQRCodeId) return;

    try {
      const questionnaire = this.questionnaires.find(q => q.id === this.showQRCodeId);
      if (!questionnaire) return;

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = this.qrCodeDataUrl;
      link.download = `${questionnaire.title || 'questionnaire'}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'QR הורד בהצלחה' : 'QR code downloaded successfully',
        'success'
      );
    } catch (error) {
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'שגיאה בהורדת QR' : 'Error downloading QR code',
        'error'
      );
    }
  }

  async goToOnboarding() {
    const user = this.supabaseService.currentUser;
    if (!user) {
      this.router.navigate(['/questionnaires/new']);
      return;
    }

    // Check if profile is complete
    const isComplete = await this.profileValidator.isProfileComplete(user.id);
    if (!isComplete) {
      const message = this.lang.currentLanguage === 'he'
        ? 'יש להשלים את הפרופיל לפני יצירת שאלון. האם תרצה לעבור לדף הפרופיל?'
        : 'Please complete your profile before creating a questionnaire. Would you like to go to the profile page?';

      if (confirm(message)) {
        this.router.navigate(['/profile']);
      }
      return;
    }

    this.router.navigate(['/questionnaires/new']);
  }

  handleViewStatistics(questionnaireId: string) {
    // Navigate to leads page with leads tab active and filtered by questionnaire
    this.router.navigate(['/leads'], {
      queryParams: {
        questionnaireId: questionnaireId,
        tab: 'leads'
      }
    });
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
