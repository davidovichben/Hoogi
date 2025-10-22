import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

interface AutomationTemplate {
  id: string;
  user_id: string;
  name: string;
  message_type: string;
  body?: string;
  subject?: string;
  ai_message_length?: string;
  status?: string;
  sent_count?: number;
  usage_count?: number;
  last_used?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './templates-list.component.html',
  styleUrls: ['./templates-list.component.sass']
})
export class TemplatesListComponent implements OnInit {
  templates: AutomationTemplate[] = [];
  loading = false;
  showNotesDialog = false;
  selectedTemplate: AutomationTemplate | null = null;
  notes = '';

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private toast: ToastService,
    public lang: LanguageService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      this.loading = true;
      const user = this.supabase.currentUser;
      if (!user) return;

      const { data, error } = await this.supabase.client
        .from('automation_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.templates = data || [];
    } catch (e: any) {
      console.error('Error loading templates:', e);
      this.toast.show(this.lang.t('errors.loadTemplates'), 'error');
    } finally {
      this.loading = false;
    }
  }

  navigateToCreate() {
    this.router.navigate(['/automations'], { queryParams: { tab: 'create' } });
  }

  editTemplate(id: string) {
    this.router.navigate(['/automations/edit', id], { queryParams: { tab: 'create' } });
  }

  async deleteTemplate(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: this.lang.t('automations.deleteConfirm'),
        confirmText: this.lang.t('common.delete'),
        cancelText: this.lang.t('common.cancel'),
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;

      try {
        const { error } = await this.supabase.client
          .from('automation_templates')
          .delete()
          .eq('id', id);

        if (error) throw error;

        this.toast.show(this.lang.t('automations.templateDeleted'), 'success');
        this.loadTemplates();
      } catch (e: any) {
        console.error('Error deleting template:', e);
        this.toast.show(this.lang.t('errors.deleteTemplate'), 'error');
      }
    });
  }


  getTemplateTypeLabel(type: string): string {
    switch (type) {
      case 'personal': return this.lang.t('automations.types.personal');
      case 'ai': return this.lang.t('automations.types.ai');
      default: return this.lang.t('automations.types.personal');
    }
  }

  getChannelLabel(channels: string[]): string {
    if (!channels || channels.length === 0) return '';
    return channels.map(ch =>
      ch === 'email' ? this.lang.t('automations.channels.email') : this.lang.t('automations.channels.whatsapp')
    ).join(', ');
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'personal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ai': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getTotalTemplates(): number {
    return this.templates.length;
  }

  getActiveTemplates(): number {
    return this.templates.filter(t => t.status === 'active').length;
  }

  getTotalSent(): number {
    return this.templates.reduce((sum, t) => sum + (t.sent_count || 0), 0);
  }

  getAverageSent(): number {
    const total = this.getTotalSent();
    return this.templates.length > 0 ? Math.round(total / this.templates.length) : 0;
  }


  formatDate(dateString: string): string {
    if (!dateString) return this.lang.t('common.never');
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  }

  async handleDuplicate(template: AutomationTemplate) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: this.lang.t('automations.duplicateConfirm'),
        confirmText: this.lang.t('automations.duplicate'),
        cancelText: this.lang.t('common.cancel'),
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;

      try {
        const user = this.supabase.currentUser;
        if (!user) return;

        // Fetch the full template data to duplicate
        const { data: fullTemplate, error: fetchError } = await this.supabase.client
          .from('automation_templates')
          .select('*')
          .eq('id', template.id)
          .single();

        if (fetchError) throw fetchError;
        if (!fullTemplate) throw new Error('Template not found');

        // Remove fields that shouldn't be copied
        const { id, created_at, updated_at, sent_count, usage_count, last_used, ...templateData } = fullTemplate;

        // Create a copy of the template with a new name
        const { error } = await this.supabase.client
          .from('automation_templates')
          .insert({
            ...templateData,
            user_id: user.id,
            name: `${template.name} (עותק)`,
            sent_count: 0,
            usage_count: 0,
            last_used: null
          });

        if (error) throw error;

        this.toast.show(this.lang.t('automations.templateDuplicated'), 'success');
        this.loadTemplates();
      } catch (e: any) {
        console.error('Error duplicating template:', e);
        this.toast.show(this.lang.t('errors.duplicateTemplate'), 'error');
      }
    });
  }

  handleShowNotes(template: AutomationTemplate) {
    this.selectedTemplate = template;
    this.notes = template.notes || '';
    this.showNotesDialog = true;
  }

  closeNotesDialog() {
    this.showNotesDialog = false;
    this.selectedTemplate = null;
    this.notes = '';
  }

  async handleSaveNotes() {
    if (!this.selectedTemplate) return;

    try {
      const { error } = await this.supabase.client
        .from('automation_templates')
        .update({ notes: this.notes })
        .eq('id', this.selectedTemplate.id);

      if (error) throw error;

      // Update the template in the local array
      const template = this.templates.find(t => t.id === this.selectedTemplate!.id);
      if (template) {
        template.notes = this.notes;
      }

      this.toast.show(this.lang.t('automations.notesSaved'), 'success');
      this.closeNotesDialog();
    } catch (e: any) {
      console.error('Error saving notes:', e);
      this.toast.show(this.lang.t('errors.saveNotes'), 'error');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
