import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/services/language.service';
import { SupabaseService } from '../../core/services/supabase.service';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: boolean;
  status: 'new' | 'active' | 'waiting' | 'converted';
  date: string;
  automation?: string;
  tags?: string[];
}

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.sass'
})
export class LeadsComponent implements OnInit {
  activeTab: 'leads' | 'responses' | 'responseAnalysis' | 'leadAnalysis' = 'leads';
  showAutomationBanner = true;
  searchQuery = '';
  leads: Lead[] = [];
  loading = false;

  // Analysis data
  totalLeads = 45;
  activeLeads = 12;
  conversionRate = 28;

  constructor(
    public lang: LanguageService,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    await this.loadLeads();
  }

  async loadLeads() {
    this.loading = true;
    try {
      const user = this.supabase.currentUser;
      if (!user) return;

      // Fetch responses from the database
      const { data, error } = await this.supabase.client
        .from('responses')
        .select(`
          id,
          response_data,
          submitted_at,
          questionnaires!inner(owner_id)
        `)
        .eq('questionnaires.owner_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Transform responses into leads
      this.leads = (data || []).map((response: any) => {
        const responseData = response.response_data || {};

        // Extract name, email, phone from response_data
        // These are usually stored as question IDs, so we need to find them
        const name = this.extractField(responseData, ['name', 'שם', 'full name', 'שם מלא']) || 'Unknown';
        const email = this.extractField(responseData, ['email', 'אימייל', 'מייל']) || '';
        const phone = this.extractField(responseData, ['phone', 'טלפון', 'נייד', 'מספר טלפון']) || '';

        return {
          id: response.id,
          name,
          email,
          phone,
          whatsapp: phone ? true : false,
          status: 'new' as const,
          date: new Date(response.submitted_at).toLocaleDateString('he-IL'),
          automation: 'email',
          tags: []
        };
      });

      // Calculate analysis metrics
      this.totalLeads = this.leads.length;
      this.activeLeads = this.leads.filter(l => l.status === 'active').length;
      this.conversionRate = this.totalLeads > 0
        ? Math.round((this.leads.filter(l => l.status === 'converted').length / this.totalLeads) * 100)
        : 0;
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      this.loading = false;
    }
  }

  private extractField(data: any, possibleKeys: string[]): string {
    // Try to find the field by checking various possible keys
    for (const key in data) {
      const value = data[key];
      const lowerKey = key.toLowerCase();

      // Check if the key or value matches any of our possible keys
      for (const possibleKey of possibleKeys) {
        if (lowerKey.includes(possibleKey.toLowerCase())) {
          return typeof value === 'string' ? value : String(value);
        }
      }
    }
    return '';
  }

  getStatusLabel(status: Lead['status']): string {
    const labels: Record<Lead['status'], { he: string; en: string }> = {
      new: { he: 'חדש', en: 'New' },
      active: { he: 'פעיל', en: 'Active' },
      waiting: { he: 'ממתין', en: 'Waiting' },
      converted: { he: 'הומר', en: 'Converted' }
    };
    return this.lang.currentLanguage === 'he' ? labels[status].he : labels[status].en;
  }

  dismissHoogiTip() {
    // Hide the Hoogi assistant tip
    const hoogiTip = document.querySelector('.fixed.bottom-6.right-6') as HTMLElement;
    if (hoogiTip) {
      hoogiTip.style.display = 'none';
    }
  }
}
