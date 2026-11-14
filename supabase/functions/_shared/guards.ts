// Shared request guards for edge functions (see AGENTS.md: security rules).
// deno-lint-ignore no-explicit-any
type SupabaseClient = any; // accepts clients from any supabase-js version
import { AuthError, getCaller, isSiteAdmin, type Caller } from "./require-admin.ts";

export { AuthError, authErrorResponse, getCaller, isSiteAdmin, requireSiteAdmin } from "./require-admin.ts";
export type { Caller } from "./require-admin.ts";

/** Escape a value before interpolating it into an HTML email. */
export function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Only http(s) URLs survive; anything else becomes "#". */
export function safeUrl(v: unknown): string {
  const s = String(v ?? "").trim();
  return /^https?:\/\//i.test(s) ? escapeHtml(s) : "#";
}

function bearer(req: Request): string {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

/** True when the request carries the project's service-role key (cron jobs, internal calls). */
export async function isServiceCall(req: Request, admin: SupabaseClient): Promise<boolean> {
  const token = bearer(req);
  if (!token) return false;
  const env = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (env && token === env) return true;
  try {
    const { data } = await admin.rpc("cron_service_key");
    return typeof data === "string" && data.length > 0 && token === data;
  } catch { return false; }
}

/** Cron/internal callers or site admins only. Returns the admin caller, or null for service calls. */
export async function requireServiceOrAdmin(req: Request, admin: SupabaseClient): Promise<Caller | null> {
  if (await isServiceCall(req, admin)) return null;
  const caller = await getCaller(req, admin);
  if (!isSiteAdmin(caller)) throw new AuthError(403, "Sem permissão");
  return caller;
}

/** Any signed-in user (service calls are rejected unless allowService). */
export async function requireUser(req: Request, admin: SupabaseClient): Promise<Caller> {
  return await getCaller(req, admin);
}

/** True if the caller owns the appointment (patient user, booking email, or the professional) or is a site admin. */
export async function canAccessAppointment(admin: SupabaseClient, caller: Caller, appointmentId: string): Promise<boolean> {
  if (isSiteAdmin(caller)) return true;
  const { data: a } = await admin.from("agendamentos").select("id, user_id, email_paciente, professional_id").eq("id", appointmentId).maybeSingle();
  if (!a) return false;
  if (a.user_id && a.user_id === caller.userId) return true;
  const { data: u } = await admin.auth.admin.getUserById(caller.userId);
  const email = u?.user?.email?.toLowerCase();
  if (email && a.email_paciente && String(a.email_paciente).toLowerCase() === email) return true;
  if (a.professional_id) {
    const { data: p } = await admin.from("profissionais").select("profile_id, profiles:profile_id(user_id)").eq("id", a.professional_id).maybeSingle();
    // deno-lint-ignore no-explicit-any
    if ((p as any)?.profiles?.user_id === caller.userId) return true;
  }
  return false;
}

export function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
