import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      mainCategory,
      subcategory,
      businessDescription,
      websiteUrl,
      socialMediaLinks,
      clientAnswers,
      emailLength = 'medium'
    } = await req.json()

    // Validate required fields
    if (!mainCategory || !subcategory || !clientAnswers) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: mainCategory, subcategory, or clientAnswers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the prompt
    const prompt = `You are helping a business owner respond to a potential client who just filled out a contact form.

📌 Business Owner Info:
- Main Field: ${mainCategory}
- Subcategory: ${subcategory}
${businessDescription ? `- Business Description / Value Proposition: ${businessDescription}` : ''}
${websiteUrl ? `- Website or Portfolio Link: ${websiteUrl}` : ''}
${socialMediaLinks ? `- Social Media Links: ${socialMediaLinks}` : ''}

📝 Client's Questionnaire Answers:
${clientAnswers}

📏 Message Length Preferences:
- Email Length: ${emailLength} (Options: short / medium / long)
- Message Length: always short (e.g., WhatsApp or SMS)

🧠 Guidelines:
- The tone should feel like the business owner is personally replying to the client.
- Both the email and message must refer directly to the answers the client provided.
- Reference specific details from their answers to show you read them carefully.
- Express appreciation for the time they took to fill out the form.
- Show enthusiasm about their project/needs based on their answers.
- Mention how their answers gave you a better understanding of what they're looking for.
- Say you'll contact them soon to discuss further details.
- End with a warm closing like "שוב תודה" (Thanks again) followed by the business name/owner name from the Business Description field.
- Do NOT mention the system/platform/assistant.
- Do NOT schedule a call, add any links, or ask for more information beyond saying you'll contact them.
- The tone should be warm, personal, and human - not salesy or robotic.
- The email can be longer, depending on the specified email length (short = 3-4 sentences, medium = 5-7 sentences, long = 8-12 sentences).
- The message should be a 1–2 sentence summary with personal tone.
- Write in Hebrew if the client's answers are in Hebrew, otherwise use the language of the answers.

🎯 Output Required:
Please generate:
1. A personalized email (length = ${emailLength})
2. A matching short message (for WhatsApp or SMS - always 1-2 sentences)

Return the response in this exact JSON format:
{
  "email": "the email content here",
  "message": "the short message content here"
}`

    // Use Gemini API - v1beta with correct authentication
    let aiResponse: { email: string; message: string } | null = null
    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    for (const model of modelsToTry) {
      try {
        console.log('[generate-ai-response] Trying Gemini model with v1beta API:', model)

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000
            },
            system_instruction: {
              parts: [{
                text: 'You are a helpful assistant that generates personalized responses for business owners to send to their potential clients. Always respond with valid JSON containing "email" and "message" fields.'
              }]
            }
          })
        });

        const geminiData = await geminiResponse.json();
        console.log('[generate-ai-response] Response from', model, ':', JSON.stringify(geminiData).substring(0, 500))

        if (geminiData.error) {
          console.log('[generate-ai-response] Model failed:', model, geminiData.error.message)
          continue; // Try next model
        }

        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (responseText) {
          console.log('[generate-ai-response] Successfully used model:', model)
          console.log('[generate-ai-response] Raw response text:', responseText.substring(0, 200))

          // Try to extract JSON from the response
          try {
            // First try direct parse
            aiResponse = JSON.parse(responseText)
          } catch (parseError) {
            // Try to find JSON in the response
            const jsonMatch = responseText.match(/\{[\s\S]*"email"[\s\S]*"message"[\s\S]*\}/);
            if (jsonMatch) {
              aiResponse = JSON.parse(jsonMatch[0])
            } else {
              console.log('[generate-ai-response] Could not parse JSON from response')
              continue;
            }
          }

          if (aiResponse?.email && aiResponse?.message) {
            break; // Success, exit loop
          }
        }
      } catch (e: any) {
        console.log('[generate-ai-response] Exception with model:', model, e.message)
        continue; // Try next model
      }
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate AI response with all Gemini models tried' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        email: aiResponse.email,
        message: aiResponse.message
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in generate-ai-response function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
