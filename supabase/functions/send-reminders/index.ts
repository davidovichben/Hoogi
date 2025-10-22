// supabase/functions/send-reminders/index.ts
// Scheduled Edge Function to send reminders to leads based on automation template settings

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationTemplate {
  id: string;
  name: string;
  message_type: 'personal' | 'ai';
  subject?: string;
  body: string;
  ai_message_length?: string;
  user_id: string;
  link_url?: string;
  image_url?: string;
  use_profile_logo?: boolean;
  use_profile_image?: boolean;
  include_reminder: boolean;
  reminder_days?: number;
  reminder_time?: string;
  reminder_status?: string;
  reminder_sub_status?: string;
  reminder_frequency?: string;
}

interface Distribution {
  id: string;
  questionnaire_id: string;
  automation_template_ids: Array<{
    template_id: string;
    channels: Array<'email' | 'whatsapp' | 'sms'>;
  }>;
  token: string;
  is_active: boolean;
}

interface Lead {
  id: string;
  questionnaire_id: string;
  distribution_token?: string;
  status?: string;
  sub_status?: string;
  answer_json: Record<string, any>;
  created_at: string;
  last_reminder_sent_at?: string;
}

// Schedule this function to run every hour using Deno.cron
Deno.cron("Send reminders every hour", "0 * * * *", async () => {
  console.log("🔔 [REMINDERS] Cron triggered - starting reminder check...");
  await processReminders();
});

