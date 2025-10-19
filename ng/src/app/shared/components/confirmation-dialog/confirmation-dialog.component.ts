import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../core/services/language.service';
import { LucideAngularModule, AlertCircle } from 'lucide-angular';

export interface ConfirmationDialogData {
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="confirmation-dialog" [dir]="lang.currentLanguage === 'he' ? 'rtl' : 'ltr'">
      <div class="dialog-card" [ngClass]="getDialogConfig().bgGradient + ' ' + getDialogConfig().border">
        <div class="dialog-content">
          <!-- Icon -->
          <div class="dialog-icon-wrapper"
               [ngClass]="getDialogConfig().bgGradient + ' ' + getDialogConfig().border">
            <lucide-icon
              [img]="AlertCircleIcon"
              [size]="20"
              [ngClass]="getDialogConfig().iconColor">
            </lucide-icon>
          </div>

          <!-- Message -->
          <div class="dialog-message">
            <p class="dialog-text">{{ data.message }}</p>
          </div>

          <!-- Avatar -->
          <div class="dialog-avatar">
            <img src="/img/logo.png" alt="iHoogi" class="avatar-img">
          </div>
        </div>

        <!-- Actions -->
        <div class="dialog-actions">
          <button
            class="cancel-btn"
            (click)="onCancel()">
            {{ data.cancelText || lang.t('common.cancel') }}
          </button>
          <button
            class="confirm-btn"
            [ngClass]="getDialogConfig().confirmBtnClass"
            (click)="onConfirm()">
            {{ data.confirmText || lang.t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog
      position: relative

    .dialog-card
      border-width: 1px
      border-radius: 0.75rem
      padding: 1.5rem
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
      backdrop-filter: blur(8px)
      min-width: 320px
      max-width: 500px

      @media (max-width: 640px)
        padding: 1rem
        min-width: 280px

    .dialog-content
      display: flex
      align-items: flex-start
      gap: 0.75rem
      margin-bottom: 1.5rem

    .dialog-icon-wrapper
      padding: 0.5rem
      border-radius: 0.5rem
      border-width: 1px
      display: flex
      align-items: center
      justify-content: center
      flex-shrink: 0

    .dialog-message
      flex: 1
      display: flex
      align-items: center
      min-height: 2.5rem

    .dialog-text
      font-size: 0.875rem
      line-height: 1.5rem
      color: #6B7280
      margin: 0
      white-space: pre-wrap

      @media (max-width: 640px)
        font-size: 0.8125rem

    .dialog-avatar
      width: 3rem
      height: 3rem
      border-radius: 50%
      background: rgba(139, 92, 246, 0.1)
      border: 1px solid rgba(139, 92, 246, 0.2)
      display: flex
      align-items: center
      justify-content: center
      flex-shrink: 0

      @media (max-width: 640px)
        width: 2.5rem
        height: 2.5rem

    .avatar-img
      width: 2rem
      height: 2rem
      object-fit: contain

      @media (max-width: 640px)
        width: 1.75rem
        height: 1.75rem

    .dialog-actions
      display: flex
      gap: 0.75rem
      justify-content: flex-end

      @media (max-width: 640px)
        flex-direction: column-reverse
        gap: 0.5rem

    .cancel-btn,
    .confirm-btn
      padding: 0.625rem 1.5rem
      border-radius: 0.5rem
      font-size: 0.875rem
      font-weight: 500
      cursor: pointer
      transition: all 0.2s
      border: none
      white-space: nowrap

      @media (max-width: 640px)
        width: 100%
        padding: 0.75rem

    .cancel-btn
      background: #f3f4f6
      color: #374151

      &:hover
        background: #e5e7eb

    .confirm-btn
      color: white

      &:hover
        opacity: 0.9
        transform: translateY(-1px)

      &:active
        transform: translateY(0)

    .confirm-btn-danger
      background: #EF4444

      &:hover
        background: #DC2626

    .confirm-btn-warning
      background: #F59E0B

      &:hover
        background: #D97706

    .confirm-btn-info
      background: #0891b2

      &:hover
        background: #0e7490

    // Tailwind-like utility classes for gradients and borders
    .bg-gradient-to-r
      background-image: linear-gradient(to right, var(--tw-gradient-stops))

    .from-orange-50
      --tw-gradient-from: #fff7ed
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 247, 237, 0))

    .to-orange-100
      --tw-gradient-to: #ffedd5

    .border-orange-200
      border-color: #fed7aa

    .text-orange-600
      color: #ea580c

    .from-red-50
      --tw-gradient-from: #fef2f2
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(254, 242, 242, 0))

    .to-red-100
      --tw-gradient-to: #fee2e2

    .border-red-200
      border-color: #fecaca

    .text-red-600
      color: #dc2626

    .from-cyan-50
      --tw-gradient-from: #ecfeff
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(236, 254, 255, 0))

    .to-cyan-100
      --tw-gradient-to: #cffafe

    .border-cyan-200
      border-color: #a5f3fc

    .text-cyan-600
      color: #0891b2
  `]
})
export class ConfirmationDialogComponent {
  readonly AlertCircleIcon = AlertCircle;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
    public lang: LanguageService
  ) {}

  getDialogConfig() {
    const type = this.data.type || 'warning';

    switch (type) {
      case 'danger':
        return {
          bgGradient: 'bg-gradient-to-r from-red-50 to-red-100',
          border: 'border-red-200',
          iconColor: 'text-red-600',
          confirmBtnClass: 'confirm-btn-danger'
        };
      case 'warning':
        return {
          bgGradient: 'bg-gradient-to-r from-orange-50 to-orange-100',
          border: 'border-orange-200',
          iconColor: 'text-orange-600',
          confirmBtnClass: 'confirm-btn-warning'
        };
      case 'info':
      default:
        return {
          bgGradient: 'bg-gradient-to-r from-cyan-50 to-cyan-100',
          border: 'border-cyan-200',
          iconColor: 'text-cyan-600',
          confirmBtnClass: 'confirm-btn-info'
        };
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
