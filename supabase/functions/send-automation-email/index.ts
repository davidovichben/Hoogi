// Supabase Edge Function for sending automation emails
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@example.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 [SEND-EMAIL] Function invoked')
    const { to, subject, html, text, replyTo }: EmailRequest = await req.json()

    console.log('📧 [SEND-EMAIL] Request details:', { to, subject: subject.substring(0, 50), hasHtml: !!html, replyTo })

    // Validate required fields
    if (!to || !subject || !html) {
      console.error('❌ [SEND-EMAIL] Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY) {
      console.error('❌ [SEND-EMAIL] RESEND_API_KEY not configured - check environment variables')
      return new Response(
        JSON.stringify({ error: 'Email service not configured - RESEND_API_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✓ [SEND-EMAIL] RESEND_API_KEY is configured')
    console.log('✓ [SEND-EMAIL] FROM_EMAIL:', FROM_EMAIL)

    // Send email via Resend
    console.log('📤 [SEND-EMAIL] Calling Resend API...')

    const emailPayload = {
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      reply_to: replyTo
    }

    console.log('📋 [SEND-EMAIL] Email payload:', JSON.stringify({
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailPayload.html.length,
      textLength: emailPayload.text.length,
      replyTo: emailPayload.reply_to
    }))

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailPayload)
    })

    console.log('📬 [SEND-EMAIL] Resend response status:', resendResponse.status)
    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('❌ [SEND-EMAIL] Resend API error:', resendData)
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    console.log('✅ [SEND-EMAIL] Email accepted by Resend')
    console.log('📧 [SEND-EMAIL] Resend email ID:', resendData.id)
    console.log('📬 [SEND-EMAIL] Full Resend response:', JSON.stringify(resendData))
    console.log('⚠️ [SEND-EMAIL] IMPORTANT: Check if FROM_EMAIL domain is verified in Resend!')
    console.log('📤 [SEND-EMAIL] FROM:', FROM_EMAIL, '→ TO:', to)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email accepted by Resend - check domain verification',
        id: resendData.id,
        from: FROM_EMAIL,
        to,
        subject,
        warning: 'If email not received, verify FROM_EMAIL domain in Resend dashboard'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [SEND-EMAIL] Error sending email:', error)
    console.error('❌ [SEND-EMAIL] Error details:', error instanceof Error ? error.message : 'Unknown error')
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
