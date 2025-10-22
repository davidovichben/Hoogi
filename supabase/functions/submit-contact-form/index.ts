import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactFormData {
  country: string;
  subject: string;
  name: string;
  email: string;
  message: string;
  url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_path?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const formData: ContactFormData = await req.json()

    // Validate required fields
    if (!formData.country || !formData.subject || !formData.name || !formData.email || !formData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Look up email routing based on country + subject
    let routedEmail = 'intripoffice@gmail.com'; // Default fallback

    // Try exact match: country + subject
    const { data: exactMatch, error: exactError } = await supabaseClient
      .from('contact_rules')
      .select('email')
      .eq('country', formData.country)
      .eq('subject', formData.subject)
      .maybeSingle();

    if (exactMatch?.email) {
      routedEmail = exactMatch.email;
      console.log(`Found exact match for ${formData.country} + ${formData.subject}: ${routedEmail}`);
    } else {
      // Try country-only match (first result)
      const { data: countryMatch, error: countryError } = await supabaseClient
        .from('contact_rules')
        .select('email')
        .eq('country', formData.country)
        .limit(1)
        .maybeSingle();

      if (countryMatch?.email) {
        routedEmail = countryMatch.email;
        console.log(`Found country match for ${formData.country}: ${routedEmail}`);
      } else {
        console.log(`No match found, using default: ${routedEmail}`);
      }
    }

    // Step 2: Insert into contact_submissions table
    const { data: submission, error: insertError } = await supabaseClient
      .from('contact_submissions')
      .insert([{
        country: formData.country,
        subject: formData.subject,
        name: formData.name,
        email: formData.email,
        message: formData.message,
        url: formData.url || null,
        file_name: formData.file_name || null,
        file_size: formData.file_size || null,
        file_type: formData.file_type || null,
        file_path: formData.file_path || null,
        routed_to_email: routedEmail,
        status: 'new',
        priority: 'medium'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting contact submission:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save contact submission', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Contact submission created:', submission.id);

    // Step 3: Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set, skipping email send');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contact form submitted successfully (email sending disabled)',
          submission_id: submission.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build email content
    const emailSubject = `[Contact Form] ${formData.subject} - ${formData.name}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #4b5563; margin-bottom: 5px; }
          .value { background: white; padding: 10px; border-radius: 4px; border: 1px solid #d1d5db; }
          .file-info { background: #dbeafe; padding: 10px; border-radius: 4px; border-left: 4px solid #3b82f6; margin-top: 10px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">📧 פנייה חדשה מטופס יצירת קשר</h1>
        </div>

        <div class="content">
          <div class="field">
            <div class="label">🌍 מדינה:</div>
            <div class="value">${formData.country}</div>
          </div>

          <div class="field">
            <div class="label">📋 נושא:</div>
            <div class="value">${formData.subject}</div>
          </div>

          <div class="field">
            <div class="label">👤 שם:</div>
            <div class="value">${formData.name}</div>
          </div>

          <div class="field">
            <div class="label">📧 אימייל:</div>
            <div class="value"><a href="mailto:${formData.email}">${formData.email}</a></div>
          </div>

          <div class="field">
            <div class="label">💬 הודעה:</div>
            <div class="value" style="white-space: pre-wrap;">${formData.message}</div>
          </div>

          ${formData.url ? `
          <div class="field">
            <div class="label">🔗 קישור:</div>
            <div class="value"><a href="${formData.url}" target="_blank">${formData.url}</a></div>
          </div>
          ` : ''}

          ${formData.file_name ? `
          <div class="file-info">
            <strong>📎 קובץ מצורף:</strong><br>
            שם: ${formData.file_name}<br>
            סוג: ${formData.file_type || 'לא ידוע'}<br>
            גודל: ${formData.file_size ? (formData.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'לא ידוע'}<br>
            ${formData.file_path ? `נתיב: ${formData.file_path}` : ''}
          </div>
          ` : ''}

          <div class="footer">
            <p>פנייה זו נשלחה דרך טופס יצירת קשר באתר Hoogi</p>
            <p>מזהה פנייה: ${submission.id}</p>
            <p>זמן שליחה: ${new Date().toLocaleString('he-IL')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare email payload
    const emailPayload: any = {
      from: 'Hoogi Contact Form <service@ai-4biz.com>',
      to: [routedEmail],
      reply_to: formData.email,
      subject: emailSubject,
      html: emailHtml
    };

    // If there's a file attachment, download it from storage and attach it to email
    if (formData.file_path && formData.file_name) {
      try {
        // Download file from Supabase storage
        const { data: fileData, error: downloadError } = await supabaseClient.storage
          .from('contact-attachments')
          .download(formData.file_path);

        if (!downloadError && fileData) {
          // Convert blob to base64
          const arrayBuffer = await fileData.arrayBuffer();
          const base64Content = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          // Add attachment to email
          emailPayload.attachments = [{
            filename: formData.file_name,
            content: base64Content
          }];

          console.log(`Attached file: ${formData.file_name} (${formData.file_size} bytes)`);
        } else {
          console.warn('Could not download file for attachment:', downloadError);
        }
      } catch (attachError) {
        console.warn('Error attaching file to email:', attachError);
        // Continue sending email without attachment
      }
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Error sending email:', emailResult);
      // Don't fail the whole request if email fails
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contact form submitted successfully, but email sending failed',
          submission_id: submission.id,
          email_error: emailResult
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contact form submitted and email sent successfully',
        submission_id: submission.id,
        email_id: emailResult.id,
        routed_to: routedEmail
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing contact form:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
