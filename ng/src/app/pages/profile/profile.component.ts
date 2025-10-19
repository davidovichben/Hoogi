import { Component, ViewChild, OnInit } from '@angular/core';
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
export class ProfileComponent implements OnInit {
  activeTab: 'details' | 'billing' = 'details';
  @ViewChild(ProfileDetailsComponent) profileDetailsComponent?: ProfileDetailsComponent;

  constructor(public lang: LanguageService) {}

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  setActiveTab(tab: 'details' | 'billing') {
    this.activeTab = tab;
  }

  goBack() {
    window.history.back();
  }
}
