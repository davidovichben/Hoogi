// Simple test email function - minimal HTML
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@example.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to } = await req.json()

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Missing "to" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📧 Sending simple test email to:', to)

    // Ultra-simple HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h1>Test Email from iHoogi</h1>
  <p>This is a simple test email.</p>
  <p>If you receive this, email sending is working correctly.</p>
  <p>Time: ${new Date().toISOString()}</p>
</body>
</html>
    `.trim()

    const text = `Test Email from iHoogi\n\nThis is a simple test email.\n\nIf you receive this, email sending is working correctly.\n\nTime: ${new Date().toISOString()}`

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: 'Test Email - iHoogi',
        html,
        text
      })
    })

    const resendData = await resendResponse.json()

    console.log('📬 Resend response:', resendResponse.status)
    console.log('📧 Response data:', JSON.stringify(resendData))

    if (!resendResponse.ok) {
      console.error('❌ Resend error:', resendData)
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Simple test email sent',
        id: resendData.id,
        from: FROM_EMAIL,
        to,
        note: 'Check your inbox (and spam folder) for the test email'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
