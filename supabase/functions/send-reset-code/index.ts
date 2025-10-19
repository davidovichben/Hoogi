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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'};">
      <h2 style="color: #333;">${template.heading}</h2>
      <p style="color: #666; font-size: 16px;">${template.intro}</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px;">${template.expires}</p>
      <p style="color: #999; font-size: 14px;">${template.ignore}</p>
    </div>
  `;

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
