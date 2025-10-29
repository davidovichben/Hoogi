import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendWhatsAppRequest {
  recipient: string;
  message: string;
  mediaUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipient, message, mediaUrl }: SendWhatsAppRequest = await req.json();

    console.log('📱 [WHATSAPP] Sending WhatsApp message to:', recipient);

    // Validate inputs
    if (!recipient || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipient and message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp API credentials from secrets
    // Support multiple providers: 360dialog, Twilio, Green API, Ultramsg
    const whatsappProvider = Deno.env.get('WHATSAPP_PROVIDER') || 'ultramsg';

    let result;

    switch (whatsappProvider.toLowerCase()) {
      case '360dialog':
        result = await sendVia360Dialog(recipient, message, mediaUrl);
        break;
      case 'twilio':
        result = await sendViaTwilio(recipient, message, mediaUrl);
        break;
      case 'greenapi':
        result = await sendViaGreenAPI(recipient, message, mediaUrl);
        break;
      case 'ultramsg':
        result = await sendViaUltramsg(recipient, message, mediaUrl);
        break;
      default:
        console.error('❌ [WHATSAPP] Unknown provider:', whatsappProvider);
        return new Response(
          JSON.stringify({ error: 'Unknown WhatsApp provider configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('✅ [WHATSAPP] Message sent successfully to:', recipient);

    return new Response(
      JSON.stringify({
        success: true,
        recipient,
        provider: whatsappProvider,
        response: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [WHATSAPP] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 360dialog WhatsApp Business API
async function sendVia360Dialog(recipient: string, message: string, mediaUrl?: string) {
  const apiKey = Deno.env.get('DIALOG360_API_KEY');
  const partnerId = Deno.env.get('DIALOG360_PARTNER_ID'); // Optional: for partner accounts

  if (!apiKey) {
    throw new Error('360dialog API key not configured');
  }

  // Clean phone number (remove + and spaces, keep only digits)
  const cleanNumber = recipient.replace(/[\s+\-()]/g, '');

  // Ensure number starts with country code (no + sign for 360dialog)
  const phoneNumber = cleanNumber.startsWith('972') || cleanNumber.startsWith('1') || cleanNumber.startsWith('44')
    ? cleanNumber
    : cleanNumber.replace(/^0/, '972'); // Default to Israel if starts with 0

  console.log('📱 [360DIALOG] Sending to cleaned number:', phoneNumber);

  // Build the API URL
  const baseUrl = partnerId
    ? `https://waba.360dialog.io/v1/partners/${partnerId}/messages`
    : 'https://waba.360dialog.io/v1/messages';

  let body;

  if (mediaUrl) {
    // Send media message with caption
    body = {
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'image',
      image: {
        link: mediaUrl,
        caption: message
      }
    };
  } else {
    // Send text message
    body = {
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'text',
      text: {
        body: message
      }
    };
  }

  console.log('📤 [360DIALOG] Request body:', JSON.stringify(body, null, 2));

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'D360-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  console.log('📨 [360DIALOG] Response status:', response.status);
  console.log('📨 [360DIALOG] Response:', responseText);

  if (!response.ok) {
    console.error('❌ [360DIALOG] Error response:', responseText);
    throw new Error(`360dialog API error (${response.status}): ${responseText}`);
  }

  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (e) {
    responseData = { response: responseText };
  }

  return responseData;
}

// Twilio WhatsApp API
async function sendViaTwilio(recipient: string, message: string, mediaUrl?: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER'); // Format: whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  // Format recipient number (add whatsapp: prefix if not present)
  const toNumber = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('Body', message);
  if (mediaUrl) {
    formData.append('MediaUrl', mediaUrl);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [TWILIO] Error response:', errorText);
    throw new Error(`Twilio API error: ${errorText}`);
  }

  return await response.json();
}

// Green API WhatsApp
async function sendViaGreenAPI(recipient: string, message: string, mediaUrl?: string) {
  const idInstance = Deno.env.get('GREENAPI_ID_INSTANCE');
  const apiTokenInstance = Deno.env.get('GREENAPI_API_TOKEN');

  if (!idInstance || !apiTokenInstance) {
    throw new Error('Green API credentials not configured');
  }

  // Clean phone number (remove + and spaces)
  const cleanNumber = recipient.replace(/[\s+]/g, '');
  const chatId = `${cleanNumber}@c.us`;

  let url, body;

  if (mediaUrl) {
    // Send file message
    url = `https://api.green-api.com/waInstance${idInstance}/sendFileByUrl/${apiTokenInstance}`;
    body = JSON.stringify({
      chatId: chatId,
      urlFile: mediaUrl,
      fileName: 'image.jpg',
      caption: message
    });
  } else {
    // Send text message
    url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    body = JSON.stringify({
      chatId: chatId,
      message: message
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [GREENAPI] Error response:', errorText);
    throw new Error(`Green API error: ${errorText}`);
  }

  return await response.json();
}

// Ultramsg WhatsApp API
async function sendViaUltramsg(recipient: string, message: string, mediaUrl?: string) {
  const instanceId = Deno.env.get('ULTRAMSG_INSTANCE_ID');
  const token = Deno.env.get('ULTRAMSG_TOKEN');

  if (!instanceId || !token) {
    throw new Error('Ultramsg credentials not configured');
  }

  // Clean phone number (remove + and spaces)
  const cleanNumber = recipient.replace(/[\s+]/g, '');

  const formData = new URLSearchParams();
  formData.append('token', token);
  formData.append('to', cleanNumber);
  formData.append('body', message);

  if (mediaUrl) {
    formData.append('image', mediaUrl);
  }

  const url = `https://api.ultramsg.com/${instanceId}/messages/image`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [ULTRAMSG] Error response:', errorText);
    throw new Error(`Ultramsg API error: ${errorText}`);
  }

  return await response.json();
}
