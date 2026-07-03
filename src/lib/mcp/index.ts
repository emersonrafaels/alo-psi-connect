import { defineMcp } from "@lovable.dev/mcp-js";
import searchProfessionalsTool from "./tools/search-professionals";
import listUpcomingGroupSessionsTool from "./tools/list-upcoming-group-sessions";

export default defineMcp({
  name: "rede-bem-estar-mcp",
  title: "Rede Bem-Estar MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Rede Bem-Estar mental-health platform. Use `search_professionals` to find active professionals by name or profession, and `list_upcoming_group_sessions` to browse upcoming public group sessions (encontros).",
  tools: [searchProfessionalsTool, listUpcomingGroupSessionsTool],
});
