import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getBccEmails(supabase: SupabaseClient, tenantId: string | null): Promise<string[]> {
  if (!tenantId) return [];

  try {
    const { data, error } = await supabase
      .from("system_configurations")
      .select("value")
      .eq("category", "email_bcc")
      .eq("key", "bcc_recipients")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error || !data?.value) return [];

    const value = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return Array.isArray(value) ? value.filter((e: string) => e && e.includes("@")) : [];
  } catch (err) {
    console.error("[get-bcc-emails] Error fetching BCC emails:", err);
    return [];
  }
}
