import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LeadItem {
  id: string;
  name: string;
  source: string;
  count?: number;
  color?: string;
}

interface QuestionnaireItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  active: boolean;
  leads: { total: number; new: number };
  responses: { total: number; new: number };
  sources: string[];
  partners: string[];
  status?: string;
  created_at?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  error: string | null = null;
  userName = '';
  businessName = '';
  logoUrl = '';

  // Stats
  totalLeadQuota = 180; // Total lead quota
  utilizedLeads = 0;    // Actual leads used
  activeQuestionnairesCount = 0;
  newLeadsCount = 0;
  reminderLeadsCount = 0;

  // Computed property for remaining leads
  get remainingLeads(): number {
    return Math.max(0, this.totalLeadQuota - this.utilizedLeads);
  }

  // Channel leads data
  channelData: LeadItem[] = [];

  // Partner leads data
  partnerData: LeadItem[] = [];

  // Questionnaires
  questionnaires: QuestionnaireItem[] = [];

  // Partner summary stats
  partnerStats = {
    total: 0,
    new: 0,
    average: 0
  };

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router,
    public lang: LanguageService
  ) {}

  async ngOnInit() {
    await this.loadUserName();
    await this.loadDashboardData();
  }

  async loadUserName() {
    try {
      const userId = this.supabaseService.currentUser?.id;
      if (!userId) return;

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('email, company, username, logo_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        this.businessName = data.company || '';
        this.logoUrl = data.logo_url || '';

        // Use username if available, otherwise fall back to email
        if (data.username) {
          this.userName = data.username;
        } else if (data.email) {
          this.userName = data.email.split('@')[0];
        }
      }
    } catch (e) {
      const email = this.supabaseService.currentUser?.email;
      if (email) {
        this.userName = email.split('@')[0];
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadDashboardData() {
    try {
      this.loading = true;
      this.error = null;

      const userId = this.supabaseService.currentUser?.id;
      if (!userId) throw new Error("Not authenticated");

      // Load real questionnaires
      const { data: qList, error: qListErr } = await this.supabaseService.client
        .from('questionnaires')
        .select('id, title, is_active, created_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (qListErr) throw qListErr;

      this.questionnaires = (qList || []).map((q: any) => ({
        id: q.id,
        title: q.title || this.lang.t('dashboard.untitled'),
        subtitle: 'ללא קטגוריה',
        date: new Date(q.created_at).toLocaleDateString('he-IL'),
        active: q.is_active,
        leads: { total: 0, new: 0 },
        responses: { total: 0, new: 0 },
        sources: [],
        partners: [],
        status: q.is_active ? 'active' : 'draft',
        created_at: q.created_at
      }));

      // Load active questionnaires count
      const { count: activeQCount } = await this.supabaseService.client
        .from('questionnaires')
        .select("*", { count: "exact", head: true })
        .eq('owner_id', userId)
        .eq('is_active', true);

      if (activeQCount !== null) {
        this.activeQuestionnairesCount = activeQCount;
      }

      // Load actual counts - count leads to get utilized leads
      // RLS will automatically filter leads by questionnaire owner
      const { count: leadsCount } = await this.supabaseService.client
        .from('leads')
        .select("*", { count: "exact", head: true });

      // Set utilized leads - remaining will be calculated automatically (180 - utilized)
      if (leadsCount !== null) {
        this.utilizedLeads = leadsCount;
      }

      // Load new leads count (last 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoISO = threeDaysAgo.toISOString();

      const { count: newLeadsCount } = await this.supabaseService.client
        .from('leads')
        .select("*", { count: "exact", head: true })
        .gte('created_at', threeDaysAgoISO);

      if (newLeadsCount !== null) {
        this.newLeadsCount = newLeadsCount;
      }

      // Load leads waiting to be handled (status = 'new' or 'in-progress')
      const { count: waitingLeadsCount } = await this.supabaseService.client
        .from('leads')
        .select("*", { count: "exact", head: true })
        .in('status', ['new', 'in-progress']);

      if (waitingLeadsCount !== null) {
        this.reminderLeadsCount = waitingLeadsCount;
      }

      // Load channel distribution
      const { data: leadsData, error: leadsError } = await this.supabaseService.client
        .from('leads')
        .select('channel');

      if (!leadsError && leadsData) {
        // Define valid channels
        const validChannels = ['email', 'whatsapp', 'sms', 'website', 'facebook', 'instagram'];

        // Count leads by channel
        const channelCounts: { [key: string]: number } = {};
        leadsData.forEach((lead: any) => {
          let channel = lead.channel || 'other';
          // If channel is not in the valid list, categorize as 'other'
          if (!validChannels.includes(channel)) {
            channel = 'other';
          }
          channelCounts[channel] = (channelCounts[channel] || 0) + 1;
        });

        // Define channel colors
        const channelColors: { [key: string]: string } = {
          'email': '#8B5CF6',
          'whatsapp': '#10B981',
          'sms': '#3B82F6',
          'website': '#EC4899',
          'facebook': '#0ea5e9',
          'instagram': '#f43f5e',
          'other': '#6b7280'
        };

        // Build channelData array
        this.channelData = Object.entries(channelCounts).map(([channel, count]) => ({
          id: channel,
          name: this.lang.t(`leads.channel_${channel}`),
          source: channel,
          count: count,
          color: channelColors[channel] || '#6b7280'
        }));

        // Sort by count descending
        this.channelData.sort((a, b) => (b.count || 0) - (a.count || 0));

        // If no channels exist, show placeholder
        if (this.channelData.length === 0) {
          this.channelData = [{
            id: 'none',
            name: this.lang.t('dashboard.noPartners'),
            source: 'none',
            count: 0,
            color: '#8B5CF6'
          }];
        }
      }

      // Load partner distribution
      const { data: partnerLeadsData, error: partnerLeadsError } = await this.supabaseService.client
        .from('leads')
        .select('partner_id, created_at');

      if (!partnerLeadsError && partnerLeadsData) {
        // Count leads by partner
        const partnerCounts: { [key: string]: number } = {};
        let totalWithPartner = 0;
        let newWithPartner = 0;
        const threeDaysAgoDate = new Date();
        threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);

        partnerLeadsData.forEach((lead: any) => {
          if (lead.partner_id) {
            partnerCounts[lead.partner_id] = (partnerCounts[lead.partner_id] || 0) + 1;
            totalWithPartner++;

            // Check if it's a new lead (last 3 days)
            const leadDate = new Date(lead.created_at);
            if (leadDate >= threeDaysAgoDate) {
              newWithPartner++;
            }
          }
        });

        // Define partner colors
        const partnerColors = ['#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

        // Build partnerData array
        this.partnerData = Object.entries(partnerCounts).map(([partnerId, count], index) => ({
          id: partnerId,
          name: partnerId.substring(0, 8) + '...',
          source: partnerId,
          count: count,
          color: partnerColors[index % partnerColors.length]
        }));

        // Sort by count descending
        this.partnerData.sort((a, b) => (b.count || 0) - (a.count || 0));

        // If no partners exist, show placeholder
        if (this.partnerData.length === 0) {
          this.partnerData = [{
            id: 'none',
            name: this.lang.t('dashboard.noPartners'),
            source: 'none',
            count: 0,
            color: '#8B5CF6'
          }];
        }

        // Calculate partner stats
        this.partnerStats.total = totalWithPartner;
        this.partnerStats.new = newWithPartner;
        this.partnerStats.average = this.partnerData.length > 0 && totalWithPartner > 0
          ? Math.round(totalWithPartner / this.partnerData.length)
          : 0;
      }

    } catch (e: any) {
      this.error = e?.message || "Failed to load dashboard";
    } finally {
      this.loading = false;
    }
  }

  goNew() {
    this.router.navigate(['/questionnaires/new']);
  }

  viewLeads() {
    this.router.navigate(['/leads']);
  }

  viewQuestionnaires() {
    this.router.navigate(['/questionnaires']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  toggleQuestionnaireActive(id: string) {
    this.questionnaires = this.questionnaires.map(q =>
      q.id === id ? { ...q, active: !q.active } : q
    );
  }

  async viewQuestionnaireForm(id: string) {
    try {
      // Load full questionnaire data for preview
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

      // Open preview in new tab
      const url = `${environment.siteUrl}/questionnaires/live/preview`;
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Error loading questionnaire for preview:', error);
    }
  }

  viewQuestionnaireStats(id: string) {
    this.router.navigate(['/leads'], { queryParams: { questionnaireId: id, tab: 'answers-analytics' } });
  }

  editQuestionnaire(id: string) {
    this.router.navigate(['/questionnaires/edit', id]);
  }

  shareQuestionnaire(id: string) {
    this.router.navigate(['/distribution-hub'], { queryParams: { id } });
  }

  viewNewLeads() {
    // Calculate date range for last 3 days
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Format dates as YYYY-MM-DD
    const dateFrom = threeDaysAgo.toISOString().split('T')[0];
    const dateTo = tomorrow.toISOString().split('T')[0];

    this.router.navigate(['/leads'], {
      queryParams: {
        dateFrom: dateFrom,
        dateTo: dateTo
      }
    });
  }

  viewReminderLeads() {
    // Filter by status = 'new' and 'in-progress' (leads waiting to be handled)
    this.router.navigate(['/leads'], {
      queryParams: {
        status: 'new,in-progress'
      }
    });
  }

  goToSubscription() {
    this.router.navigate(['/profile'], { queryParams: { tab: 'subscription' } });
  }
}
