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
  message_type: 'personal' | 'ai';
  subject?: string;
  body: string;
  ai_message_length?: string;
  user_id: string;
  link_url?: string;
  image_url?: string;
  use_profile_logo?: boolean;
  use_profile_image?: boolean;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const INCOMING_SECRET = Deno.env.get("INCOMING_WEBHOOK_SECRET") ?? "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function assertSignature(req: Request) {
  if (!INCOMING_SECRET) return true; // Skip validation in dev
  const sig = req.headers.get("x-webhook-secret") || "";
  return sig === INCOMING_SECRET;
}

async function handleAutomation(lead: LeadRecord) {
  console.log("🚀 [AUTOMATION] handleAutomation called for lead:", lead.id);
  console.log("📊 [AUTOMATION] Lead data:", {
    questionnaire_id: lead.questionnaire_id,
    distribution_token: lead.distribution_token,
    has_answer_json: !!lead.answer_json,
    email: lead.email,
    name: lead.name
  });

  if (!lead.questionnaire_id || !lead.answer_json) {
    console.log("❌ [AUTOMATION] Lead missing questionnaire_id or answer_json, skipping automation");
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Query questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('id, owner_id, title, link_label')
      .eq('id', lead.questionnaire_id)
      .single();

    if (qError || !questionnaire) {
      console.log("Questionnaire not found:", qError);
      return;
    }

    // 2. Look up distribution - first try by distribution_token if available, then by questionnaire_id
    let distribution: any = null;
    let distError: any = null;

    if (lead.distribution_token) {
      // Lead came from a distribution link - look up by token
      console.log("🔍 [AUTOMATION] Looking up distribution by token:", lead.distribution_token);
      const { data, error } = await supabase
        .from('distributions')
        .select('id, automation_template_ids')
        .eq('token', lead.distribution_token)
        .eq('is_active', true)
        .single();

      distribution = data;
      distError = error;
    } else {
      // Legacy: look up by questionnaire_id
      console.log("🔍 [AUTOMATION] Looking up distribution by questionnaire_id:", lead.questionnaire_id);
      const { data, error } = await supabase
        .from('distributions')
        .select('id, automation_template_ids')
        .eq('questionnaire_id', lead.questionnaire_id)
        .eq('is_active', true)
        .single();

      distribution = data;
      distError = error;
    }

    if (distError || !distribution || !distribution.automation_template_ids) {
      console.log("❌ [AUTOMATION] No active distribution found");
      console.log("Distribution error:", distError);
      console.log("Distribution data:", distribution);
      return;
    }

    console.log("🤖 [AUTOMATION] Starting automation for lead:", lead.id);
    console.log("📋 [AUTOMATION] Distribution found with templates:", distribution.automation_template_ids);
    console.log("🔗 [AUTOMATION] Link text from questionnaire:", questionnaire.link_label || 'לחץ כאן (default)');

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

    // 5. Load owner profile with all necessary fields for AI
    const { data: ownerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company, email, phone, website, image_url, logo_url, occupation, suboccupation, social_networks')
      .eq('id', questionnaire.owner_id)
      .single();

    if (profileError) {
      console.error("❌ [AUTOMATION] Error loading owner profile:", profileError);
      return;
    }

    console.log("✅ [AUTOMATION] Owner profile loaded");

    // Track which channels have been used to prevent duplicates
    const sentChannels = new Set<string>();

    // 6. Process each template with its channels
    console.log("🔄 [AUTOMATION] Processing", distribution.automation_template_ids.length, "template(s)");

    for (const templateMapping of distribution.automation_template_ids) {
      const { template_id, channels } = templateMapping;
      console.log("🎯 [AUTOMATION] Loading template:", template_id, "with channels:", channels);

      // Load the template
      const { data: template, error: tError } = await supabase
        .from('automation_templates')
        .select('*')
        .eq('id', template_id)
        .single();

      if (tError || !template) {
        console.error("❌ [AUTOMATION] Template not found:", template_id, tError);
        continue;
      }

      console.log("✅ [AUTOMATION] Template loaded:", {
        name: template.name,
        message_type: template.message_type,
        has_body: !!template.body,
        has_subject: !!template.subject,
        use_profile_logo: template.use_profile_logo,
        use_profile_image: template.use_profile_image,
        link_url: template.link_url,
        image_url: template.image_url
      });
      console.log("👤 [AUTOMATION] Owner profile data:", {
        logo_url: ownerProfile.logo_url,
        image_url: ownerProfile.image_url,
        use_profile_logo: template.use_profile_logo,
        use_profile_image: template.use_profile_image
      });
      console.log("🖼️ [AUTOMATION] Template media data:", {
        link_url: template.link_url,
        image_url: template.image_url
      });

      // Only handle personal type templates for now
      console.log("🔍 [AUTOMATION] Checking template conditions - type:", template.message_type, "has_body:", !!template.body);

      if (template.message_type === 'personal' && template.body) {
        console.log("✅ [AUTOMATION] Template conditions met, preparing email...");
        const subject = replaceVariables(template.subject || 'Response from ' + (ownerProfile.company || 'our team'), contact, ownerProfile);
        const messageBody = replaceVariables(template.body, contact, ownerProfile);

        // Fix link URL - add https:// if missing
        let linkUrl = template.link_url ? replaceVariables(template.link_url, contact, ownerProfile) : null;
        if (linkUrl && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
          linkUrl = 'https://' + linkUrl;
        }

        // Log what we're passing to buildEmailHTML
        console.log("📧 [EMAIL BUILD] Building email with parameters:", {
          use_profile_logo: template.use_profile_logo,
          logo_url_raw: ownerProfile.logo_url,
          logo_url_to_use: template.use_profile_logo ? ownerProfile.logo_url : null,
          use_profile_image: template.use_profile_image,
          image_url_raw: ownerProfile.image_url,
          image_url_to_use: template.use_profile_image ? ownerProfile.image_url : null,
          link_url: linkUrl,
          attachment_image_url: template.image_url
        });

        // Build HTML email with template elements
        const htmlEmail = buildEmailHTML(
          messageBody,
          template.use_profile_logo ? ownerProfile.logo_url : null,
          template.use_profile_image ? ownerProfile.image_url : null,
          linkUrl,
          template.image_url,
          ownerProfile.company || 'Our Team',
          questionnaire.link_label || 'לחץ כאן'
        );

        // Send on each configured channel
        console.log("📤 [AUTOMATION] Sending on", channels.length, "channel(s):", channels);

        for (const channel of channels) {
          console.log("📬 [AUTOMATION] Processing channel:", channel);

          // Skip if this channel was already used
          if (sentChannels.has(channel)) {
            console.log("⏭️ [AUTOMATION] Skipping", channel, "- already sent in previous template");
            continue;
          }

          if (channel === 'email' && contact.email) {
            console.log("📧 [AUTOMATION] Sending email to:", contact.email);
            console.log("📧 [AUTOMATION] Email subject:", subject);
            await sendAutomationEmail(contact.email, subject, htmlEmail, messageBody, ownerProfile.email);
            sentChannels.add('email');
          } else if (channel === 'email' && !contact.email) {
            console.log("⚠️ [AUTOMATION] Email channel selected but no contact email");
          } else if (channel === 'whatsapp' && contact.phone) {
            console.log("📱 [WHATSAPP] Sending WhatsApp to:", contact.phone);
            await sendAutomationWhatsApp(contact.phone, messageBody, template.image_url || null);
            sentChannels.add('whatsapp');
          } else if (channel === 'whatsapp' && !contact.phone) {
            console.log("⚠️ [AUTOMATION] WhatsApp channel selected but no contact phone");
          } else if (channel === 'sms' && contact.phone) {
            console.log("💬 [SMS] Sending SMS to:", contact.phone);
            await sendAutomationSMS(contact.phone, messageBody);
            sentChannels.add('sms');
          } else if (channel === 'sms' && !contact.phone) {
            console.log("⚠️ [AUTOMATION] SMS channel selected but no contact phone");
          }
        }
      } else if (template.message_type === 'ai') {
        console.log("🤖 [AUTOMATION] Processing AI template:", template.name);

        // Generate AI response using the same parameters as the demo
        try {
          // Build social media links string
          let socialMediaLinks = '';
          if (ownerProfile?.social_networks) {
            const links = [];
            if (ownerProfile.social_networks.facebook) links.push(`Facebook: ${ownerProfile.social_networks.facebook}`);
            if (ownerProfile.social_networks.instagram) links.push(`Instagram: ${ownerProfile.social_networks.instagram}`);
            if (ownerProfile.social_networks.linkedin) links.push(`LinkedIn: ${ownerProfile.social_networks.linkedin}`);
            if (ownerProfile.social_networks.tiktok) links.push(`TikTok: ${ownerProfile.social_networks.tiktok}`);
            if (ownerProfile.social_networks.youtube) links.push(`YouTube: ${ownerProfile.social_networks.youtube}`);
            socialMediaLinks = links.join(', ');
          }

          // Build client answers from lead answer_json
          let clientAnswers = '';
          if (lead.answer_json && questions) {
            const answers = [];
            questions.forEach(q => {
              const answer = lead.answer_json[q.id];
              if (answer) {
                const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
                answers.push(`${q.question_text || 'Question'}: ${answerText}`);
              }
            });
            clientAnswers = answers.join('\n');
          }

          const aiRequestBody = {
            mainCategory: ownerProfile?.occupation || 'General Business',
            subcategory: ownerProfile?.suboccupation || 'Professional Services',
            businessDescription: ownerProfile?.company || '',
            websiteUrl: ownerProfile?.website || '',
            socialMediaLinks: socialMediaLinks,
            clientAnswers: clientAnswers || 'New customer inquiry',
            emailLength: template.ai_message_length || 'medium'
          };

          console.log("🔮 [AI] Generating AI response with length:", template.ai_message_length);
          console.log("📝 [AI] Request body:", JSON.stringify(aiRequestBody, null, 2));
          console.log("🔍 [AI] Validation check - mainCategory:", !!aiRequestBody.mainCategory, "subcategory:", !!aiRequestBody.subcategory, "clientAnswers:", !!aiRequestBody.clientAnswers);

          const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-ai-response', {
            body: aiRequestBody
          });

          console.log("📥 [AI] Response received:", { hasData: !!aiData, hasEmail: !!aiData?.email, error: aiError });
          if (aiData) {
            console.log("📧 [AI] AI data:", JSON.stringify(aiData, null, 2));
          }
          if (aiError) {
            console.error("❌ [AI] AI Error object:", JSON.stringify(aiError, null, 2));
          }

          if (aiError || !aiData?.email) {
            console.error("❌ [AI] Error generating AI response - using fallback");
            console.error("❌ [AI] aiError:", aiError);
            console.error("❌ [AI] aiData:", JSON.stringify(aiData, null, 2));
            // Continue with fallback message
            const fallbackMessage = `שלום ${contact.name.split(' ')[0]},\n\nתודה רבה על פנייתך. קיבלנו את המידע שלך ונחזור אליך בהקדם.\n\nבברכה,\n${ownerProfile.company || 'הצוות שלנו'}`;

            const subject = replaceVariables(template.subject || 'תודה על הפנייה', contact, ownerProfile);

            // Fix link URL
            let linkUrl = template.link_url ? replaceVariables(template.link_url, contact, ownerProfile) : null;
            if (linkUrl && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
              linkUrl = 'https://' + linkUrl;
            }

            const htmlEmail = buildEmailHTML(
              fallbackMessage,
              template.use_profile_logo ? ownerProfile.logo_url : null,
              template.use_profile_image ? ownerProfile.image_url : null,
              linkUrl,
              template.image_url,
              ownerProfile.company || 'Our Team',
              distribution.link_text || 'לחץ כאן'
            );

            console.log("📤 [AUTOMATION] Sending AI message (fallback) on", channels.length, "channel(s)");
            for (const channel of channels) {
              // Skip if this channel was already used
              if (sentChannels.has(channel)) {
                console.log("⏭️ [AUTOMATION] Skipping", channel, "- already sent in previous template");
                continue;
              }

              if (channel === 'email' && contact.email) {
                console.log("📧 [AUTOMATION] Sending AI email to:", contact.email);
                await sendAutomationEmail(contact.email, subject, htmlEmail, fallbackMessage, ownerProfile.email);
                sentChannels.add('email');
              } else if (channel === 'whatsapp' && contact.phone) {
                console.log("📱 [WHATSAPP] Sending AI WhatsApp (fallback) to:", contact.phone);
                await sendAutomationWhatsApp(contact.phone, fallbackMessage, template.image_url || null);
                sentChannels.add('whatsapp');
              } else if (channel === 'whatsapp' && !contact.phone) {
                console.log("⚠️ [AUTOMATION] WhatsApp channel selected but no contact phone");
              } else if (channel === 'sms' && contact.phone) {
                console.log("💬 [SMS] Sending AI SMS (fallback) to:", contact.phone);
                await sendAutomationSMS(contact.phone, fallbackMessage);
                sentChannels.add('sms');
              } else if (channel === 'sms' && !contact.phone) {
                console.log("⚠️ [AUTOMATION] SMS channel selected but no contact phone");
              }
            }
          } else {
            // Use AI-generated response
            const aiMessage = aiData.email;
            console.log("✅ [AI] AI response generated successfully");
            console.log("📝 [AI] AI email content:", aiMessage.substring(0, 200));

            const subject = replaceVariables(template.subject || 'תודה על הפנייה', contact, ownerProfile);
            console.log("📧 [AI] Email subject:", subject);

            // Fix link URL
            let linkUrl = template.link_url ? replaceVariables(template.link_url, contact, ownerProfile) : null;
            if (linkUrl && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
              linkUrl = 'https://' + linkUrl;
            }

            const htmlEmail = buildEmailHTML(
              aiMessage,
              template.use_profile_logo ? ownerProfile.logo_url : null,
              template.use_profile_image ? ownerProfile.image_url : null,
              linkUrl,
              template.image_url,
              ownerProfile.company || 'Our Team',
              distribution.link_text || 'לחץ כאן'
            );

            console.log("📤 [AUTOMATION] Sending AI message on", channels.length, "channel(s)");
            for (const channel of channels) {
              // Skip if this channel was already used
              if (sentChannels.has(channel)) {
                console.log("⏭️ [AUTOMATION] Skipping", channel, "- already sent in previous template");
                continue;
              }

              if (channel === 'email' && contact.email) {
                console.log("📧 [AUTOMATION] Sending AI email to:", contact.email);
                await sendAutomationEmail(contact.email, subject, htmlEmail, aiMessage, ownerProfile.email);
                sentChannels.add('email');
              } else if (channel === 'whatsapp' && contact.phone) {
                console.log("📱 [WHATSAPP] Sending AI WhatsApp to:", contact.phone);
                await sendAutomationWhatsApp(contact.phone, aiMessage, template.image_url || null);
                sentChannels.add('whatsapp');
              } else if (channel === 'whatsapp' && !contact.phone) {
                console.log("⚠️ [AUTOMATION] WhatsApp channel selected but no contact phone");
              } else if (channel === 'sms' && contact.phone) {
                console.log("💬 [SMS] Sending AI SMS to:", contact.phone);
                await sendAutomationSMS(contact.phone, aiMessage);
                sentChannels.add('sms');
              } else if (channel === 'sms' && !contact.phone) {
                console.log("⚠️ [AUTOMATION] SMS channel selected but no contact phone");
              }
            }
          }
        } catch (aiError) {
          console.error("❌ [AI] Error in AI template processing:", aiError);
        }
      } else {
        console.log("⏭️  [AUTOMATION] Skipping template - conditions not met. Type:", template.message_type, "Has body:", !!template.body);
      }
    }

    console.log("✅ [AUTOMATION] Automation completed successfully");
    console.log("📊 [AUTOMATION] Channels used in this automation:", Array.from(sentChannels).join(', '));
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

function getPublicUrl(url: string | null, urlType: string = 'unknown'): string | null {
  console.log(`🔗 [URL CONVERSION] Processing ${urlType}:`, { input: url });

  if (!url) {
    console.log(`🔗 [URL CONVERSION] ${urlType}: No URL provided, returning null`);
    return null;
  }

  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log(`🔗 [URL CONVERSION] ${urlType}: Already a full URL, returning as-is`);
    return url;
  }

  // If it's a Supabase storage path, convert to public URL
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  if (!SUPABASE_URL) {
    console.error(`❌ [URL CONVERSION] ${urlType}: SUPABASE_URL env var not set!`);
    return url;
  }

  // Remove leading slash if present
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${cleanPath}`;

  console.log(`🔗 [URL CONVERSION] ${urlType}: Converted to public URL:`, {
    original: url,
    cleaned: cleanPath,
    result: publicUrl
  });

  return publicUrl;
}

function buildEmailHTML(
  messageBody: string,
  logoUrl: string | null,
  profileImageUrl: string | null,
  linkUrl: string | null,
  attachmentImageUrl: string | null,
  businessName: string,
  linkText: string = 'לחץ כאן'
): string {
  // Convert line breaks to <br> tags
  const formattedBody = messageBody.replace(/\n/g, '<br>');

  // Convert all image URLs to public URLs
  const publicLogoUrl = getPublicUrl(logoUrl, 'logo');
  const publicProfileImageUrl = getPublicUrl(profileImageUrl, 'profile_image');
  const publicAttachmentImageUrl = getPublicUrl(attachmentImageUrl, 'attachment_image');

  console.log("🎨 [EMAIL] Building HTML with final URLs:", {
    logoUrl: publicLogoUrl,
    profileImageUrl: publicProfileImageUrl,
    linkUrl,
    attachmentImageUrl: publicAttachmentImageUrl
  });
  console.log("📝 [EMAIL] Message body length:", messageBody.length);
  console.log("📝 [EMAIL] Business name:", businessName);
  console.log("📝 [EMAIL] Link text:", linkText);

  // Safe email template - Progressive enhancement approach
  return `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; padding: 0;">

      <!-- Green Header -->
      <div style="background-color: #199f3a; padding: 30px 20px; text-align: center;">
        ${publicLogoUrl ? `
        <div style="margin-bottom: 15px;">
          <img src="${publicLogoUrl}" alt="${businessName}" style="height: 120px;">
        </div>
        ` : ''}
        <p style="color: white; font-size: 28px; margin: 0; font-weight: bold;">${businessName}</p>
      </div>

      <!-- Content Area -->
      <div style="padding: 30px 20px; text-align: right;">

        ${linkUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${linkUrl}" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; font-size: 16px;">${linkText}</a>
        </div>
        ` : ''}

        <div style="margin: 20px 0; line-height: 1.6;">
          ${formattedBody}
        </div>

        <p style="text-align: center; margin-top: 30px; color: #666;">בברכה,<br>${businessName || 'iHoogi'}</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        <p style="margin: 5px 0; color: #666;">נשלח באופן אוטומטי באמצעות iHoogi – מערכת שאלונים חכמה המחברת עסקים ללקוחותיהם, מבית <a href="https://www.ai-4biz.com" style="color: #666; text-decoration: underline;">AI-4Biz</a>, בשם העסק שמולו פנית.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
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
  htmlBody: string,
  textBody: string,
  replyTo?: string
): Promise<void> {
  try {
    console.log("📧 [EMAIL] Sending automation email to:", to);

    // Create Supabase client to call the send-automation-email function
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase.functions.invoke('send-automation-email', {
      body: {
        to,
        subject,
        html: htmlBody,
        text: textBody,
        replyTo
      }
    });

    // Log the full response first
    console.log("📬 [EMAIL] Response from send-automation-email:", JSON.stringify({ data, error }));

    // Check for errors - both in error field and data.error
    if (error) {
      console.error("❌ [EMAIL] Invoke error:", error);
      throw error;
    }

    if (data && data.error) {
      console.error("❌ [EMAIL] Email service error:", data.error);
      console.error("📋 [EMAIL] Full response:", JSON.stringify(data));
      throw new Error(data.error);
    }

    if (data && data.success) {
      console.log("✅ [EMAIL] Email sent successfully to:", to);
      console.log("📧 [EMAIL] Email ID:", data.id);
    } else {
      console.error("⚠️ [EMAIL] Unexpected response - data:", JSON.stringify(data));
      console.error("⚠️ [EMAIL] Unexpected response - error:", JSON.stringify(error));
      console.error("⚠️ [EMAIL] data.success:", data?.success);
      console.error("⚠️ [EMAIL] typeof data:", typeof data);
      throw new Error("Unexpected email response");
    }
  } catch (error) {
    console.error("❌ [EMAIL] Error in sendAutomationEmail:", error);
    console.error("📍 [EMAIL] Failed to send to:", to);
    // Don't throw - continue even if email fails
  }
}

async function sendAutomationSMS(
  recipient: string,
  message: string
): Promise<void> {
  try {
    console.log("💬 [SMS] Sending automation SMS to:", recipient);

    // Create Supabase client to call the send-sms function
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        recipient,
        message
      }
    });

    if (error) {
      console.error("❌ [SMS] Error sending SMS:", error);
      throw error;
    }

    console.log("✅ [SMS] SMS sent successfully");
  } catch (error) {
    console.error("❌ [SMS] Error in sendAutomationSMS:", error);
    // Don't throw - continue even if SMS fails
  }
}

async function sendAutomationWhatsApp(
  recipient: string,
  message: string,
  mediaUrl: string | null = null
): Promise<void> {
  try {
    console.log("📱 [WHATSAPP] Sending automation WhatsApp to:", recipient);

    // Create Supabase client to call the send-whatsapp function
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const requestBody: { recipient: string; message: string; mediaUrl?: string } = {
      recipient,
      message
    };

    // Add mediaUrl if provided
    if (mediaUrl) {
      // Convert to public URL if it's a storage path
      const publicMediaUrl = getPublicUrl(mediaUrl, 'whatsapp_media');
      if (publicMediaUrl) {
        requestBody.mediaUrl = publicMediaUrl;
      }
    }

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: requestBody
    });

    if (error) {
      console.error("❌ [WHATSAPP] Error sending WhatsApp:", error);
      throw error;
    }

    console.log("✅ [WHATSAPP] WhatsApp message sent successfully");
  } catch (error) {
    console.error("❌ [WHATSAPP] Error in sendAutomationWhatsApp:", error);
    // Don't throw - continue even if WhatsApp fails
  }
}

serve(async (req) => {
  console.log("📥 [WEBHOOK] Received request:", req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("✅ [WEBHOOK] CORS preflight");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      console.log("❌ [WEBHOOK] Method not allowed:", req.method);
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders
      });
    }

    const hasValidSignature = assertSignature(req);
    console.log("🔐 [WEBHOOK] Signature validation:", hasValidSignature ? "PASSED" : "FAILED");

    if (!hasValidSignature) {
      return new Response("Forbidden", {
        status: 403,
        headers: corsHeaders
      });
    }

    const payload = (await req.json()) as TriggerPayload;
    console.log("📦 [WEBHOOK] Raw payload:", JSON.stringify(payload));
    console.log("📦 [WEBHOOK] Payload received:", {
      type: payload?.type,
      table: payload?.table,
      recordId: payload?.record?.id
    });
    console.log("📦 [WEBHOOK] Payload keys:", Object.keys(payload || {}));

    if (payload?.type !== "INSERT" || payload?.table !== "leads") {
      console.log("⏭️  [WEBHOOK] Ignored - not a lead INSERT");
      return new Response("Ignored", {
        status: 200,
        headers: corsHeaders
      });
    }

    const lead = payload.record;

    // Handle automation in background
    await handleAutomation(lead);

    console.log("✅ [WEBHOOK] Request completed successfully");
    return new Response("OK", {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    console.error("❌ [WEBHOOK] Error:", err);
    return new Response("Internal Error", {
      status: 500,
      headers: corsHeaders
    });
  }
});
