import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-billing.component.html',
  styleUrl: './profile-billing.component.sass'
})
export class ProfileBillingComponent implements OnInit {

  constructor(
    public lang: LanguageService,
    private supabaseService: SupabaseService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Load billing data
  }
}
