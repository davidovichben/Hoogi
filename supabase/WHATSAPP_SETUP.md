# WhatsApp Automation Setup Guide

This guide explains how to set up WhatsApp automation for your questionnaire response system.

## Overview

The WhatsApp automation feature allows you to automatically send WhatsApp messages to leads when they respond to your questionnaires. This works alongside email and SMS automation.

## Features

- ✅ Automatic WhatsApp messages when leads respond
- ✅ Support for text messages
- ✅ Support for media attachments (images)
- ✅ Support for both personal and AI-generated messages
- ✅ Multiple WhatsApp provider options

## Supported WhatsApp Providers

The system supports four WhatsApp API providers:

### 1. **360dialog** (✨ Recommended for Professional Businesses)
- **Pros**: Official WhatsApp BSP, business verification, no QR codes, message templates
- **Cons**: More expensive, requires business registration
- **Cost**: €49/month + per-conversation pricing
- **Website**: https://hub.360dialog.com
- **Setup Time**: 15-30 minutes
- **📖 Full Guide**: See `/supabase/360DIALOG_SETUP.md`

### 2. **Ultramsg** (Recommended for Getting Started)
- **Pros**: Simple setup, affordable, good for small-medium volume
- **Cons**: Not official BSP, limited to one device, QR code scanning
- **Cost**: Starts at $5/month
- **Website**: https://ultramsg.com
- **Setup Time**: 5-10 minutes

### 3. **Twilio WhatsApp API**
- **Pros**: Official BSP, enterprise-grade, highly reliable, global reach
- **Cons**: More expensive, requires WhatsApp Business approval
- **Cost**: Pay-as-you-go pricing
- **Website**: https://www.twilio.com/whatsapp
- **Setup Time**: 1-2 hours (including approval)

### 4. **Green API**
- **Pros**: Easy setup, good documentation, supports multiple instances
- **Cons**: Not official BSP, may require QR code scanning periodically
- **Cost**: Starts at $12/month
- **Website**: https://green-api.com
- **Setup Time**: 10-15 minutes

## Setup Instructions

### Option A: 360dialog (✨ Recommended for Professional Use)

For complete 360dialog setup instructions, see the dedicated guide:
**📖 [360dialog Setup Guide](/supabase/360DIALOG_SETUP.md)**

**Quick Setup:**
```bash
# Configure secrets
npx supabase secrets set WHATSAPP_PROVIDER=360dialog
npx supabase secrets set DIALOG360_API_KEY=your_api_key_here
npx supabase secrets set DIALOG360_PARTNER_ID=your_partner_id  # Optional

# Deploy
bash deploy-automations.sh
```

**Why Choose 360dialog?**
- ✅ Official WhatsApp Business Solution Provider (BSP)
- ✅ Get WhatsApp Business verified badge (green checkmark)
- ✅ Professional business profile with logo and description
- ✅ No QR code scanning - proper business setup
- ✅ Message templates for marketing
- ✅ Advanced analytics and reporting
- ✅ Enterprise-grade reliability

### Option B: Ultramsg (Easy Start)

1. **Create an Ultramsg Account**
   - Visit https://ultramsg.com
   - Sign up for an account
   - Create a new instance

2. **Connect WhatsApp**
   - Scan the QR code with your WhatsApp account
   - Wait for connection confirmation

3. **Get Your Credentials**
   - Go to your instance settings
   - Copy your Instance ID
   - Copy your API Token

4. **Configure Supabase Secrets**
   ```bash
   npx supabase secrets set WHATSAPP_PROVIDER=ultramsg
   npx supabase secrets set ULTRAMSG_INSTANCE_ID=instance_12345
   npx supabase secrets set ULTRAMSG_TOKEN=your_api_token_here
   ```

### Option C: Twilio WhatsApp

1. **Create a Twilio Account**
   - Visit https://www.twilio.com
   - Sign up and verify your account

2. **Enable WhatsApp**
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow the sandbox setup OR apply for WhatsApp Business approval

3. **Get Your Credentials**
   - Account SID (from dashboard)
   - Auth Token (from dashboard)
   - WhatsApp-enabled phone number

