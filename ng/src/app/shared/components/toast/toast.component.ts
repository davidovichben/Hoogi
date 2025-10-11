import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 space-y-2" style="z-index: 9999;">
      <div *ngFor="let toast of toasts"
           [class]="getToastClass(toast.type)"
           class="px-6 py-3 rounded-lg shadow-lg animate-slide-in">
        <p class="text-sm font-medium">{{ toast.message }}</p>
      </div>
    </div>
  `,
  styles: []
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toasts.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  getToastClass(type: Toast['type']): string {
    const baseClass = 'text-white';
    switch (type) {
      case 'success':
        return `${baseClass} bg-green-600`;
      case 'error':
        return `${baseClass} bg-red-600`;
      case 'warning':
        return `${baseClass} bg-yellow-600`;
      case 'info':
      default:
        return `${baseClass} bg-blue-600`;
    }
  }
}
