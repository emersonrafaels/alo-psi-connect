import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_upcoming_group_sessions",
  title: "List upcoming group sessions",
  description:
    "List upcoming public group sessions (encontros) on Rede Bem-Estar, ordered by start date.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .optional()
      .describe("Max sessions to return (default 10, hard cap 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const cap = Math.min(Math.max(limit ?? 10, 1), 50);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("group_sessions")
      .select("id, title, description, session_date, start_time, duration_minutes, max_participants, current_registrations, professional:profissionais!group_sessions_professional_id_fkey(display_name)")
      .gte("session_date", today)
      .in("status", ["scheduled", "live"])
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(cap);
    if (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { sessions: data ?? [] },
    };
  },
});
