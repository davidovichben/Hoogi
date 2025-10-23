import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';
import { LeadDetailsDialogComponent } from './lead-details-dialog.component';

interface Lead {
  id: string;
  questionnaire_id: string;
  questionnaire_title?: string; // Questionnaire name
  client_name: string;
  partner_id?: string;
  channel?: string; // Channel source: email, whatsapp, sms, website, etc.
  status: string;
  sub_status?: string;
  automations: string[]; // Array of automation types
  comments?: string;
  answer_json: any;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadDetailsDialogComponent],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.sass'
})
export class LeadsComponent implements OnInit {
  activeTab: 'leads' | 'answers-analytics' = 'leads';
  searchQuery = '';
  leads: Lead[] = [];
  filteredLeads: Lead[] = [];
  loading = false;
  openCommentPopup: string | null = null; // Track which lead's comment popup is open
  editingComment: string = ''; // Temporary storage for the comment being edited
  popupPosition = { top: '0px', left: '0px' }; // Position for the popup
  selectedLead: Lead | null = null; // Track which lead's details dialog is open
  selectedLeadIds: Set<string> = new Set(); // Track checked leads

  // Filter states
  filterText = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterChannel = '';
  filterStatus = '';
  filterQuestionnaire = '';
  filterQuestionnaireId = ''; // Filter by questionnaire ID from query params
  filterPartner = '';

  constructor(
    public lang: LanguageService,
    private supabase: SupabaseService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // Read query parameters and set filters
    this.route.queryParams.subscribe(params => {
      if (params['dateFrom']) {
        this.filterDateFrom = params['dateFrom'];
      }
      if (params['dateTo']) {
        this.filterDateTo = params['dateTo'];
      }
      if (params['status']) {
        this.filterStatus = params['status'];
      }
      if (params['questionnaireId']) {
        this.filterQuestionnaireId = params['questionnaireId'];
      }
      if (params['tab']) {
        // Set active tab from query parameter
        const tabParam = params['tab'];
        if (tabParam === 'answers-analytics' || tabParam === 'leads') {
          this.activeTab = tabParam;
        }
      }
    });

    await this.loadLeads();
  }

  toggleLeadSelection(leadId: string) {
    if (this.selectedLeadIds.has(leadId)) {
      this.selectedLeadIds.delete(leadId);
    } else {
      this.selectedLeadIds.add(leadId);
    }
  }

  toggleAllLeads() {
    if (this.isAllSelected()) {
      this.selectedLeadIds.clear();
    } else {
      this.filteredLeads.forEach(lead => this.selectedLeadIds.add(lead.id));
    }
  }

  isLeadSelected(leadId: string): boolean {
    return this.selectedLeadIds.has(leadId);
  }

  isAllSelected(): boolean {
    return this.filteredLeads.length > 0 &&
           this.filteredLeads.every(lead => this.selectedLeadIds.has(lead.id));
  }

  onQuestionnaireFilterChange() {
    // When user manually changes the questionnaire dropdown, clear the ID filter
    this.filterQuestionnaireId = '';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredLeads = this.leads.filter(lead => {
      // Text search across client name, partner name, and questionnaire name
      const matchesText = !this.filterText ||
        lead.client_name.toLowerCase().includes(this.filterText.toLowerCase()) ||
        (lead.partner_id && lead.partner_id.toLowerCase().includes(this.filterText.toLowerCase())) ||
        (lead.questionnaire_title && lead.questionnaire_title.toLowerCase().includes(this.filterText.toLowerCase()));

      // Date range filtering
      const leadDate = new Date(lead.created_at);
      const matchesDateFrom = !this.filterDateFrom || leadDate >= new Date(this.filterDateFrom);
      const matchesDateTo = !this.filterDateTo || leadDate <= new Date(this.filterDateTo);

      // Channel filtering
      const matchesChannel = !this.filterChannel || lead.channel === this.filterChannel;

      // Status filtering - handle comma-separated values (e.g., "new,in-progress")
      const matchesStatus = !this.filterStatus ||
        this.filterStatus.split(',').map(s => s.trim()).includes(lead.status);

      // Questionnaire filtering (by title from dropdown or by ID from query params)
      const matchesQuestionnaire = !this.filterQuestionnaire || lead.questionnaire_title === this.filterQuestionnaire;
      const matchesQuestionnaireId = !this.filterQuestionnaireId || lead.questionnaire_id === this.filterQuestionnaireId;

      // Partner filtering
      const matchesPartner = !this.filterPartner || lead.partner_id === this.filterPartner;

      return matchesText && matchesDateFrom && matchesDateTo && matchesChannel && matchesStatus && matchesQuestionnaire && matchesQuestionnaireId && matchesPartner;
    });
  }

