import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Template {
  id: string;
  user_id: string;
  name: string;
  type: 'standard' | 'ai' | 'custom';
  channel: string;
  subject: string;
  body: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTemplateDto {
  name: string;
  type: 'standard' | 'ai' | 'custom';
  channel: string;
  subject: string;
  body: string;
  is_default: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  type?: 'standard' | 'ai' | 'custom';
  channel?: string;
  subject?: string;
  body?: string;
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
        channel: template.channel,
        subject: template.subject,
        body: template.body,
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
