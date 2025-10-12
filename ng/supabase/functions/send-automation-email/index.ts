// Supabase Edge Function for sending automation emails
// Deploy this function to handle email sending from automations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, from, replyTo }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Option 1: Using Resend (recommended)
    // Uncomment and set RESEND_API_KEY in your Supabase Edge Functions secrets
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: from || 'noreply@yourdomain.com',
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        reply_to: replyTo
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }
    */

    // Option 2: Using SendGrid
    // Uncomment and set SENDGRID_API_KEY in your Supabase Edge Functions secrets
    /*
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }]
        }],
        from: { email: from || 'noreply@yourdomain.com' },
        subject,
        content: [
          {
            type: 'text/html',
            value: html
          }
        ],
        reply_to: replyTo ? { email: replyTo } : undefined
      })
    })

    if (!sendGridResponse.ok) {
      const error = await sendGridResponse.text()
      throw new Error(`SendGrid API error: ${error}`)
    }
    */

    // Option 3: Log for development (remove in production)
    console.log('Email would be sent:', { to, subject, from, replyTo })
    console.log('HTML content:', html)

    // For development, just return success
    // In production, use one of the email services above
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully (development mode - email logged)',
        to,
        subject
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
