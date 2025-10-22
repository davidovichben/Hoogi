import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Template {
  id: string;
  user_id: string;
  name: string;
  type: 'standard' | 'ai' | 'personal' | 'combined';

  // Legacy field (kept for backward compatibility)
  channel?: string;

  // New fields matching CustomerResponseTab structure
  message_type: 'ai' | 'personal' | 'combined';
  personal_message_length: 'short' | 'medium' | 'long';
  channels: string[]; // ['email', 'whatsapp']

  // Email/Message content
  subject: string;
  body: string;

  // AI Settings
  ai_prompt?: string;
  ai_position?: 'start' | 'end';
  ai_decide_enabled?: boolean;

  // Reminder Settings
  include_reminder: boolean;
  reminder_days?: number;
  reminder_time?: string;
  reminder_status?: string;
  reminder_sub_status?: string;

  // Design and Additions
  logo_url?: string;
  profile_image_url?: string;
  link_url?: string;
  use_profile_logo?: boolean;
  use_profile_image?: boolean;
  uploaded_image_url?: string;

  // Response type
  response_type: 'new_customer' | 'reminder';

  // System fields
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTemplateDto {
  name: string;
  type: 'standard' | 'ai' | 'personal' | 'combined';
  message_type: 'ai' | 'personal' | 'combined';
  personal_message_length?: 'short' | 'medium' | 'long';
  channels: string[];
  subject: string;
  body: string;

  // AI Settings
  ai_prompt?: string;
  ai_position?: 'start' | 'end';
  ai_decide_enabled?: boolean;

  // Reminder Settings
  include_reminder?: boolean;
  reminder_days?: number;
  reminder_time?: string;
  reminder_status?: string;
  reminder_sub_status?: string;

  // Design and Additions
  logo_url?: string;
  profile_image_url?: string;
  link_url?: string;
  use_profile_logo?: boolean;
  use_profile_image?: boolean;
  uploaded_image_url?: string;

  // Response type
  response_type: 'new_customer' | 'reminder';

  is_default: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  type?: 'standard' | 'ai' | 'personal' | 'combined';
  message_type?: 'ai' | 'personal' | 'combined';
  personal_message_length?: 'short' | 'medium' | 'long';
  channels?: string[];
  subject?: string;
  body?: string;

  // AI Settings
  ai_prompt?: string;
  ai_position?: 'start' | 'end';
  ai_decide_enabled?: boolean;

  // Reminder Settings
  include_reminder?: boolean;
  reminder_days?: number;
  reminder_time?: string;
  reminder_status?: string;
  reminder_sub_status?: string;

  // Design and Additions
  logo_url?: string;
  profile_image_url?: string;
  link_url?: string;
  use_profile_logo?: boolean;
  use_profile_image?: boolean;
  uploaded_image_url?: string;

  // Response type
  response_type?: 'new_customer' | 'reminder';

  is_default?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get all templates for the current user
   */
  async getTemplates(): Promise<Template[]> {
    const { data, error } = await this.supabase.client
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<Template | null> {
    const { data, error } = await this.supabase.client
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get the default template for the current user
   */
  async getDefaultTemplate(): Promise<Template | null> {
    const { data, error } = await this.supabase.client
      .from('templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No default template found
        return null;
      }
      console.error('Error fetching default template:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new template
   */
  async createTemplate(template: CreateTemplateDto): Promise<Template> {
    const user = this.supabase.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create templates');
    }

    // If this template is set as default, unset all other defaults first
    if (template.is_default) {
      await this.unsetAllDefaults();
    }

    const { data, error } = await this.supabase.client
      .from('templates')
      .insert({
        user_id: user.id,
        name: template.name,
        type: template.type,
        message_type: template.message_type,
        personal_message_length: template.personal_message_length || 'medium',
        channels: template.channels,
        subject: template.subject,
        body: template.body,

        // AI Settings
        ai_prompt: template.ai_prompt,
        ai_position: template.ai_position || 'start',
        ai_decide_enabled: template.ai_decide_enabled !== undefined ? template.ai_decide_enabled : true,

        // Reminder Settings
        include_reminder: template.include_reminder || false,
        reminder_days: template.reminder_days,
        reminder_time: template.reminder_time,
        reminder_status: template.reminder_status,
        reminder_sub_status: template.reminder_sub_status,

        // Design and Additions
        logo_url: template.logo_url,
        profile_image_url: template.profile_image_url,
        link_url: template.link_url,
        use_profile_logo: template.use_profile_logo !== undefined ? template.use_profile_logo : true,
        use_profile_image: template.use_profile_image || false,
        uploaded_image_url: template.uploaded_image_url,

        // Response type
        response_type: template.response_type,

        is_default: template.is_default
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, updates: UpdateTemplateDto): Promise<Template> {
    // If setting this as default, unset all other defaults first
    if (updates.is_default) {
      await this.unsetAllDefaults();
    }

    const { data, error } = await this.supabase.client
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Set a template as default (and unset all others)
   */
  async setAsDefault(id: string): Promise<Template> {
    await this.unsetAllDefaults();
    return this.updateTemplate(id, { is_default: true });
  }

  /**
   * Unset all default templates for the current user
   */
  private async unsetAllDefaults(): Promise<void> {
    const { error } = await this.supabase.client
      .from('templates')
      .update({ is_default: false })
      .eq('is_default', true);

    if (error) {
      console.error('Error unsetting default templates:', error);
      throw error;
    }
  }
}
