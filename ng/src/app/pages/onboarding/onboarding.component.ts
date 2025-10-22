import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

interface OnboardingStep {
  number: number;
  icon: string;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  action: () => void;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.sass'
})
export class OnboardingComponent implements OnInit {
  completedSteps: number[] = [];

  get steps(): OnboardingStep[] {
    return [
      {
        number: 1,
        icon: 'user',
        title: this.lang.t('onboarding.step1.title'),
        description: this.lang.t('onboarding.step1.description'),
        bgColor: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-200',
        action: () => this.router.navigate(['/profile'])
      },
      {
        number: 2,
        icon: 'file-text',
        title: this.lang.t('onboarding.step2.title'),
        description: this.lang.t('onboarding.step2.description'),
        bgColor: 'from-purple-50 to-pink-50',
        borderColor: 'border-purple-200',
        action: () => this.router.navigate(['/dashboard'])
      },
      {
        number: 3,
        icon: 'message-square',
        title: this.lang.t('onboarding.step3.title'),
        description: this.lang.t('onboarding.step3.description'),
        bgColor: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-200',
        action: () => this.router.navigate(['/questionnaires/new'])
      },
      {
        number: 4,
        icon: 'share',
        title: this.lang.t('onboarding.step4.title'),
        description: this.lang.t('onboarding.step4.description'),
        bgColor: 'from-green-50 to-teal-50',
        borderColor: 'border-green-200',
        action: () => this.router.navigate(['/distribution-hub'])
      }
    ];
  }

  constructor(
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  handleStepClick(stepNumber: number, action: () => void) {
    if (!this.completedSteps.includes(stepNumber)) {
      this.completedSteps = [...this.completedSteps, stepNumber];
    }
    action();
  }

  handleStart() {
    // Mark onboarding as completed and go to profile
    localStorage.setItem('onboarding_completed', 'true');
    this.router.navigate(['/profile']);
  }

  isCompleted(stepNumber: number): boolean {
    return this.completedSteps.includes(stepNumber);
  }

  getStepBgClass(stepNumber: number): string {
    const bgClasses = ['bg-blue', 'bg-purple', 'bg-orange', 'bg-green'];
    return bgClasses[stepNumber - 1] || '';
  }
}
