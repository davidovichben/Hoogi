import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { ProfileValidatorService } from '../../core/services/profile-validator.service';

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
  openDistributionId: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    public lang: LanguageService,
    private router: Router,
    private toast: ToastService,
    private profileValidator: ProfileValidatorService
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

    // Fetch all responses and leads in parallel for all questionnaires at once
    const [responsesResult, leadsResult] = await Promise.all([
      this.supabaseService.client
        .from('responses')
        .select('questionnaire_id')
        .in('questionnaire_id', questionnaireIds),
      this.supabaseService.client
        .from('leads')
        .select('questionnaire_id')
        .in('questionnaire_id', questionnaireIds)
    ]);

    // Count responses per questionnaire
    const responseData = responsesResult.data || [];
    this.questionnaires.forEach(q => {
      this.respCount[q.id] = responseData.filter(r => r.questionnaire_id === q.id).length;
    });

    // Count leads per questionnaire
    const leadData = leadsResult.data || [];
    this.questionnaires.forEach(q => {
      this.leadCount[q.id] = leadData.filter(l => l.questionnaire_id === q.id).length;
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
    // Check if published
    const { data, error } = await this.supabaseService.client
      .from('questionnaires')
      .select('is_published, token')
      .eq('id', q.id)
      .single();

    if (error || !data?.is_published || !data?.token) {
      this.toast.show(
        this.lang.t('questionnaires.publishToShare'),
        'error'
      );
      return;
    }

    const url = `${window.location.origin}/q/${data.token}`;
    try {
      await navigator.clipboard.writeText(url);
      this.toast.show(this.lang.t('questionnaires.linkCopiedDesc'), 'success');
    } catch {
      this.toast.show(this.lang.t('questionnaires.copyErrorDesc'), 'error');
    }
  }

  handleEdit(qid: string) {
    this.router.navigate(['/questionnaires/edit', qid]);
  }

  handleViewLive(qid: string) {
    this.router.navigate(['/questionnaires/live', qid]);
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
    const confirmMessage = this.lang.currentLanguage === 'he'
      ? `האם אתה בטוח שברצונך למחוק את השאלון "${q.title || 'ללא שם'}"?`
      : `Are you sure you want to delete the questionnaire "${q.title || 'Untitled'}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

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
    const url = `${window.location.origin}/q/${q.token}`;

    try {
      await navigator.clipboard.writeText(url);
      this.toast.show(
        this.lang.currentLanguage === 'he' ? 'הקישור הועתק ללוח' : 'Link copied to clipboard',
        'success'
      );
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
      'bg-blue-50/40 border-blue-200/50',
      'bg-green-50/40 border-green-200/50',
      'bg-purple-50/40 border-purple-200/50',
      'bg-orange-50/40 border-orange-200/50',
      'bg-pink-50/40 border-pink-200/50',
      'bg-cyan-50/40 border-cyan-200/50',
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

  handleView(id: string) {
    this.router.navigate(['/questionnaires/live', id]);
  }

  handleDistribute(id: string) {
    this.router.navigate(['/distribution-hub'], { queryParams: { questionnaireId: id } });
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
}
