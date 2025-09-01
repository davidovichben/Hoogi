import { supabase } from "@/integrations/supabase/client";

export async function rpcCreateQuestionnaire(p_title: string, p_lang?: string) {
  const { data, error } = await supabase.rpc("create_questionnaire", { p_title, p_lang });
  if (error) throw error;
  return data;
}

export async function rpcPublishQuestionnaire(p_id: string) {
  const { data, error } = await supabase.rpc("publish_questionnaire", { p_id });
  if (error) throw error;
  return data; // may include { token }
}

export async function rpcGetDistributionLinks(p_id: string, baseUrl: string) {
  const { data, error } = await supabase.rpc("get_distribution_links", {
    p_id,
    p_base_url: baseUrl,
  });
  if (error) throw error;
  return data as { web_url: string; whatsapp_url: string; mailto_url: string };
}

export async function rpcGetPublicQuestionnaire(token: string) {
  const { data, error } = await supabase.rpc("get_public_questionnaire", { p_token: token });
  if (error) throw error;
  return data;
}

export async function rpcGetPublicBranding(token: string) {
  const { data, error } = await supabase.rpc("get_public_branding", { p_token: token });
  if (error) throw error;
  return data;
}

export async function rpcSubmitResponse(params: {
  token_or_uuid: string;
  answers: Record<string, any>;
  email?: string;
  phone?: string;
  lang?: string;
  channel?: string;
}) {
  const { data, error } = await supabase.rpc("submit_response", params);
  if (error) throw error;
  return data;
}

// QA (read-only)
export async function rpcQaQuestionnaires(limit = 20) {
  const { data, error } = await supabase.rpc("qa_questionnaires", { p_limit: limit });
  if (error) throw error;
  return data;
}
export async function rpcQaResponses(limit = 20) {
  const { data, error } = await supabase.rpc("qa_responses", { p_limit: limit });
  if (error) throw error;
  return data;
}
export async function rpcQaLeads(limit = 20) {
  const { data, error } = await supabase.rpc("qa_leads", { p_limit: limit });
  if (error) throw error;
  return data;
}
