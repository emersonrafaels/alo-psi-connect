// Shared caller check for privileged edge functions.
// Validates the bearer token and reads roles from user_roles with the service client.
// deno-lint-ignore no-explicit-any
type SupabaseClient = any; // accepts clients from any supabase-js version

export const SITE_ADMIN_ROLES = ["admin", "super_admin"] as const;

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) { super(message); }
}

export interface Caller { userId: string; roles: string[] }

export async function getCaller(req: Request, admin: SupabaseClient): Promise<Caller> {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new AuthError(401, "Não autenticado");
  const { data, error } = await admin.auth.getUser(header.slice(7));
  if (error || !data.user) throw new AuthError(401, "Não autenticado");
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", data.user.id);
  return { userId: data.user.id, roles: (roles ?? []).map((r: { role: string }) => r.role) };
}

export const isSiteAdmin = (c: Caller) => c.roles.some((r) => (SITE_ADMIN_ROLES as readonly string[]).includes(r));

export async function requireSiteAdmin(req: Request, admin: SupabaseClient): Promise<Caller> {
  const caller = await getCaller(req, admin);
  if (!isSiteAdmin(caller)) throw new AuthError(403, "Sem permissão");
  return caller;
}

/** True when the caller is an active admin member of the given institution. */
export async function isInstitutionAdminOf(admin: SupabaseClient, userId: string, institutionId: string): Promise<boolean> {
  const { data } = await admin.from("institution_users").select("id")
    .eq("user_id", userId).eq("institution_id", institutionId).eq("role", "admin").eq("is_active", true).limit(1);
  return !!data?.length;
}

export function authErrorResponse(e: unknown, cors: Record<string, string>): Response | null {
  if (!(e instanceof AuthError)) return null;
  return new Response(JSON.stringify({ error: e.message }), { status: e.status, headers: { ...cors, "Content-Type": "application/json" } });
}
