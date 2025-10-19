// supabase/functions/verify-reset-code/index.ts
// Deno Edge Function to verify 6-digit code and reset password

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody));

    const { email, code, newPassword } = requestBody;

    console.log('Received request:', { email, code: code?.length || 0, hasNewPassword: !!newPassword });

    if (!email || !code || !newPassword) {
      console.error('Missing required fields:', { hasEmail: !!email, hasCode: !!code, hasNewPassword: !!newPassword });
      return new Response(JSON.stringify({
        success: false,
        error: "Email, code, and new password are required"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find valid code
    const { data: resetCode, error: findError } = await supabase
      .from("password_reset_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !resetCode) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid or expired code"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      throw userError;
    }

    const user = users?.users?.find(u => u.email === email);

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: "User not found"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if the new password is the same as the current password
    // by trying to sign in with it
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword
    });

    // If sign-in succeeds, it means the password is the same as the current one
    if (signInData?.user && !signInError) {
      // Return 200 status but with error in the response body
      // This allows the client to properly read the error message
      return new Response(JSON.stringify({
        success: false,
        error: "Cannot use the same password as your current password"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    // Mark code as used
    const { error: markUsedError } = await supabase
      .from("password_reset_codes")
      .update({ used: true })
      .eq("id", resetCode.id);

    if (markUsedError) {
      console.error("Error marking code as used:", markUsedError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Password reset successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
