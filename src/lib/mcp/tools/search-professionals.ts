import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_professionals",
  title: "Search professionals",
  description:
    "Search active mental-health professionals on Rede Bem-Estar by optional name or profession keyword. Returns public profile fields only.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Optional keyword matched against display name or profession."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Max results to return (default 10, hard cap 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const cap = Math.min(Math.max(limit ?? 10, 1), 25);
    let q = supabase
      .from("profiles")
      .select("id, display_name, profissao, resumo, foto_perfil_url")
      .eq("tipo_usuario", "profissional")
      .eq("ativo", true)
      .limit(cap);
    if (query && query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(`display_name.ilike.${term},profissao.ilike.${term}`);
    }
    const { data, error } = await q;
    if (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { professionals: data ?? [] },
    };
  },
});
