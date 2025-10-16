import { Component } from '@angular/core';
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
export class OnboardingComponent {
  completedSteps: number[] = [];

  steps: OnboardingStep[] = [
    {
      number: 1,
      icon: 'user',
      title: 'צרו את הפרופיל שלכם',
      description: 'ספרו לנו מי אתם, מה העסק שלכם, ומה הסגנון שמתאים לכם – ככה iHoogi תדע לבנות עבורכם חוויה שיווקית מותאמת אישית. 💡',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      action: () => this.router.navigate(['/profile'])
    },
    {
      number: 2,
      icon: 'file-text',
      title: 'צרו שאלון חכם שמכין אתכם למכירה ממוקדת',
      description: 'השאלון הופך את המתעניינים ללידים חמים – הוא שואל, ממקד ומאפשר לכם להגיע לשיחת המכירה כשאתם כבר צעד אחד קדימה. 🎯',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      action: () => this.router.navigate(['/dashboard'])
    },
    {
      number: 3,
      icon: 'message-square',
      title: 'צרו תבנית מענה ללקוח',
      description: 'הגדירו איך iHoogi תדבר בשם העסק שלכם – באופן מקצועי, אישי ואוטומטי, שמייצר אמון וחיבור אמיתי עם הלקוח. 💬',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      action: () => this.router.navigate(['/questionnaires/new'])
    },
    {
      number: 4,
      icon: 'share',
      title: 'קבלו את הלינק שלכם לשיתוף',
      description: 'בחרו איך תרצו שהלקוחות ימלאו את השאלון: כ־צ\'אט אינטראקטיבי, טופס חכם, או קוד QR לסריקה – רק תבחרו, ושתפו בכל מקום שתרצו: וואטסאפ, אתר או רשתות חברתיות. 🚀',
      bgColor: 'from-green-50 to-teal-50',
      borderColor: 'border-green-200',
      action: () => this.router.navigate(['/distribution-hub'])
    }
  ];

  constructor(
    private router: Router,
    public lang: LanguageService
  ) {}

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
}
