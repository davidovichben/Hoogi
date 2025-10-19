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
export class ContactComponent implements OnInit, OnDestroy {
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

  ngOnInit() {
    // Detect user country based on language
    const browserLang = navigator.language || 'he';
    if (browserLang.startsWith('he') || browserLang.startsWith('ar')) {
      this.userCountry = 'ישראל';
    } else if (browserLang.startsWith('en')) {
      this.userCountry = 'USA';
    } else {
      this.userCountry = 'ישראל';
    }
  }

  ngOnDestroy() {
    if (this.filePreview) {
      URL.revokeObjectURL(this.filePreview);
    }
  }

  getSubjectOptions(): SubjectOption[] {
    // English subjects for USA, UK
    if (this.userCountry === 'USA' || this.userCountry === 'UK') {
      return [
        { value: 'תמיכה טכנית', label: 'תמיכה טכנית' },
        { value: 'שירות לקוחות', label: 'שירות לקוחות' },
        { value: 'בעיה בתשלום', label: 'בעיה בתשלום' },
        { value: 'דיווח על באג', label: 'דיווח על באג' },
        { value: 'בקשת פיצ\'ר', label: 'בקשת פיצ\'ר' },
        { value: 'משוב על המוצר', label: 'משוב על המוצר' },
        { value: 'שאלה על השימוש', label: 'שאלה על השימוש' },
        { value: 'שאלה כללית', label: 'שאלה כללית' }
      ];
    } else {
      // Hebrew subjects for all other countries
      return [
        { value: 'תמיכה טכנית', label: 'תמיכה טכנית' },
        { value: 'שירות לקוחות', label: 'שירות לקוחות' },
        { value: 'בעיה בתשלום', label: 'בעיה בתשלום' },
        { value: 'דיווח על באג', label: 'דיווח על באג' },
        { value: 'בקשת פיצ\'ר', label: 'בקשת פיצ\'ר' },
        { value: 'משוב על המוצר', label: 'משוב על המוצר' },
        { value: 'שאלה על השימוש', label: 'שאלה על השימוש' },
        { value: 'שאלה כללית', label: 'שאלה כללית' }
      ];
    }
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

  validateForm(): boolean {
    if (!this.formData.subject) {
      this.toast.show('שגיאה: יש לבחור נושא לפנייה', 'error');
      return false;
    }

    if (!this.formData.name.trim()) {
      this.toast.show('שגיאה: יש להזין שם מלא', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.toast.show('שגיאה: יש להזין כתובת אימייל תקינה', 'error');
      return false;
    }

    if (!this.formData.message.trim()) {
      this.toast.show('שגיאה: יש להזין תיאור לפנייה', 'error');
      return false;
    }

    // URL validation - allow URLs with or without http/https
    if (this.formData.url && this.formData.url.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!urlPattern.test(this.formData.url.trim())) {
        this.toast.show('שגיאה: יש להזין כתובת URL תקינה', 'error');
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
          this.toast.show('שגיאה בהעלאת הקובץ. אנא נסה שוב.', 'error');
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
        this.toast.show('שגיאה בשליחת הפנייה. אנא נסה שוב.', 'error');
        this.isSubmitting = false;
        return;
      }

      console.log('Contact form submitted successfully:', functionData);

      this.toast.show('🎉 הפנייה נשלחה בהצלחה! הפנייה שלך נשלחה לצוות המתאים. נחזור אליך בהקדם האפשרי.', 'success');

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
      this.toast.show('שגיאה בשליחת הפנייה. אנא נסה שוב.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

}
