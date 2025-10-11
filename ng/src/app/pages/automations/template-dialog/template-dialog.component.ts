import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../core/services/language.service';

export interface TemplateFormData {
  name: string;
  type: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

export interface TemplateData {
  id: string;
  name: string;
  channel: string;
  type: string;
  isDefault: boolean;
  subject?: string;
  body?: string;
}

@Component({
  selector: 'app-template-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-dialog.component.html',
  styleUrl: './template-dialog.component.sass'
})
export class TemplateDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() editingTemplate: TemplateData | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<TemplateFormData>();

  showSupportedFields = false;

  formData: TemplateFormData = {
    name: '',
    type: 'standard',
    subject: '',
    body: '',
    isDefault: false
  };

  supportedFields = [
    { key: '{{lastName}}', label: 'lastName' },
    { key: '{{firstName}}', label: 'firstName' },
    { key: '{{leadSource}}', label: 'leadSource' },
    { key: '{{businessName}}', label: 'businessName' },
    { key: '{{date}}', label: 'date' }
  ];

  constructor(public lang: LanguageService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingTemplate'] && this.editingTemplate) {
      // Populate form with template data
      this.formData = {
        name: this.editingTemplate.name,
        type: this.getTypeFromLabel(this.editingTemplate.channel),
        subject: this.editingTemplate.subject || '',
        body: this.editingTemplate.body || '',
        isDefault: this.editingTemplate.isDefault
      };
    } else if (changes['isOpen'] && !this.isOpen) {
      // Reset when dialog closes
      this.resetForm();
    }
  }

  private getTypeFromLabel(label: string): string {
    if (label.includes('AI')) return 'ai';
    if (label.includes('מותאם') || label.includes('Custom')) return 'custom';
    return 'standard';
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onSave() {
    if (this.formData.name && this.formData.subject && this.formData.body) {
      this.save.emit({ ...this.formData });
      this.resetForm();
    }
  }

  toggleSupportedFields() {
    this.showSupportedFields = !this.showSupportedFields;
  }

  insertField(fieldKey: string) {
    this.formData.body += fieldKey;
  }

  private resetForm() {
    this.formData = {
      name: '',
      type: 'standard',
      subject: '',
      body: '',
      isDefault: false
    };
    this.showSupportedFields = false;
  }
}
