// supabase/functions/on-new-lead/index.ts
// Deno Edge Function – triggered by DB on lead INSERT via webhook
// Handles automation emails based on questionnaire automation_template_id

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type LeadRecord = {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  questionnaire_id?: string | null;
  client_name?: string | null;
  answer_json?: Record<string, any> | null;
  created_at?: string;
  [k: string]: unknown;
};

type TriggerPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: LeadRecord;
};

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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const INCOMING_SECRET = Deno.env.get("INCOMING_WEBHOOK_SECRET") ?? "";

function assertSignature(req: Request) {
  if (!INCOMING_SECRET) return true; // Skip validation in dev
  const sig = req.headers.get("x-webhook-secret") || "";
  return sig === INCOMING_SECRET;
}

async function handleAutomation(lead: LeadRecord) {
  if (!lead.questionnaire_id || !lead.answer_json) {
    console.log("Lead missing questionnaire_id or answer_json, skipping automation");
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Query questionnaire to check if automation is enabled
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('id, owner_id, automation_template_id, title')
      .eq('id', lead.questionnaire_id)
      .single();

    if (qError || !questionnaire) {
      console.log("Questionnaire not found:", qError);
      return;
    }

    if (!questionnaire.automation_template_id) {
      console.log("No automation template configured for this questionnaire");
      return;
    }

    console.log("🤖 [AUTOMATION] Starting automation for lead:", lead.id);
    console.log("📋 [AUTOMATION] Template ID:", questionnaire.automation_template_id);

    // 2. Load automation template
    const { data: template, error: tError } = await supabase
      .from('automation_templates')
      .select('*')
      .eq('id', questionnaire.automation_template_id)
      .single();

    if (tError || !template) {
      console.error("❌ [AUTOMATION] Template not found:", tError);
      return;
    }

    console.log("✅ [AUTOMATION] Template loaded:", template.name);

    // 3. Load questions for this questionnaire
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', lead.questionnaire_id)
      .order('order_index', { ascending: true });

    if (questionsError || !questions) {
      console.error("❌ [AUTOMATION] Questions not found:", questionsError);
      return;
    }

    // 4. Extract contact information from answer_json
    const contact = extractContactInfo(lead.answer_json, questions);
    console.log("👤 [AUTOMATION] Contact extracted:", contact);

    if (!contact.email) {
      console.error("❌ [AUTOMATION] No email found in responses");
      return;
    }

    // 5. Load owner profile
    const { data: ownerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company, email, phone, website, image_url, logo_url')
      .eq('id', questionnaire.owner_id)
      .single();

    if (profileError) {
      console.error("❌ [AUTOMATION] Error loading owner profile:", profileError);
      return;
    }

    console.log("✅ [AUTOMATION] Owner profile loaded");

    // 6. Generate message based on template type
    const { subject, message } = generateMessage(
      template,
      contact,
      ownerProfile,
      questionnaire,
      lead.answer_json,
      questions
    );

    console.log("💬 [AUTOMATION] Generated message");
    console.log("  Subject:", subject);

    // 7. Send through configured channels
    if (template.channels.includes('email')) {
      await sendAutomationEmail(contact.email, subject, message, ownerProfile.email);
    }

    console.log("✅ [AUTOMATION] Automation completed successfully");
  } catch (error) {
    console.error("❌ [AUTOMATION] Error executing automation:", error);
  }
}

function extractContactInfo(answerJson: Record<string, any>, questions: any[]): {
  name: string;
  email: string;
  phone?: string;
} {
  const contact: { name: string; email: string; phone?: string } = {
    name: '',
    email: ''
  };

  // Extract from first 3 questions (name, email, phone)
  if (questions.length >= 1) {
    const nameValue = answerJson[questions[0].id];
    contact.name = Array.isArray(nameValue) ? nameValue.join(', ') : (nameValue || '');
  }

  if (questions.length >= 2) {
    const emailValue = answerJson[questions[1].id];
    contact.email = Array.isArray(emailValue) ? emailValue[0] : (emailValue || '');
  }

  if (questions.length >= 3) {
    const phoneValue = answerJson[questions[2].id];
    contact.phone = Array.isArray(phoneValue) ? phoneValue[0] : (phoneValue || '');
  }

  return contact;
}

function replaceVariables(
  template: string,
  contact: { name: string; email: string; phone?: string },
  ownerProfile: any
): string {
  return template
    .replace(/\{\{firstName\}\}/g, contact.name.split(' ')[0] || contact.name)
    .replace(/\{\{fullName\}\}/g, contact.name)
    .replace(/\{\{businessName\}\}/g, ownerProfile.company || ownerProfile.email?.split('@')[0] || 'Our Team')
    .replace(/\{\{email\}\}/g, contact.email)
    .replace(/\{\{phone\}\}/g, contact.phone || '');
}

function generateMessage(
  template: AutomationTemplate,
  contact: { name: string; email: string; phone?: string },
  ownerProfile: any,
  questionnaire: any,
  answerJson: Record<string, any>,
  questions: any[]
): { subject: string; message: string } {
  const businessName = ownerProfile.company || ownerProfile.email?.split('@')[0] || 'Our Team';
  const firstName = contact.name.split(' ')[0] || contact.name;

  // Always use template's email_subject and apply variable replacement
  const subject = replaceVariables(
    template.email_subject || 'Thank you for your response',
    contact,
    ownerProfile
  );

  let message = '';

  switch (template.template_type) {
    case 'standard':
      message = `Hello ${firstName},\n\nThank you for completing our questionnaire. Your submission has been received and we will get back to you soon.\n\nBest regards,\n${businessName}`;
      break;

    case 'personal':
      message = replaceVariables(template.message_body || 'Thank you for your response!', contact, ownerProfile);
      break;

    case 'ai':
      // AI message placeholder - can be enhanced with actual AI integration
      message = `Hello ${firstName},\n\nThank you for completing the questionnaire. Based on your responses, we will review your information and get back to you with personalized recommendations.\n\nBest regards,\n${businessName}`;
      break;

    case 'combined':
      const aiPart = `Hello ${firstName},\n\nThank you for your responses. We will review your information and provide personalized recommendations.`;
      const personalPart = replaceVariables(template.message_body || '', contact, ownerProfile);
      message = `${aiPart}\n\n---\n\n${personalPart}`;
      break;
  }

  return { subject, message };
}

async function sendAutomationEmail(
  to: string,
  subject: string,
  body: string,
  replyTo?: string
): Promise<void> {
  try {
    console.log("📧 [EMAIL] Sending automation email to:", to);

    // Convert plain text to HTML
    const htmlBody = body.replace(/\n/g, '<br>');

    // Create Supabase client to call the send-automation-email function
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase.functions.invoke('send-automation-email', {
      body: {
        to,
        subject,
        html: htmlBody,
        text: body,
        replyTo
      }
    });

    if (error) {
      console.error("❌ [EMAIL] Error sending email:", error);
      throw error;
    }

    console.log("✅ [EMAIL] Email sent successfully");
  } catch (error) {
    console.error("❌ [EMAIL] Error in sendAutomationEmail:", error);
    // Don't throw - continue even if email fails
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!assertSignature(req)) {
      return new Response("Forbidden", { status: 403 });
    }

    const payload = (await req.json()) as TriggerPayload;
    if (payload?.type !== "INSERT" || payload?.table !== "leads") {
      return new Response("Ignored", { status: 200 });
    }

    const lead = payload.record;

    // Handle automation in background
    await handleAutomation(lead);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return new Response("Internal Error", { status: 500 });
  }
});
