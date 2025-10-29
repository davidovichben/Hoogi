import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LanguageService } from '../../core/services/language.service';
import * as QRCode from 'qrcode';
import { environment } from '../../../environments/environment';

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

    // Get src parameter from query params
    const srcParam = this.route.snapshot.queryParamMap.get('src');
    await this.loadQuestionnaireAndGenerateQR(token, srcParam);
  }

  async loadQuestionnaireAndGenerateQR(token: string, srcParam: string | null = null) {
    try {
      console.log('[QR] Loading questionnaire with token:', token);
      console.log('[QR] Environment siteUrl:', environment.siteUrl);

      const isDistributionToken = token.startsWith('d_');
      console.log('[QR] Is distribution token:', isDistributionToken);

      let questionnaire: any;
      let questionnaireOwnerId: string;

      if (isDistributionToken) {
        // Load distribution first to get questionnaire_id
        const { data: distribution, error: distError } = await this.supabaseService.client
          .from('distributions')
          .select('questionnaire_id, is_active')
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (distError || !distribution) {
          console.error('[QR] Distribution not found or inactive:', distError);
          this.error = true;
          this.loading = false;
          return;
        }

        console.log('[QR] Distribution found:', distribution);

        // Load questionnaire by ID from distribution
        const { data: qData, error: qError } = await this.supabaseService.client
          .from('questionnaires')
          .select('id, title, owner_id, is_active')
          .eq('id', distribution.questionnaire_id)
          .single();

        if (qError || !qData) {
          console.error('[QR] Error loading questionnaire:', qError);
          this.error = true;
          this.loading = false;
          return;
        }

        questionnaire = qData;
        questionnaireOwnerId = qData.owner_id;
      } else {
        // Load questionnaire by token (regular token)
        const { data: qData, error: qError } = await this.supabaseService.client
          .from('questionnaires')
          .select('id, title, owner_id, is_active')
          .eq('token', token)
          .single();

        if (qError || !qData) {
          console.error('[QR] Error loading questionnaire:', qError);
          this.error = true;
          this.loading = false;
          return;
        }

        questionnaire = qData;
        questionnaireOwnerId = qData.owner_id;
      }

      console.log('[QR] Questionnaire loaded:', questionnaire);

      // Check if questionnaire is active
      if (!questionnaire.is_active) {
        console.error('[QR] Questionnaire is not active');
        this.error = true;
        this.loading = false;
        return;
      }

      this.questionnaireTitle = questionnaire.title || 'Questionnaire';

      // Load profile data for branding
      const { data: profile } = await this.supabaseService.client
        .from('profiles')
        .select('brand_primary, logo_url, business_name')
        .eq('id', questionnaireOwnerId)
        .single();

      if (profile) {
        this.primaryColor = profile.brand_primary || '#17A2B8';
        this.logoUrl = profile.logo_url || '';
        this.businessName = profile.business_name || '';
      }

      // Generate QR code that points to the form URL (with src parameter)
      // Preserve the src parameter from the QR page URL, or default to 'qr'
      const src = srcParam || 'qr';
      const formUrl = `${environment.siteUrl}/q/${token}?src=${src}`;
      console.log('[QR] Generating QR code for URL:', formUrl);

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
      console.log('[QR] QR code generated successfully');
    } catch (error) {
      console.error('[QR] Error generating QR code:', error);
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
