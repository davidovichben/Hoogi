import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("on-new-lead function booting up...");

serve(async (req) => {
  // This function is called for every request.
  // It needs to handle OPTIONS pre-flight requests and the actual POST request.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // The Supabase trigger payload is in the request body.
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));

    // The payload contains the new lead record.
    const newLead = payload.record;
    
    // --- TODO: Add your webhook/email logic here ---

    // Example: Send to a generic webhook endpoint (e.g., Zapier, Make.com)
    /*
    const WEBHOOK_URL = Deno.env.get("LEAD_WEBHOOK_URL");
    if (WEBHOOK_URL) {
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: newLead }),
      });
      if (!webhookResponse.ok) {
        console.error("Webhook call failed:", await webhookResponse.text());
      } else {
        console.log("Successfully sent data to webhook.");
      }
    }
    */

    // Example: Send an email using Resend
    /*
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "noreply@yourdomain.com", // TODO: Replace with your verified domain in Resend
          to: "your-notification-email@example.com", // TODO: Replace with your email
          subject: `New Lead Received: ${newLead.name || newLead.email}`,
          html: `<p>A new lead has been submitted.</p><pre>${JSON.stringify(newLead, null, 2)}</pre>`,
        }),
      });
      if (!emailResponse.ok) {
        console.error("Resend API call failed:", await emailResponse.text());
      } else {
        console.log("Successfully sent lead notification email.");
      }
    }
    */
    
    // --- End of TODO section ---

    return new Response(JSON.stringify({ success: true, lead: newLead }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// To deploy this function:
// 1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
// 2. Link your project: supabase link --project-ref <your-project-ref>
// 3. Set up secrets (if any): supabase secrets set LEAD_WEBHOOK_URL="xxx" RESEND_API_KEY="xxx"
// 4. Deploy the function: supabase functions deploy on-new-lead --no-verify-jwt
// 5. In the Supabase dashboard (Database > Webhooks), create a new webhook on the 'leads' table for 'INSERT' events, pointing to this function.
