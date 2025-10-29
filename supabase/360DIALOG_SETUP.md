# 360dialog WhatsApp Integration Setup Guide

## Overview

360dialog is an **official WhatsApp Business Solution Provider (BSP)** that provides direct access to the WhatsApp Business API. This is the recommended solution for professional businesses that want official WhatsApp Business features.

## Why 360dialog?

✅ **Official WhatsApp Business API** - Verified by Meta/WhatsApp
✅ **Professional Features** - Message templates, verified badges, analytics
✅ **Reliable & Scalable** - Enterprise-grade infrastructure
✅ **Reasonable Pricing** - €49/month + per-conversation pricing
✅ **Easy Integration** - RESTful API with good documentation
✅ **No QR Code Scanning** - Proper business account setup

## Features

- ✅ Send text messages
- ✅ Send media messages (images, documents, videos)
- ✅ Message templates (for marketing/notifications)
- ✅ Delivery receipts and read receipts
- ✅ WhatsApp Business verification (green checkmark)
- ✅ Professional business profile
- ✅ Analytics and reporting

## Prerequisites

Before you start, you need:
1. A business phone number (not currently used on WhatsApp)
2. Facebook Business Manager account
3. A verified business (optional but recommended)
4. Credit card for 360dialog subscription

## Setup Instructions

### Step 1: Create 360dialog Account

1. **Sign Up**
   - Visit https://hub.360dialog.com
   - Click "Sign Up" or "Get Started"
   - Complete the registration form

2. **Verify Email**
   - Check your email for verification link
   - Click to verify your account

3. **Choose a Plan**
   - **Developer Plan**: Free for testing (limited)
   - **Professional Plan**: €49/month + conversation pricing
   - **Enterprise**: Custom pricing

### Step 2: Connect WhatsApp Business Account

1. **Create WhatsApp Business Account**
   - In 360dialog Hub, go to "Client" → "Create Client"
   - Enter your business details:
     - Business name
     - Business address
     - Business description
     - Business category

2. **Add Phone Number**
   - Click "Add Phone Number"
   - Enter your business phone number (with country code)
   - Verify via SMS code
   - **Important**: This number will be permanently linked to WhatsApp Business

3. **Create Business Profile**
   - Add business logo
   - Add business description
   - Add business website
   - Add business address
   - Add business email

4. **Wait for Approval** (Usually 5-15 minutes)
   - 360dialog will verify your account
   - You'll receive an email when approved

### Step 3: Get API Credentials

1. **Navigate to API Keys**
   - In 360dialog Hub, go to "API Keys"
   - Click "Create API Key"

2. **Copy Your API Key**
   - Copy the `D360-API-KEY` value
   - **Important**: Save this securely - you won't be able to see it again

3. **Optional: Get Partner ID** (for partner accounts)
   - If you're a partner, you'll also have a Partner ID
   - Find it in Account Settings

### Step 4: Configure Supabase Secrets

```bash
# Set 360dialog as the provider
npx supabase secrets set WHATSAPP_PROVIDER=360dialog

# Set your API key (required)
npx supabase secrets set DIALOG360_API_KEY=your_api_key_here

# Set partner ID (optional - only if you have a partner account)
npx supabase secrets set DIALOG360_PARTNER_ID=your_partner_id
```

### Step 5: Deploy Functions

```bash
# Deploy all automation functions
bash deploy-automations.sh

# Or deploy individually
npx supabase functions deploy send-whatsapp
npx supabase functions deploy on-new-lead
```

### Step 6: Test the Integration

```bash
# Test sending a message
npx supabase functions invoke send-whatsapp --body '{
  "recipient": "+972501234567",
  "message": "Hello from Hoogi! This is a test message from 360dialog."
}'

# Test with media
npx supabase functions invoke send-whatsapp --body '{
  "recipient": "+972501234567",
  "message": "Check out this image!",
  "mediaUrl": "https://example.com/image.jpg"
}'
```

## Phone Number Format

360dialog requires phone numbers in this format:
- ✅ **Correct**: `972501234567` (country code + number, NO + sign)
- ✅ **Correct**: `14155551234` (US number)
- ❌ **Wrong**: `+972501234567` (with + sign)
- ❌ **Wrong**: `0501234567` (without country code)

The system automatically cleans the phone number for you.

## Message Templates (Optional but Recommended)

For marketing or automated messages outside the 24-hour conversation window, you need approved message templates.

### Create a Message Template

1. **Go to Templates**
   - In 360dialog Hub, go to "Templates"
   - Click "Create Template"

2. **Design Your Template**
   - Template name (lowercase, no spaces)
   - Category (Marketing, Utility, Authentication)
   - Language
   - Message content with variables (e.g., `Hello {{1}}, welcome!`)

3. **Submit for Approval**
   - Meta/WhatsApp will review (usually 1-24 hours)
   - Templates must follow WhatsApp Business Policy

4. **Use Approved Template**
   ```bash
   npx supabase functions invoke send-whatsapp --body '{
     "recipient": "972501234567",
     "template": "welcome_message",
     "templateParams": ["John"]
   }'
   ```

## Pricing

### 360dialog Subscription
- **Developer**: Free (limited to 50 conversations/month)
- **Professional**: €49/month + per-conversation pricing
- **Enterprise**: Custom pricing

### WhatsApp Conversation Pricing
WhatsApp charges per 24-hour conversation window:
- **Service conversations**: ~€0.005-0.02 (varies by country)
- **Marketing conversations**: ~€0.01-0.05 (varies by country)
- **Utility conversations**: ~€0.002-0.01 (varies by country)
- **First 1,000 conversations/month**: FREE

