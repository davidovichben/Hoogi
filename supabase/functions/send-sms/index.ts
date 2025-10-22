import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  recipient: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipient, message }: SendSMSRequest = await req.json();

    console.log('📱 [SMS] Sending SMS to:', recipient);

    // Validate inputs
    if (!recipient || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipient and message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API credentials from secrets
    const apiKey = Deno.env.get('FREE_SMS_API_KEY');
    const apiUsername = Deno.env.get('FREE_SMS_API_USERNAME');
    const apiPassword = Deno.env.get('FREE_SMS_API_PASSWORD');
    const apiSender = Deno.env.get('FREE_SMS_API_SENDER');

    if (!apiKey || !apiUsername || !apiPassword || !apiSender) {
      console.error('❌ [SMS] Missing API credentials in secrets');
      return new Response(
        JSON.stringify({ error: 'SMS API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare SMS API request
    const smsPayload = {
      key: apiKey,
      user: apiUsername,
      pass: apiPassword,
      sender: apiSender,
      recipient: recipient,
      msg: message
    };

    console.log('📤 [SMS] Sending request to SMS API for recipient:', recipient);

    // Send SMS via API
    const smsResponse = await fetch('https://api.sms4free.co.il/ApiSMS/v2/SendSMS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsPayload),
    });

    const smsResponseText = await smsResponse.text();
    console.log('📨 [SMS] API Response Status:', smsResponse.status);
    console.log('📨 [SMS] API Response:', smsResponseText);

    if (!smsResponse.ok) {
      console.error('❌ [SMS] Failed to send SMS:', smsResponseText);
      return new Response(
        JSON.stringify({
          error: 'Failed to send SMS',
          details: smsResponseText,
          status: smsResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(smsResponseText);
    } catch (e) {
      // If response is not JSON, treat it as plain text
      responseData = { response: smsResponseText };
    }

    console.log('✅ [SMS] SMS sent successfully to:', recipient);

    return new Response(
      JSON.stringify({
        success: true,
        recipient,
        response: responseData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [SMS] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
