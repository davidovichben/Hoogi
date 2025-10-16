import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { LucideAngularModule, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.sass']
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  // Icon references
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly AlertCircleIcon = AlertCircle;
  readonly InfoIcon = Info;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toasts.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  getToastConfig(type: Toast['type']) {
    switch (type) {
      case 'success':
        return {
          icon: this.CheckCircleIcon,
          bgGradient: 'bg-gradient-to-r from-green-50 to-green-100',
          border: 'border-green-200',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: this.AlertTriangleIcon,
          bgGradient: 'bg-gradient-to-r from-red-50 to-red-100',
          border: 'border-red-200',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: this.AlertCircleIcon,
          bgGradient: 'bg-gradient-to-r from-orange-50 to-orange-100',
          border: 'border-orange-200',
          iconColor: 'text-orange-600'
        };
      case 'info':
      default:
        return {
          icon: this.InfoIcon,
          bgGradient: 'bg-gradient-to-r from-cyan-50 to-cyan-100',
          border: 'border-cyan-200',
          iconColor: 'text-cyan-600'
        };
    }
  }
}
