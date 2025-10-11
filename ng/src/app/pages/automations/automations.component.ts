import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/services/language.service';
import { TemplateDialogComponent, TemplateFormData } from './template-dialog/template-dialog.component';
import { TemplateService, Template as TemplateModel } from '../../core/services/template.service';

interface ResponseTrigger {
  id: string;
  name: string;
  condition: string;
  status: string;
  timing: string;
}

interface Template {
  id: string;
  name: string;
  channel: string;
  type: string;
  isDefault: boolean;
  subject?: string;
  body?: string;
}

@Component({
  selector: 'app-automations',
  standalone: true,
  imports: [CommonModule, FormsModule, TemplateDialogComponent],
  templateUrl: './automations.component.html',
  styleUrl: './automations.component.sass'
})
export class AutomationsComponent implements OnInit {
  activeTab: 'templates' | 'triggers' | 'settings' = 'templates';
  isTemplateDialogOpen = false;
  editingTemplateId: string | null = null;

  newQuestionTrigger = {
    enabled: true,
    channels: {
      email: true,
      whatsapp: false,
      sms: false
    },
    sendAddress: 'immediate'
  };

  responseTriggers: ResponseTrigger[] = [
    {
      id: '1',
      name: 'תזכורת',
      condition: '',
      status: 'new',
      timing: 'immediate'
    }
  ];

  templates: Template[] = [];
  loading = false;

  constructor(
    public lang: LanguageService,
    private templateService: TemplateService
  ) {}

  async ngOnInit() {
    await this.loadTemplates();
  }

  async loadTemplates() {
    this.loading = true;
    try {
      const dbTemplates = await this.templateService.getTemplates();
      this.templates = dbTemplates.map(t => this.mapDbTemplateToComponent(t));
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      this.loading = false;
    }
  }

  private mapDbTemplateToComponent(dbTemplate: TemplateModel): Template {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      channel: this.getTypeLabel(dbTemplate.type),
      type: this.lang.currentLanguage === 'he' ? 'ערוץ דואל' : 'Email Channel',
      isDefault: dbTemplate.is_default,
      subject: dbTemplate.subject,
      body: dbTemplate.body
    };
  }

  addTrigger() {
    const newTrigger: ResponseTrigger = {
      id: Date.now().toString(),
      name: this.lang.currentLanguage === 'he' ? 'תזכורת חדשה' : 'New Reminder',
      condition: '',
      status: 'new',
      timing: 'immediate'
    };
    this.responseTriggers.push(newTrigger);
  }

  removeTrigger(id: string) {
    this.responseTriggers = this.responseTriggers.filter(t => t.id !== id);
  }

  addTemplate() {
    this.editingTemplateId = null;
    this.isTemplateDialogOpen = true;
  }

  editTemplate(template: Template) {
    this.editingTemplateId = template.id;
    this.isTemplateDialogOpen = true;
  }

  onTemplateDialogClose() {
    this.isTemplateDialogOpen = false;
    this.editingTemplateId = null;
  }

  async onTemplateDialogSave(formData: TemplateFormData) {
    try {
      if (this.editingTemplateId) {
        // Update existing template
        await this.templateService.updateTemplate(this.editingTemplateId, {
          name: formData.name,
          type: formData.type as 'standard' | 'ai' | 'custom',
          channel: 'email',
          subject: formData.subject,
          body: formData.body,
          is_default: formData.isDefault
        });
      } else {
        // Create new template
        await this.templateService.createTemplate({
          name: formData.name,
          type: formData.type as 'standard' | 'ai' | 'custom',
          channel: 'email',
          subject: formData.subject,
          body: formData.body,
          is_default: formData.isDefault
        });
      }

      // Reload templates
      await this.loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert(this.lang.currentLanguage === 'he' ? 'שגיאה בשמירת התבנית' : 'Error saving template');
    } finally {
      this.isTemplateDialogOpen = false;
      this.editingTemplateId = null;
    }
  }

  private getTypeLabel(type: string): string {
    const types: { [key: string]: { he: string; en: string } } = {
      standard: { he: 'סוג סטנדרטי', en: 'Standard Type' },
      ai: { he: 'סוג AI', en: 'AI Type' },
      custom: { he: 'סוג מותאם אישית', en: 'Custom Type' }
    };
    return this.lang.currentLanguage === 'he' ? types[type].he : types[type].en;
  }

  async removeTemplate(id: string) {
    const confirmed = confirm(
      this.lang.currentLanguage === 'he'
        ? 'האם אתה בטוח שברצונך למחוק תבנית זו?'
        : 'Are you sure you want to delete this template?'
    );

    if (!confirmed) return;

    try {
      await this.templateService.deleteTemplate(id);
      await this.loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(this.lang.currentLanguage === 'he' ? 'שגיאה במחיקת התבנית' : 'Error deleting template');
    }
  }

  async setDefaultTemplate(id: string) {
    try {
      await this.templateService.setAsDefault(id);
      await this.loadTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
      alert(this.lang.currentLanguage === 'he' ? 'שגיאה בהגדרת ברירת מחדל' : 'Error setting default template');
    }
  }

  get currentEditingTemplate(): Template | null {
    if (!this.editingTemplateId) return null;
    return this.templates.find(t => t.id === this.editingTemplateId) || null;
  }
}
