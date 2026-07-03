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
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("group_sessions")
      .select("id, title, description, start_at, duration_minutes, host_name, capacity")
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true })
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
