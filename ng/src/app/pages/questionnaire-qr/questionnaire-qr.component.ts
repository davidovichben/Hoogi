import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-questionnaire-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questionnaire-qr.component.html',
  styleUrls: ['./questionnaire-qr.component.sass']
})
export class QuestionnaireQrComponent implements OnInit {
  qrCodeDataUrl = '';
  questionnaireTitle = '';
  businessName = '';
  logoUrl = '';
  primaryColor = '#17A2B8';
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    public lang: LanguageService
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.error = true;
      this.loading = false;
      return;
    }

    await this.loadQuestionnaireAndGenerateQR(token);
  }

  async loadQuestionnaireAndGenerateQR(token: string) {
    try {
      // Load questionnaire by token
      const { data: questionnaire, error: qError } = await this.supabaseService.client
        .from('questionnaires')
        .select('id, title, owner_id')
        .eq('token', token)
        .single();

      if (qError || !questionnaire) {
        console.error('Error loading questionnaire:', qError);
        this.error = true;
        this.loading = false;
        return;
      }

      this.questionnaireTitle = questionnaire.title || 'Questionnaire';

      // Load profile data for branding
      const { data: profile } = await this.supabaseService.client
        .from('profiles')
        .select('brand_primary, logo_url, business_name')
        .eq('id', questionnaire.owner_id)
        .single();

      if (profile) {
        this.primaryColor = profile.brand_primary || '#17A2B8';
        this.logoUrl = profile.logo_url || '';
        this.businessName = profile.business_name || '';
      }

      // Generate QR code that points to the form URL
      const formUrl = `${window.location.origin}/q/${token}`;
      const qrDataUrl = await QRCode.toDataURL(formUrl, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      this.qrCodeDataUrl = qrDataUrl;
      this.loading = false;
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.error = true;
      this.loading = false;
    }
  }

  downloadQRCode() {
    if (!this.qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = this.qrCodeDataUrl;
    link.download = `${this.questionnaireTitle || 'questionnaire'}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