### Example Costs

**Small Business (100 responses/month)**
- 360dialog: €49/month
- WhatsApp: Free (first 1,000 conversations)
- **Total**: €49/month

**Medium Business (2,000 responses/month)**
- 360dialog: €49/month
- WhatsApp: ~€20/month (1,000 paid conversations)
- **Total**: ~€69/month

**Large Business (10,000 responses/month)**
- 360dialog: €49/month
- WhatsApp: ~€90-150/month
- **Total**: ~€139-199/month

## Monitoring & Analytics

### View Logs
```bash
# Watch WhatsApp function logs
npx supabase functions logs send-whatsapp --follow

# Watch automation logs
npx supabase functions logs on-new-lead --follow
```

### 360dialog Analytics
- Login to 360dialog Hub
- Go to "Analytics" to see:
  - Messages sent/delivered
  - Delivery rates
  - Read rates
  - Failed messages
  - Conversation costs

## Troubleshooting

### "API Key not configured"
```bash
# Check if secrets are set
npx supabase secrets list

# Set the API key
npx supabase secrets set DIALOG360_API_KEY=your_key
```

### "Phone number not registered"
- Make sure your phone number is verified in 360dialog Hub
- Check that the number is not already registered with personal WhatsApp
- Wait 5-15 minutes after initial setup

### "Message failed to send"
1. **Check phone number format**: Must be international format without + sign
2. **Check API key**: Ensure it's correct and not expired
3. **Check account status**: Login to 360dialog Hub
4. **Check WhatsApp conversation window**: You can only reply within 24 hours unless using templates

### "Rate limit exceeded"
- 360dialog has rate limits (typically 80 messages/second)
- For high volume, contact 360dialog to increase limits
- Implement queuing if sending bulk messages

### "Template not approved"
- Wait for Meta/WhatsApp approval (1-24 hours)
- Ensure template follows WhatsApp Business Policy
- No promotional language, must provide value to user

## Best Practices

### 1. Message Quality
- Keep messages concise and clear
- Use proper grammar and spelling
- Include your business name
- Add clear call-to-action

### 2. Timing
- Reply within 24-hour conversation window when possible
- Use templates for messages outside the window
- Don't send messages during night hours

### 3. Opt-In & Opt-Out
- Always get user consent before sending marketing messages
- Provide clear opt-out instructions
- Respect user preferences

### 4. Templates
- Create templates for common scenarios:
  - Welcome messages
  - Order confirmations
  - Appointment reminders
  - Shipping updates
- Get templates approved before launch

### 5. Monitoring
- Check delivery rates daily
- Monitor failed messages
- Track costs to stay within budget
- Review analytics weekly

## Advantages Over Other Providers

| Feature | 360dialog | Ultramsg | Twilio | Green API |
|---------|-----------|----------|--------|-----------|
| Official WhatsApp BSP | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Business Verification | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Message Templates | ✅ Yes | ❌ Limited | ✅ Yes | ❌ Limited |
| No QR Scanning | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Enterprise Support | ✅ Yes | ❌ No | ✅ Yes | ❌ Limited |
| Webhooks | ✅ Advanced | ⚠️ Basic | ✅ Advanced | ⚠️ Basic |
| Pricing Model | Per-conversation | Fixed monthly | Per-message | Fixed monthly |

## Migration from Other Providers

If you're currently using Ultramsg or Green API:

1. **Setup 360dialog** (keep old provider running)
2. **Test thoroughly** with small volume
3. **Configure secrets** for 360dialog
4. **Switch provider**: `npx supabase secrets set WHATSAPP_PROVIDER=360dialog`
5. **Deploy functions**: `bash deploy-automations.sh`
6. **Monitor** for 24-48 hours
7. **Deactivate old provider**

## Support

### 360dialog Support
- **Documentation**: https://docs.360dialog.com
- **Support Portal**: https://hub.360dialog.com/support
- **Email**: support@360dialog.com
- **Response Time**: Usually within 24 hours

### Hoogi Integration Support
- Check logs: `npx supabase functions logs send-whatsapp --follow`
- Review setup guide: `/supabase/360DIALOG_SETUP.md`
- Test directly: See "Test the Integration" section above

## FAQ

**Q: Do I need a new phone number?**
A: Yes, you need a phone number not currently registered with WhatsApp (personal or business).

**Q: Can I keep my existing WhatsApp number?**
A: No, once registered with 360dialog, it's a Business API account and can't be used as personal WhatsApp.

**Q: How long does setup take?**
A: Initial setup: 15-30 minutes. Account approval: 5-15 minutes. Template approval: 1-24 hours.

**Q: Can I send to any phone number?**
A: Yes, but users must have WhatsApp installed and consent to receive messages.

**Q: What's the 24-hour conversation window?**
A: You can send any message within 24 hours of user's last message. Outside this window, you need approved templates.

**Q: Can I send bulk messages?**
A: Yes, but you need approved message templates and user opt-in for marketing messages.

**Q: Is 360dialog GDPR compliant?**
A: Yes, 360dialog is GDPR compliant and provides data processing agreements.

## Next Steps

1. ✅ Sign up for 360dialog account
2. ✅ Verify your business phone number
3. ✅ Get API credentials
4. ✅ Configure Supabase secrets
5. ✅ Deploy functions
6. ✅ Test with your own number
7. ✅ Create message templates (optional)
8. ✅ Set up automation in Distribution Hub
9. ✅ Go live!

---

**Ready to use professional WhatsApp Business API!** 🚀

For questions or issues, check the logs or contact 360dialog support.
