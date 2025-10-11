import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { Subject } from 'rxjs';

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

  // Stats
  remainingLeads = 180;
  utilizedLeads = 120;
  activeQuestionnairesCount = 5;
  newLeadsCount = 42;
  reminderLeadsCount = 18;

  // Network leads data
  networkData: LeadItem[] = [
    { id: '1', name: 'Facebook', source: 'facebook', count: 45, color: '#8B5CF6' },
    { id: '2', name: 'Instagram', source: 'instagram', count: 38, color: '#EC4899' },
    { id: '3', name: 'WhatsApp', source: 'whatsapp', count: 25, color: '#10B981' },
    { id: '4', name: 'אתר', source: 'website', count: 30, color: '#3B82F6' },
    { id: '5', name: 'LinkedIn', source: 'linkedin', count: 42, color: '#F59E0B' },
  ];

  // Partner leads data
  partnerData: LeadItem[] = [
    { id: '1', name: 'שותף א׳', source: 'partner1', count: 65, color: '#8B5CF6' },
    { id: '2', name: 'שותף ב׳', source: 'partner2', count: 52, color: '#EC4899' },
    { id: '3', name: 'שותף ג׳', source: 'partner3', count: 43, color: '#10B981' },
  ];

  // Questionnaires
  questionnaires: QuestionnaireItem[] = [];

  // Partner summary stats
  partnerStats = {
    total: 160,
    new: 32,
    average: 53
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
        .select('email, company')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.company) {
        this.userName = data.company;
        this.businessName = data.company;
      } else if (data?.email) {
        this.userName = data.email.split('@')[0];
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

      // Load actual counts
      const [
        { count: leadsCount },
        { count: responsesCount }
      ] = await Promise.all([
        this.supabaseService.client.from('leads').select("*", { count: "exact", head: true }).eq("owner_id", userId),
        this.supabaseService.client.from('responses').select("*", { count: "exact", head: true }).eq("owner_id", userId)
      ]);

      if (leadsCount !== null) this.remainingLeads = leadsCount;
      if (responsesCount !== null) this.utilizedLeads = responsesCount;

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

  viewQuestionnaireForm(id: string) {
    window.open(`/q/${id}`, '_blank');
  }

  viewQuestionnaireStats(id: string) {
    this.router.navigate(['/leads'], { queryParams: { id, tab: 'analysis' } });
  }

  editQuestionnaire(id: string) {
    this.router.navigate(['/questionnaires/edit', id]);
  }

  shareQuestionnaire(id: string) {
    this.router.navigate(['/distribution-hub'], { queryParams: { id } });
  }

  viewNewLeads() {
    this.router.navigate(['/leads'], { queryParams: { filter: 'new' } });
  }

  viewReminderLeads() {
    this.router.navigate(['/leads'], { queryParams: { filter: 'reminder' } });
  }

  goToSubscription() {
    this.router.navigate(['/profile'], { queryParams: { tab: 'subscription' } });
  }
}
