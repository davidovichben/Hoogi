// supabase/functions/send-reset-code/index.ts
// Deno Edge Function to generate and send 6-digit password reset code via email

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@example.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Generate random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email templates by language
const emailTemplates = {
  en: {
    subject: "Password Reset Code",
    heading: "Password Reset Request",
    intro: "You requested to reset your password. Use the code below to reset your password:",
    expires: "This code will expire in 5 minutes.",
    ignore: "If you didn't request this, please ignore this email.",
  },
  he: {
    subject: "קוד לאיפוס סיסמה",
    heading: "בקשה לאיפוס סיסמה",
    intro: "ביקשת לאפס את הסיסמה שלך. השתמש בקוד למטה כדי לאפס את הסיסמה:",
    expires: "קוד זה יפוג בעוד 5 דקות.",
    ignore: "אם לא ביקשת זאת, אנא התעלם ממייל זה.",
  },
};

async function sendResetEmail(email: string, code: string, language: string = 'en') {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - email not sent");
    return { simulated: true };
  }

  // Get template for selected language, fallback to English
  const template = emailTemplates[language as keyof typeof emailTemplates] || emailTemplates.en;
  const isRTL = language === 'he';

  const subject = template.subject;
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'he' : 'en'}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style type="text/css">
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff;">

          <!-- Header with iHoogi Avatar -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="position: relative;">
                    <img src="https://drive.google.com/uc?export=view&id=1eal6gTSAJf5-MVnvTm-XoUXow6pUMSCB" alt="iHoogi" width="100" height="100" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white; display: block;" />
                  </td>
                </tr>
              </table>
              <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">${template.heading}</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">${isRTL ? 'בקשת איפוס סיסמה לחשבון שלכם 🔒' : 'Password reset request for your account 🔒'}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'};">
              <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">${isRTL ? 'היי,' : 'Hi,'}</p>
              <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">${template.intro}</p>

              <!-- Warning Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-${isRTL ? 'right' : 'left'}: 5px solid #f59e0b; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 15px 0; color: #92400e; font-size: 20px; font-weight: 700;">
                            <span style="font-size: 32px; margin-${isRTL ? 'left' : 'right'}: 15px;">⚠️</span>
                            ${isRTL ? 'חשוב לדעת!' : 'Important!'}
                          </p>
                          <div style="background: white; padding: 15px; border-radius: 10px;">
                            <p style="margin: 8px 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                              <strong>🕐 ${template.expires}</strong><br>
                              ${template.ignore}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Code Display -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 40px 0;">
                <tr>
                  <td align="center" style="background: #f9fafb; border: 3px solid #dc2626; padding: 30px; border-radius: 15px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 16px; font-weight: 600;">${isRTL ? 'הקוד שלך:' : 'Your Code:'}</p>
                    <p style="margin: 0; color: #dc2626; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
                  </td>
                </tr>
              </table>

              <!-- Security Tip -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-${isRTL ? 'right' : 'left'}: 5px solid #2D66F2; padding: 20px; border-radius: 15px;">
                    <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">🛡️ ${isRTL ? 'טיפ אבטחה מ-iHoogi:' : 'Security tip from iHoogi:'}</strong><br>
                      ${isRTL ? 'בחר סיסמה חזקה עם אותיות, מספרים וסימנים. אל תשתמש באותה סיסמה באתרים שונים!' : 'Choose a strong password with letters, numbers and symbols. Don\'t use the same password on different sites!'}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                ${isRTL ? 'יש בעיה? אני כאן לעזור! 💪<br>פנה אלינו בכל שאלה.' : 'Having trouble? I\'m here to help! 💪<br>Contact us with any questions.'}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f5f5f5; padding: 20px; text-align: center;">
              <p style="margin: 5px 0; color: #666; font-size: 12px; direction: rtl;">נשלח באופן אוטומטי באמצעות iHoogi – מערכת שאלונים חכמה המחברת עסקים ללקוחותיהם, מבית <a href="https://www.ai-4biz.com" style="color: #666; text-decoration: underline;">AI-4Biz</a>, בשם העסק שמולו פנית.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `${template.heading}\n\n${template.intro}\n\n${code}\n\n${template.expires}\n${template.ignore}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, language } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user exists with this email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      throw userError;
    }

    const userExists = users?.users?.some(u => u.email === email);

    if (!userExists) {
      // For security, return success even if user doesn't exist (prevent email enumeration)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing unused codes for this email to ensure fresh timer
    const { error: deleteError } = await supabase
      .from("password_reset_codes")
      .delete()
      .eq("email", email)
      .eq("used", false);

    if (deleteError) {
      console.error("Error deleting old codes:", deleteError);
      // Don't throw - continue with insertion even if deletion fails
    }

    // Store code in database
    const { error: insertError } = await supabase
      .from("password_reset_codes")
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      throw insertError;
    }

    // Send email
    await sendResetEmail(email, code, language || 'en');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
