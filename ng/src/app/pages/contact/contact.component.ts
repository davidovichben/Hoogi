import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { SupabaseService } from '../../core/services/supabase.service';

interface ContactFormData {
  subject: string;
  name: string;
  email: string;
  message: string;
  file: File | null;
  url: string;
}

interface SubjectOption {
  value: string;
  label: string;
}

interface CountryOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.sass']
})
export class ContactComponent implements OnDestroy {
  formData: ContactFormData = {
    subject: '',
    name: '',
    email: '',
    message: '',
    file: null,
    url: ''
  };

  isSubmitting = false;
  filePreview: string | null = null;
  userCountry = 'ישראל';

  availableCountries: CountryOption[] = [
    { value: 'ישראל', label: 'ישראל' },
    { value: 'USA', label: 'USA' },
    { value: 'UK', label: 'UK' },
    { value: 'קנדה', label: 'קנדה' },
    { value: 'אוסטרליה', label: 'אוסטרליה' },
  ];

  constructor(
    public lang: LanguageService,
    private router: Router,
    private toast: ToastService,
    private supabase: SupabaseService
  ) {}
  
  ngOnDestroy() {
    if (this.filePreview) {
      URL.revokeObjectURL(this.filePreview);
    }
  }

  getSubjectOptions(): SubjectOption[] {
    return [
      { value: 'technical', label: this.lang.t('contact.subjects.technical') },
      { value: 'customer', label: this.lang.t('contact.subjects.customer') },
      { value: 'payment', label: this.lang.t('contact.subjects.payment') },
      { value: 'bug', label: this.lang.t('contact.subjects.bug') },
      { value: 'feature', label: this.lang.t('contact.subjects.feature') },
      { value: 'feedback', label: this.lang.t('contact.subjects.feedback') },
      { value: 'usage', label: this.lang.t('contact.subjects.usage') },
      { value: 'general', label: this.lang.t('contact.subjects.general') }
    ];
  }

  onCountryChange() {
    // Reset subject when country changes
    this.formData.subject = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    // Clear previous preview
    if (this.filePreview) {
      URL.revokeObjectURL(this.filePreview);
      this.filePreview = null;
    }

    this.formData.file = file;

    // Generate preview for images and videos
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      this.filePreview = URL.createObjectURL(file);
    }
  }

  removeFile() {
    if (this.filePreview) {
      URL.revokeObjectURL(this.filePreview);
      this.filePreview = null;
    }
    this.formData.file = null;

    // Reset file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFileIcon(): string {
    if (!this.formData.file) return '';

    if (this.formData.file.type.startsWith('image/')) {
      return '🖼️';
    } else if (this.formData.file.type.startsWith('video/')) {
      return '🎥';
    } else if (this.formData.file.type === 'application/pdf') {
      return '📄';
    }
    return '📎';
  }

  getFileSizeMB(): string {
    if (!this.formData.file) return '';
    return (this.formData.file.size / 1024 / 1024).toFixed(2);
  }

  validateEmail(email: string): boolean {
    // Check for consecutive dots anywhere in the email
    if (/\.\./.test(email)) {
      return false;
    }
    // Check basic email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    // Additional check: ensure domain part doesn't have multiple consecutive dots
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }
    const domain = parts[1];
    // Check if domain has consecutive dots or starts/ends with a dot
    if (/\.\./.test(domain) || domain.startsWith('.') || domain.endsWith('.')) {
      return false;
    }
    return true;
  }

  validateForm(): boolean {
    if (!this.formData.subject) {
      this.toast.show(this.lang.t('contact.errors.subject'), 'error');
      return false;
    }

    if (!this.formData.name.trim()) {
      this.toast.show(this.lang.t('contact.errors.name'), 'error');
      return false;
    }

    if (!this.validateEmail(this.formData.email)) {
      this.toast.show(this.lang.t('contact.errors.email'), 'error');
      return false;
    }

    if (!this.formData.message.trim()) {
      this.toast.show(this.lang.t('contact.errors.message'), 'error');
      return false;
    }

    // URL validation - allow URLs with or without http/https
    if (this.formData.url && this.formData.url.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!urlPattern.test(this.formData.url.trim())) {
        this.toast.show(this.lang.t('contact.errors.url'), 'error');
        return false;
      }
    }

    return true;
  }

  async onSubmit() {
    if (!this.validateForm()) return;

    this.isSubmitting = true;

    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let fileType: string | null = null;

      // Step 1: Upload file to Supabase storage if exists
      if (this.formData.file) {
        const file = this.formData.file;
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await this.supabase.client.storage
          .from('contact-attachments')
          .upload(uniqueFileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          this.toast.show(this.lang.t('contact.errors.fileUpload'), 'error');
          this.isSubmitting = false;
          return;
        }

        filePath = uploadData.path;
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
      }

      // Step 2: Call Supabase Edge Function to submit form and send email
      const { data: functionData, error: functionError } = await this.supabase.client.functions
        .invoke('submit-contact-form', {
          body: {
            country: this.userCountry,
            subject: this.formData.subject,
            name: this.formData.name,
            email: this.formData.email,
            message: this.formData.message,
            url: this.formData.url || null,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            file_path: filePath
          }
        });

      if (functionError) {
        console.error('Error calling submit-contact-form function:', functionError);
        this.toast.show(this.lang.t('contact.errors.submit'), 'error');
        this.isSubmitting = false;
        return;
      }

      console.log('Contact form submitted successfully:', functionData);

      this.toast.show(this.lang.t('contact.success'), 'success');

      // Clean up
      if (this.filePreview) {
        URL.revokeObjectURL(this.filePreview);
        this.filePreview = null;
      }

      // Reset form
      this.formData = {
        subject: '',
        name: '',
        email: '',
        message: '',
        file: null,
        url: ''
      };

      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      this.toast.show(this.lang.t('contact.errors.submit'), 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

}
