import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LanguageService } from './language.service';

interface AutomationTemplate {
  id: string;
  name: string;
  template_type: 'standard' | 'ai' | 'personal' | 'combined';
  response_type: 'new_customer' | 'reminder';
  channels: string[];
  email_subject?: string;
  message_body?: string;
  custom_ai_message?: string;
  user_id: string;
}

interface QuestionnaireData {
  id: string;
  owner_id: string;
  title: string;
}

interface ResponseData {
  [questionId: string]: any;
}

interface LeadContact {
  name: string;
  email: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutomationService {
  constructor(
    private supabaseService: SupabaseService,
    private lang: LanguageService
  ) {}

  /**
   * Main entry point for automation execution
   * Called when a questionnaire response is submitted
   * Note: Automation templates are now only configured via distributions, not questionnaires
   */
  async executeAutomation(
    questionnaire: QuestionnaireData,
    responseData: ResponseData,
    questions: any[]
  ): Promise<void> {
    // Automation templates are now only configured via distributions, not questionnaires
    console.log('🤖 [AUTOMATION] Automation execution disabled - templates are managed via distribution hub');
    return;
  }

  /**
   * Load automation template from database
   */
  private async loadAutomationTemplate(templateId: string): Promise<AutomationTemplate | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('automation_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading automation template:', error);
      return null;
    }
  }

  /**
   * Load owner profile for template variables
   */
  private async loadOwnerProfile(ownerId: string): Promise<any> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('company, email, phone, website, image_url, logo_url')
        .eq('id', ownerId)
        .single();

      if (error) throw error;
      return data || {};
    } catch (error) {
      console.error('Error loading owner profile:', error);
      return {};
    }
  }

  /**
   * Extract contact information from response data
   * Assumes first 3 questions are: name, email, phone
   */
  private extractContactInfo(responseData: ResponseData, questions: any[]): LeadContact {
    const contact: LeadContact = {
      name: '',
      email: ''
    };

    if (questions.length >= 1) {
      const nameValue = responseData[questions[0].id];
      contact.name = Array.isArray(nameValue) ? nameValue.join(', ') : (nameValue || '');
    }

    if (questions.length >= 2) {
      const emailValue = responseData[questions[1].id];
      contact.email = Array.isArray(emailValue) ? emailValue[0] : (emailValue || '');
    }

    if (questions.length >= 3) {
      const phoneValue = responseData[questions[2].id];
      contact.phone = Array.isArray(phoneValue) ? phoneValue[0] : (phoneValue || '');
    }

    return contact;
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(
    template: string,
    contact: LeadContact,
    ownerProfile: any
  ): string {
    return template
      .replace(/\{\{firstName\}\}/g, contact.name.split(' ')[0] || contact.name)
      .replace(/\{\{fullName\}\}/g, contact.name)
      .replace(/\{\{businessName\}\}/g, ownerProfile.company || ownerProfile.email?.split('@')[0] || 'Our Team')
      .replace(/\{\{email\}\}/g, contact.email)
      .replace(/\{\{phone\}\}/g, contact.phone || '');
  }

  /**
   * Generate standard template message
   */
  private async generateStandardMessage(
    contact: LeadContact,
    ownerProfile: any,
    questionnaire: QuestionnaireData
  ): Promise<string> {
    const businessName = ownerProfile.company || ownerProfile.email?.split('@')[0] || 'Our Team';
    const firstName = contact.name.split(' ')[0] || contact.name;

    return this.lang.currentLanguage === 'he'
      ? `שלום ${firstName},\n\nתודה שמילאת את השאלון שלנו. פנייתך התקבלה ואנו נחזור אליך בהקדם.\n\nבברכה,\n${businessName}`
      : `Hello ${firstName},\n\nThank you for completing our questionnaire. Your submission has been received and we will get back to you soon.\n\nBest regards,\n${businessName}`;
  }

  /**
   * Generate personal template message
   */
  private generatePersonalMessage(
    template: AutomationTemplate,
    contact: LeadContact,
    ownerProfile: any
  ): string {
    const messageBody = template.message_body || 'Thank you for your response!';
    return this.replaceVariables(messageBody, contact, ownerProfile);
  }

  /**
   * Generate AI-powered message based on responses
   */
  private async generateAIMessage(
    template: AutomationTemplate,
    responseData: ResponseData,
    questions: any[],
    contact: LeadContact,
    ownerProfile: any
  ): Promise<string> {
    // TODO: Integrate with your AI service (OpenAI, Claude, etc.)
    // For now, return a placeholder with context

    const businessName = ownerProfile.company || 'Our Team';
    const firstName = contact.name.split(' ')[0] || contact.name;

    // Build context from responses
    let responseContext = '';
    questions.slice(3).forEach(question => { // Skip first 3 (name, email, phone)
      const answer = responseData[question.id];
      if (answer) {
        const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
        responseContext += `\nQ: ${question.question_text}\nA: ${answerText}\n`;
      }
    });

    // Placeholder for AI-generated response
    // In production, this would call an AI API with the custom_ai_message as instructions
    const aiInstructions = template.custom_ai_message || 'Generate a personalized response';

    return this.lang.currentLanguage === 'he'
      ? `שלום ${firstName},\n\nתודה על מילוי השאלון. בהתבסס על תשובותיך, אנו ממליצים...\n\n[הודעה מותאמת אישית על פי ${aiInstructions}]\n\nנשמח לעמוד לשירותך,\n${businessName}`
      : `Hello ${firstName},\n\nThank you for completing the questionnaire. Based on your responses, we recommend...\n\n[Personalized message based on ${aiInstructions}]\n\nBest regards,\n${businessName}`;
  }

  /**
   * Generate combined AI and personal message
   */
  private async generateCombinedMessage(
    template: AutomationTemplate,
    responseData: ResponseData,
    questions: any[],
    contact: LeadContact,
    ownerProfile: any
  ): Promise<string> {
    const aiPart = await this.generateAIMessage(template, responseData, questions, contact, ownerProfile);
    const personalPart = this.replaceVariables(
      template.message_body || '',
      contact,
      ownerProfile
    );

    // Combine based on AI position (if configured)
    // For now, AI first, then personal
    return `${aiPart}\n\n---\n\n${personalPart}`;
  }

  /**
   * Send message through configured channels
   */
  private async sendThroughChannels(
    channels: string[],
    contact: LeadContact,
    subject: string,
    message: string,
    ownerProfile: any
  ): Promise<void> {
    const sendPromises: Promise<void>[] = [];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          sendPromises.push(this.sendEmail(contact.email, subject, message, ownerProfile));
          break;

        case 'whatsapp':
          if (contact.phone) {
            sendPromises.push(this.sendWhatsApp(contact.phone, message));
          }
          break;

        case 'message':
        case 'general':
          // For SMS or other channels, implement as needed
          console.log(`Channel ${channel} not yet implemented`);
          break;
      }
    }

    await Promise.allSettled(sendPromises);
  }

  /**
   * Send email via Supabase Edge Function or external service
   */
  private async sendEmail(
    to: string,
    subject: string,
    body: string,
    ownerProfile: any
  ): Promise<void> {
    try {
      console.log('📧 [EMAIL] Preparing to send email...');
      console.log('  To:', to);
      console.log('  Subject:', subject);
      console.log('  ReplyTo:', ownerProfile.email);

      // Convert plain text to HTML
      const htmlBody = body.replace(/\n/g, '<br>');

      // Call Supabase Edge Function
      console.log('🔧 [EMAIL] Calling Edge Function: send-automation-email');
      const { data, error } = await this.supabaseService.client.functions.invoke('send-automation-email', {
        body: {
          to,
          subject,
          html: htmlBody,
          text: body,
          replyTo: ownerProfile.email
        }
      });

      if (error) {
        console.error('❌ [EMAIL] Error from email function:', error);
        console.log('ℹ️ [EMAIL] Edge Function might not be deployed. Email details:');
        console.log('  To:', to);
        console.log('  Subject:', subject);
        console.log('  Body:', body);
        console.log('📝 [EMAIL] To deploy: supabase functions deploy send-automation-email');
        throw error;
      }

      console.log('✅ [EMAIL] Email sent successfully:', data);
    } catch (error: any) {
      console.error('❌ [EMAIL] Error sending email:', error);
      console.log('ℹ️ [EMAIL] Email that would have been sent:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('ReplyTo:', ownerProfile.email);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(body);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // Don't throw - let automation continue even if email fails
    }
  }

  /**
   * Send WhatsApp message via external service
   */
  private async sendWhatsApp(phone: string, message: string): Promise<void> {
    try {
      // TODO: Implement WhatsApp sending via Twilio, WhatsApp Business API, etc.
      console.log('WhatsApp would be sent to:', phone);
      console.log('Message:', message);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  }
}