4. **Configure Supabase Secrets**
   ```bash
   npx supabase secrets set WHATSAPP_PROVIDER=twilio
   npx supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
   npx supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   npx supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

### Option D: Green API

1. **Create a Green API Account**
   - Visit https://green-api.com
   - Sign up for an account
   - Create a new instance

2. **Connect WhatsApp**
   - Scan the QR code with your WhatsApp
   - Wait for authentication

3. **Get Your Credentials**
   - Copy your Instance ID
   - Copy your API Token

4. **Configure Supabase Secrets**
   ```bash
   npx supabase secrets set WHATSAPP_PROVIDER=greenapi
   npx supabase secrets set GREENAPI_ID_INSTANCE=1234567
   npx supabase secrets set GREENAPI_API_TOKEN=your_api_token
   ```

## Deployment

After configuring your secrets, deploy the functions:

```bash
bash deploy-automations.sh
```

Or deploy individually:

```bash
npx supabase functions deploy send-whatsapp
npx supabase functions deploy on-new-lead
```

## Usage in Distribution Hub

1. **Go to Distribution Hub**
   - Navigate to the Distribution Hub page
   - Select your questionnaire

2. **Configure Automation**
   - Add an automation template
   - Select the **WhatsApp** channel
   - Choose other channels if needed (Email, SMS)

3. **Generate Links**
   - Click "Generate Links"
   - Share your questionnaire via any channel

4. **Automatic WhatsApp Messages**
   - When someone responds, they'll receive:
     - Email (if Email channel is selected)
     - WhatsApp message (if WhatsApp channel is selected)
     - SMS (if SMS channel is selected)

## Phone Number Format

WhatsApp requires phone numbers in international format:

- ✅ **Correct**: +972501234567, +14155551234
- ❌ **Wrong**: 0501234567, (415) 555-1234

The system will attempt to clean the number automatically, but ensure your questionnaire collects phone numbers in the correct format.

## Testing

### Test WhatsApp Sending

You can test the WhatsApp function directly:

```bash
npx supabase functions invoke send-whatsapp --body '{
  "recipient": "+972501234567",
  "message": "Test message from Hoogi"
}'
```

### Monitor Logs

```bash
npx supabase functions logs send-whatsapp --follow
npx supabase functions logs on-new-lead --follow
```

## Troubleshooting

### Message Not Sending

1. **Check Secrets Configuration**
   ```bash
   npx supabase secrets list
   ```
   Ensure all required secrets are set.

2. **Check Phone Number Format**
   - Must include country code
   - No spaces or special characters (system will clean)
   - Example: +972501234567

3. **Check Provider Status**
   - Ultramsg: Ensure WhatsApp is connected
   - Twilio: Check account balance and WhatsApp status
   - Green API: Verify instance is active

4. **Check Logs**
   ```bash
   npx supabase functions logs send-whatsapp --follow
   ```

### Provider-Specific Issues

#### Ultramsg
- **QR Code Expired**: Reconnect your WhatsApp
- **Rate Limits**: Check your plan limits
- **Instance Offline**: Restart the instance

#### Twilio
- **Sandbox Restrictions**: Only pre-approved numbers can receive messages in sandbox mode
- **Apply for Production**: Submit WhatsApp Business approval request
- **Message Templates**: Use approved templates for production

#### Green API
- **Instance Not Active**: Check instance status in dashboard
- **QR Code Needed**: Rescan if connection lost
- **Rate Limits**: Check your subscription limits

## Message Limits

Be aware of provider message limits:

- **Ultramsg**: Varies by plan (typically 1000-10000/month)
- **Twilio**: Pay-per-message (no hard limit)
- **Green API**: Varies by plan (typically unlimited)

## Best Practices

1. **Use Professional Messages**
   - Keep messages concise and clear
   - Include your business name
   - Add a call-to-action

2. **Respect User Preferences**
   - Only send to users who provided phone numbers
   - Include opt-out instructions if sending marketing messages

3. **Monitor Delivery**
   - Check logs regularly
   - Monitor success rates
   - Adjust templates based on performance

4. **Combine Channels**
   - Use WhatsApp + Email for better reach
   - WhatsApp for urgent messages
   - Email for detailed information

## Cost Comparison

| Provider | Monthly Cost | Per-Message Cost | Best For |
|----------|-------------|------------------|----------|
| Ultramsg | $5-50 | Included in plan | Small businesses, getting started |
| Twilio | $0 base | ~$0.005-0.01 | High volume, enterprise |
| Green API | $12-100 | Included in plan | Medium businesses, multiple devices |

## Security

- All API credentials are stored as Supabase secrets (encrypted)
- Never commit credentials to Git
- Rotate API tokens periodically
- Use separate accounts for development and production

## Support

If you encounter issues:

1. Check the logs: `npx supabase functions logs send-whatsapp --follow`
2. Review the [Ultramsg documentation](https://docs.ultramsg.com)
3. Review the [Twilio WhatsApp docs](https://www.twilio.com/docs/whatsapp)
4. Review the [Green API docs](https://green-api.com/en/docs/)

## Next Steps

After setting up WhatsApp:

1. ✅ Test with your own phone number
2. ✅ Create automation templates in the Distribution Hub
3. ✅ Send test questionnaires
4. ✅ Monitor logs and delivery rates
5. ✅ Adjust message templates based on responses

---

**Note**: Make sure you comply with WhatsApp's Business Policy and local regulations when sending automated messages.
