import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { ProfileDetailsComponent } from './profile-details.component';
import { ProfileBillingComponent } from './profile-billing.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ProfileDetailsComponent, ProfileBillingComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.sass'
})
export class ProfileComponent {
  activeTab: 'details' | 'billing' = 'details';
  @ViewChild(ProfileDetailsComponent) profileDetailsComponent?: ProfileDetailsComponent;

  constructor(public lang: LanguageService) {}

  setActiveTab(tab: 'details' | 'billing') {
    this.activeTab = tab;
  }

  goBack() {
    window.history.back();
  }
}