async function processReminders() {

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Single query to get all leads that need reminders
    // This joins distributions with leads and checks if any template in the distribution has reminders enabled
    const { data: rawResults, error: queryError } = await supabase.rpc('get_leads_needing_reminders');

    if (queryError) {
      console.error("❌ [REMINDERS] Error fetching leads:", queryError);
      throw queryError;
    }

    if (!rawResults || rawResults.length === 0) {
      console.log("⏭️ [REMINDERS] No leads need reminders at this time");
      return new Response(JSON.stringify({ message: "No reminders to send" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 [REMINDERS] Found ${rawResults.length} lead(s) that may need reminders`);

    let remindersSent = 0;

    // Process each result
    for (const result of rawResults) {
      const lead = {
        id: result.lead_id,
        questionnaire_id: result.questionnaire_id,
        distribution_token: result.distribution_token,
        status: result.lead_status,
        sub_status: result.lead_sub_status,
        answer_json: result.answer_json,
        created_at: result.created_at,
        last_reminder_sent_at: result.last_reminder_sent_at
      } as Lead;

      const distribution = {
        id: result.distribution_id,
        questionnaire_id: result.questionnaire_id,
        automation_template_ids: result.automation_template_ids,
        token: result.distribution_token,
        is_active: result.is_active
      } as Distribution;

      // Check each template in the distribution
      for (const templateMapping of distribution.automation_template_ids) {
        const { template_id, channels } = templateMapping;

        // Load template
        const { data: template, error: tError } = await supabase
          .from('automation_templates')
          .select('*')
          .eq('id', template_id)
          .single();

        if (tError || !template || !template.include_reminder) {
          continue;
        }

        const tmpl = template as AutomationTemplate;

        // Check if status/sub_status matches (if specified in template)
        if (tmpl.reminder_status && lead.status !== tmpl.reminder_status) {
          continue;
        }

        if (tmpl.reminder_sub_status && lead.sub_status !== tmpl.reminder_sub_status) {
          continue;
        }

        // Check if reminder is due
        const shouldSendReminder = checkIfReminderDue(lead, tmpl);

        if (!shouldSendReminder) {
          continue;
        }

        console.log(`📤 [REMINDERS] Sending reminder to lead ${lead.id} using template ${tmpl.name}`);

        // Send reminder
        try {
          await sendReminderToLead(supabase, lead, tmpl, channels, distribution.questionnaire_id);

          // Update last_reminder_sent_at
          await supabase
            .from('leads')
            .update({ last_reminder_sent_at: new Date().toISOString() })
            .eq('id', lead.id);

          remindersSent++;
        } catch (error) {
          console.error(`❌ [REMINDERS] Error sending reminder to lead ${lead.id}:`, error);
        }
      }
    }

    console.log(`✅ [REMINDERS] Reminder check complete. Sent ${remindersSent} reminder(s)`);
    return remindersSent;

  } catch (error) {
    console.error("❌ [REMINDERS] Error:", error);
    throw error;
  }
}

// Also expose as HTTP endpoint for manual triggering
serve(async (req) => {
  console.log("🔔 [REMINDERS] HTTP request - starting reminder check...");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const remindersSent = await processReminders();

    return new Response(JSON.stringify({
      message: "Reminder check complete",
      remindersSent
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ [REMINDERS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function checkIfReminderDue(lead: Lead, template: AutomationTemplate): boolean {
  const now = new Date();
  const createdAt = new Date(lead.created_at);
  const lastReminderSent = lead.last_reminder_sent_at ? new Date(lead.last_reminder_sent_at) : null;

  // Calculate days since creation or last reminder
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLastReminder = lastReminderSent
    ? Math.floor((now.getTime() - lastReminderSent.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Check if reminder_days have passed
  const reminderDays = template.reminder_days || 1;

  if (!lastReminderSent) {
    // First reminder - check days since creation
    if (daysSinceCreation < reminderDays) {
      return false;
    }
  } else {
    // Subsequent reminders - check frequency
    if (template.reminder_frequency === 'custom-days') {
      if (daysSinceLastReminder === null || daysSinceLastReminder < reminderDays) {
        return false;
      }
    } else if (template.reminder_frequency === 'every-few-days') {
      // Default to 3 days for "every-few-days"
      if (daysSinceLastReminder === null || daysSinceLastReminder < 3) {
        return false;
      }
    }
  }

  // Check if current time matches reminder_time (if specified)
  if (template.reminder_time) {
    const currentHour = now.getHours();
    const reminderHour = parseInt(template.reminder_time.split(':')[0]);

    // Only send if within the same hour
    if (currentHour !== reminderHour) {
      return false;
    }
  }

  console.log(`✅ [REMINDERS] Lead ${lead.id} is due for reminder (days since creation: ${daysSinceCreation}, days since last: ${daysSinceLastReminder})`);
  return true;
}

async function sendReminderToLead(
  supabase: any,
  lead: Lead,
  template: AutomationTemplate,
  channels: Array<'email' | 'whatsapp' | 'sms'>,
  questionnaireId: string
) {
  // Load questionnaire
  const { data: questionnaire } = await supabase
    .from('questionnaires')
    .select('id, owner_id, title')
    .eq('id', questionnaireId)
    .single();

  if (!questionnaire) {
    throw new Error("Questionnaire not found");
  }

  // Load questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('order_index', { ascending: true });

  // Extract contact info
  const contact = extractContactInfo(lead.answer_json, questions || []);

  // Load owner profile
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('company, email, phone, website, image_url, logo_url, occupation, suboccupation, social_networks')
    .eq('id', questionnaire.owner_id)
    .single();

  if (!ownerProfile) {
    throw new Error("Owner profile not found");
  }

  // Send reminder based on template type
  if (template.message_type === 'personal' && template.body) {
    const subject = replaceVariables(template.subject || 'Reminder', contact, ownerProfile);
    const messageBody = replaceVariables(template.body, contact, ownerProfile);

    // Fix link URL
    let linkUrl = template.link_url ? replaceVariables(template.link_url, contact, ownerProfile) : null;
    if (linkUrl && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
      linkUrl = 'https://' + linkUrl;
    }

    const htmlEmail = buildEmailHTML(
      messageBody,
      template.use_profile_logo ? ownerProfile.logo_url : null,
      template.use_profile_image ? ownerProfile.image_url : null,
      linkUrl,
      template.image_url,
      ownerProfile.company || 'Our Team'
    );

    // Send on configured channels
    for (const channel of channels) {
      if (channel === 'email' && contact.email) {
        await sendAutomationEmail(supabase, contact.email, subject, htmlEmail, messageBody, ownerProfile.email);
      }
      // TODO: Add WhatsApp and SMS support
    }
  }
  // TODO: Add AI template support for reminders
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

function buildEmailHTML(
  messageBody: string,
  logoUrl: string | null,
  profileImageUrl: string | null,
  linkUrl: string | null,
  attachmentImageUrl: string | null,
  businessName: string
): string {
  const formattedBody = messageBody.replace(/\n/g, '<br>');

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" dir="rtl" lang="he">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px;">
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${profileImageUrl ? `
                  <td width="50%" align="right" valign="middle" style="padding: 10px;">
                    <img src="${profileImageUrl}" alt="Profile" width="100" height="100" style="border-radius: 50%; display: block; object-fit: cover;" />
                  </td>
                  ` : '<td width="50%"></td>'}
                  ${logoUrl ? `
                  <td width="50%" align="left" valign="middle" style="padding: 10px;">
                    <img src="${logoUrl}" alt="${businessName}" style="max-width: 200px; height: auto; display: block;" />
                  </td>
                  ` : '<td width="50%"></td>'}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; font-size: 18px; line-height: 1.8; color: #333333; text-align: right;">
              ${formattedBody}
            </td>
          </tr>
          ${attachmentImageUrl ? `
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <img src="${attachmentImageUrl}" alt="Attachment" style="width: 100%; max-width: 520px; height: auto; border-radius: 8px; display: block;" />
            </td>
          </tr>
          ` : ''}
          ${linkUrl ? `
          <tr>
            <td align="center" style="padding: 20px 40px;">
              <a href="${linkUrl}" style="display: inline-block; background-color: #199f3a; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">לחץ כאן</a>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: center; font-size: 14px; color: #666666; border-top: 1px solid #e0e0e0;">
              ${businessName}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendAutomationEmail(
  supabase: any,
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  replyTo?: string
): Promise<void> {
  try {
    console.log("📧 [REMINDER-EMAIL] Sending to:", to);

    const { data, error } = await supabase.functions.invoke('send-automation-email', {
      body: {
        to,
        subject,
        html: htmlBody,
        text: textBody,
        replyTo
      }
    });

    if (error) {
      console.error("❌ [REMINDER-EMAIL] Error:", error);
      throw error;
    }

    console.log("✅ [REMINDER-EMAIL] Sent successfully");
  } catch (error) {
    console.error("❌ [REMINDER-EMAIL] Error in sendAutomationEmail:", error);
  }
}