  resetFilters() {
    this.filterText = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterChannel = '';
    this.filterStatus = '';
    this.filterQuestionnaire = '';
    this.filterQuestionnaireId = '';
    this.filterPartner = '';
    this.applyFilters();
  }

  exportToExcel() {
    // Check if any leads are selected
    if (this.selectedLeadIds.size === 0) {
      const message = this.lang.currentLanguage === 'he'
        ? 'נא לבחור לפחות ליד אחד לייצוא'
        : 'Please select at least one lead to export';
      this.toast.show(message, 'error');
      return;
    }

    // Filter only selected leads
    const selectedLeads = this.filteredLeads.filter(lead => this.selectedLeadIds.has(lead.id));

    const csvContent = [
      ['שם', 'אימייל', 'טלפון', 'תאריך', 'סטטוס', 'ערוץ', 'שאלון', 'שותף'],
      ...selectedLeads.map(lead => [
        lead.client_name,
        lead.email || '',
        lead.phone || '',
        this.getFormattedDateDDMMYYYY(lead.created_at),
        this.getStatusTranslation(lead.status),
        this.getChannelLabel(lead.channel || ''),
        lead.questionnaire_title || '',
        lead.partner_id ? lead.partner_id.substring(0, 8) + '...' : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    const message = this.lang.currentLanguage === 'he'
      ? `${selectedLeads.length} לידים יוצאו בהצלחה`
      : `${selectedLeads.length} leads exported successfully`;
    this.toast.show(message, 'success');
  }

  getUniqueQuestionnaires(): string[] {
    const titles = this.leads.map(l => l.questionnaire_title).filter((title): title is string => !!title);
    return Array.from(new Set(titles));
  }

  getUniquePartners(): string[] {
    const partners = this.leads.map(l => l.partner_id).filter((id): id is string => !!id);
    return Array.from(new Set(partners));
  }

  async loadLeads() {
    this.loading = true;
    try {
      const user = this.supabase.currentUser;
      if (!user) return;

      // Fetch leads directly from the leads table joined with questionnaires
      const { data, error } = await this.supabase.client
        .from('leads')
        .select(`
          *,
          questionnaires!inner(owner_id, title)
        `)
        .eq('questionnaires.owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform leads data to match our Lead interface
      this.leads = (data || []).map((lead: any) => {
        const answerJson = lead.answer_json || {};

        // Extract email and phone by searching through all answers
        let email = '';
        let phone = '';

        // Get all entries and check them by position (2nd and 3rd questions)
        const entries = Object.entries(answerJson);

        // Try to find email and phone by their position or pattern
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i];

          // Skip non-string values or URLs/files
          if (typeof value !== 'string' || value.startsWith('File:') || value.startsWith('Audio:') || value.startsWith('http')) {
            continue;
          }

          // Check if it's an email (contains @ and looks like email format)
          if (!email && value.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            email = value;
          }

          // Check if it's a phone (contains digits and matches phone pattern)
          if (!phone && /^[\d\s\-\(\)\+]+$/.test(value) && value.replace(/\D/g, '').length >= 9) {
            phone = value;
          }
        }

        // Normalize channel - only allow valid channels, otherwise set to 'other'
        const validChannels = ['email', 'whatsapp', 'sms', 'website', 'facebook', 'instagram'];
        let normalizedChannel = lead.channel || 'other';
        if (!validChannels.includes(normalizedChannel.toLowerCase())) {
          normalizedChannel = 'other';
        }

        return {
          id: lead.id,
          questionnaire_id: lead.questionnaire_id,
          questionnaire_title: lead.questionnaires?.title || 'Untitled',
          client_name: lead.client_name || 'Unknown',
          partner_id: lead.partner_id,
          channel: normalizedChannel,
          status: lead.status || 'new',
          sub_status: lead.sub_status || '',
          automations: Array.isArray(lead.automations) ? lead.automations : [],
          comments: lead.comments,
          answer_json: answerJson,
          email,
          phone,
          created_at: lead.created_at,
          updated_at: lead.updated_at
        };
      });

      // Initialize filtered leads
      this.applyFilters();

      // If filterQuestionnaireId is set from query params, populate the dropdown
      if (this.filterQuestionnaireId) {
        const questionnaire = this.leads.find(l => l.questionnaire_id === this.filterQuestionnaireId);
        if (questionnaire && questionnaire.questionnaire_title) {
          this.filterQuestionnaire = questionnaire.questionnaire_title;
          // Re-apply filters to ensure the dropdown filter is also applied
          this.applyFilters();
        }
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    window.history.back();
  }

  getAutomationsDisplay(automations: string[]): string {
    if (!automations || automations.length === 0) {
      return this.lang.t('leads.noAutomation');
    }
    return automations[0]; // Display first automation type
  }

  getAutomationClass(automation: string): string {
    switch (automation) {
      case 'AI':
        return 'automation-ai';
      case 'AI משולב אישי':
        return 'automation-ai-personal';
      case 'משוב אישי':
        return 'automation-personal';
      case 'סטנדרט':
        return 'automation-standard';
      default:
        return 'automation-default';
    }
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('he-IL');
  }

  getFormattedDateDDMMYYYY(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  getStatusTranslation(status: string): string {
    // Capitalize first letter only, keep the rest as-is (for in_progress)
    const statusKey = `leads.status${status.charAt(0).toUpperCase() + status.slice(1)}`;
    return this.lang.t(statusKey);
  }

  getSubStatusOptions(mainStatus: string): string[] {
    switch (mainStatus) {
      case 'in-progress':
        return ['נוצר קשר', 'הצעת מחיר נשלחה', 'ממתין למענה', 'שיחה מתוכננת'];
      case 'reminder':
        return ['לחזור בעוד שבוע', 'ממתין לאישור', 'לקוח ביקש להתעדכן'];
      case 'closed-success':
        return ['לקוח פעיל', 'שירות סופק', 'תשלום הושלם'];
      case 'not-relevant':
        return ['לא מעוניין', 'לא מתאים', 'ליד כפול', 'מידע חסר'];
      case 'no-answer':
        return ['ניסיונות כושלים', 'מספר לא תקין'];
      case 'cancelled':
        return ['ביטל אחרי הצעת מחיר', 'עבר לספק אחר'];
      default:
        return [];
    }
  }

  async onStatusChange(leadId: string, newStatus: string) {
    // Reset sub-status when main status changes
    const lead = this.leads.find(l => l.id === leadId);
    if (lead) {
      lead.sub_status = '';
    }
    await this.updateLeadStatus(leadId, newStatus);
  }

  async onSubStatusChange(leadId: string, event: Event) {
    const newSubStatus = (event.target as HTMLSelectElement).value;
    const lead = this.leads.find(l => l.id === leadId);
    if (lead) {
      lead.sub_status = newSubStatus;
    }
    await this.updateLeadSubStatus(leadId, newSubStatus);
  }

  async updateLeadSubStatus(leadId: string, newSubStatus: string) {
    try {
      const { error } = await this.supabase.client
        .from('leads')
        .update({
          sub_status: newSubStatus || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      const message = this.lang.currentLanguage === 'he'
        ? 'תת-הסטטוס עודכן בהצלחה'
        : 'Sub-status updated successfully';
      this.toast.show(message, 'success');
    } catch (error) {
      console.error('Error updating lead sub-status:', error);
      const message = this.lang.currentLanguage === 'he'
        ? 'שגיאה בעדכון תת-הסטטוס'
        : 'Error updating sub-status';
      this.toast.show(message, 'error');
    }
  }


  getChannelLabel(channel: string): string {
    if (!channel) return this.lang.t('leads.channelWebsite');
    const channelLabels: { [key: string]: string } = {
      'email': this.lang.t('leads.channelEmail'),
      'whatsapp': this.lang.t('leads.channelWhatsApp'),
      'sms': this.lang.t('leads.channelSMS'),
      'website': this.lang.t('leads.channelWebsite'),
      'facebook': this.lang.t('leads.channelFacebook'),
      'instagram': this.lang.t('leads.channelInstagram'),
      'other': this.lang.t('leads.channel_other')
    };
    // If channel is not in the valid list, return 'other'
    const validChannels = ['email', 'whatsapp', 'sms', 'website', 'facebook', 'instagram', 'other'];
    const normalizedChannel = channel.toLowerCase();
    return channelLabels[normalizedChannel] || this.lang.t('leads.channel_other');
  }

  toggleCommentPopup(event: Event, leadId: string, currentComment?: string) {
    if (this.openCommentPopup === leadId) {
      // Close popup
      this.openCommentPopup = null;
      this.editingComment = '';
    } else {
      // Calculate position based on button location
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();

      // Position popup below the button
      this.popupPosition = {
        top: `${rect.bottom + 8}px`,
        left: `${rect.left - 150 + (rect.width / 2)}px` // Center popup (300px width / 2 = 150)
      };

      // Open popup
      this.openCommentPopup = leadId;
      this.editingComment = currentComment || '';
    }
  }

  async saveComment(leadId: string) {
    try {
      const { error } = await this.supabase.client
        .from('leads')
        .update({
          comments: this.editingComment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Update local lead data
      const lead = this.leads.find(l => l.id === leadId);
      if (lead) {
        lead.comments = this.editingComment || undefined;
      }

      // Close popup
      this.openCommentPopup = null;
      this.editingComment = '';

      const message = this.lang.currentLanguage === 'he'
        ? 'ההערה נשמרה בהצלחה'
        : 'Comment saved successfully';
      this.toast.show(message, 'success');
    } catch (error) {
      console.error('Error saving comment:', error);
      const message = this.lang.currentLanguage === 'he'
        ? 'שגיאה בשמירת ההערה'
        : 'Error saving comment';
      this.toast.show(message, 'error');
    }
  }

  openLeadDetails(lead: Lead) {
    this.selectedLead = lead;
  }

  closeLeadDetails() {
    this.selectedLead = null;
  }

  async updateLeadStatus(leadId: string, newStatus: string) {
    try {
      const { error } = await this.supabase.client
        .from('leads')
        .update({
          status: newStatus,
          sub_status: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      const message = this.lang.currentLanguage === 'he'
        ? 'הסטטוס עודכן בהצלחה'
        : 'Status updated successfully';
      this.toast.show(message, 'success');
    } catch (error) {
      console.error('Error updating lead status:', error);
      const message = this.lang.currentLanguage === 'he'
        ? 'שגיאה בעדכון הסטטוס'
        : 'Error updating status';
      this.toast.show(message, 'error');
    }
  }

  getWhatsAppLink(phone?: string): string {
    if (!phone) return '#';
    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}`;
  }

  async deleteLead(leadId: string, clientName: string) {
    // Show confirmation dialog
    const confirmMessage = this.lang.currentLanguage === 'he'
      ? `האם אתה בטוח שברצונך למחוק את הליד של ${clientName}?`
      : `Are you sure you want to delete the lead for ${clientName}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await this.supabase.client
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      // Remove from local array
      this.leads = this.leads.filter(lead => lead.id !== leadId);
      this.applyFilters();

      const message = this.lang.currentLanguage === 'he'
        ? 'הליד נמחק בהצלחה'
        : 'Lead deleted successfully';
      this.toast.show(message, 'success');
    } catch (error) {
      console.error('Error deleting lead:', error);
      const message = this.lang.currentLanguage === 'he'
        ? 'שגיאה במחיקת הליד'
        : 'Error deleting lead';
      this.toast.show(message, 'error');
    }
  }
}
