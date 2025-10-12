import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-template-demo-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-demo-dialog.component.html',
  styleUrls: ['./template-demo-dialog.component.sass']
})
export class TemplateDemoDialogComponent {
  @Input() isOpen = false;
  @Input() channel = '';
  @Input() templateType: 'standard' | 'ai' | 'personal' | 'combined' = 'standard';
  @Input() emailSubject = '';
  @Input() messageBody = '';
  @Input() customAiMessage = '';
  @Input() aiPosition: 'start' | 'middle' | 'end' = 'start';
  @Input() defaultMessageTitle = '';
  @Input() defaultMessageContent = '';

  @Output() closeDialog = new EventEmitter<void>();

  constructor(public lang: LanguageService) {}

  onClose() {
    this.closeDialog.emit();
  }

  getChannelName(channel: string): string {
    const keyMap: { [key: string]: string } = {
      general: 'automations.general',
      message: 'automations.message',
      whatsapp: 'automations.whatsapp',
      email: 'automations.email'
    };
    return this.lang.t(keyMap[channel] || 'automations.general');
  }

  getTemplateTypeName(): string {
    const keyMap: { [key: string]: string } = {
      standard: 'automations.standardTemplate',
      ai: 'templates.typeAI',
      personal: 'automations.personalFeedback',
      combined: 'automations.combinedAiPersonal'
    };
    return this.lang.t(keyMap[this.templateType] || 'automations.standardTemplate');
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
