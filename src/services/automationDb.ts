import { supabase } from '../integrations/supabase/client';

export function createAutomationDb() {
  return {
    async listQueued() {
      const { data, error } = await supabase
        .from("automation_tasks")
        .select("id, type, status, payload")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
    async markProcessing(id: string) {
      const { error } = await supabase
        .from("automation_tasks")
        .update({ status: "processing" })
        .eq("id", id);
      if (error) throw error;
    },
    async markDone(id: string, providerResp?: any) {
      const { error } = await supabase
        .from("automation_tasks")
        .update({ status: "done", payload: providerResp })
        .eq("id", id);
      if (error) throw error;
    },
    async markError(id: string, err: string) {
      const { error } = await supabase
        .from("automation_tasks")
        .update({ status: "error", payload: { error: err } })
        .eq("id", id);
      if (error) throw error;
    },
  };
}
