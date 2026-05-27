import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function checkAccess(admin: any, userId: string): Promise<boolean> {
  // Super admin always allowed
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["super_admin", "admin"])
    .maybeSingle();
  if (roleRow) return true;

  const { data: cfg } = await admin
    .from("system_configurations")
    .select("value")
    .eq("category", "admin_access")
    .eq("key", "patient_full_view_allowed_users")
    .is("tenant_id", null)
    .maybeSingle();

  if (!cfg) return false;
  let list: string[] = [];
  try {
    list = typeof cfg.value === "string" ? JSON.parse(cfg.value) : cfg.value;
  } catch {
    list = [];
  }
  return Array.isArray(list) && list.includes(userId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const callerId = userData.user.id;
    const allowed = await checkAccess(admin, callerId);
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || "list";

    if (action === "list") {
      const search = (body.search || "").trim().toLowerCase();
      const page = Math.max(0, Number(body.page) || 0);
      const pageSize = Math.min(200, Math.max(10, Number(body.pageSize) || 50));

      // Build base profile query
      let q = admin
        .from("profiles")
        .select(
          "id, user_id, nome, email, data_nascimento, genero, foto_perfil_url, created_at, tenant_id, raca, sexualidade, cpf, como_conheceu",
          { count: "exact" },
        )
        .eq("tipo_usuario", "paciente")
        .order("created_at", { ascending: false });

      if (search) {
        q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }
      q = q.range(page * pageSize, page * pageSize + pageSize - 1);

      const { data: profiles, error: pErr, count } = await q;
      if (pErr) return json({ error: pErr.message }, 500);

      const userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean);
      const profileIds = (profiles || []).map((p: any) => p.id);

      // last_sign_in_at via admin API (batch)
      const lastLoginMap: Record<string, string | null> = {};
      const emailConfirmedMap: Record<string, string | null> = {};
      // The admin.listUsers API is paginated globally; instead fetch user-by-user (small page)
      await Promise.all(
        userIds.map(async (uid: string) => {
          const { data } = await admin.auth.admin.getUserById(uid);
          lastLoginMap[uid] = (data?.user as any)?.last_sign_in_at || null;
          emailConfirmedMap[uid] = (data?.user as any)?.email_confirmed_at || null;
        }),
      );

      // pacientes records
      const { data: pacientes } = await admin
        .from("pacientes")
        .select("id, profile_id, eh_estudante, instituicao_ensino")
        .in("profile_id", profileIds);
      const pacByProfile: Record<string, any> = {};
      (pacientes || []).forEach((p: any) => (pacByProfile[p.profile_id] = p));
      const patientIds = (pacientes || []).map((p: any) => p.id);

      // Institutions
      const instByPatient: Record<string, any[]> = {};
      if (patientIds.length) {
        const { data: pis } = await admin
          .from("patient_institutions")
          .select(
            "patient_id, enrollment_status, educational_institutions(name, type)",
          )
          .in("patient_id", patientIds);
        (pis || []).forEach((row: any) => {
          (instByPatient[row.patient_id] ||= []).push({
            name: row.educational_institutions?.name,
            type: row.educational_institutions?.type,
            status: row.enrollment_status,
          });
        });
      }

      // Mood entries counts + last
      const moodAgg: Record<string, { total: number; last30: number; last_date: string | null }> = {};
      if (userIds.length) {
        const { data: moods } = await admin
          .from("mood_entries")
          .select("user_id, date")
          .in("user_id", userIds);
        const thirtyAgo = new Date();
        thirtyAgo.setDate(thirtyAgo.getDate() - 30);
        (moods || []).forEach((m: any) => {
          const a = (moodAgg[m.user_id] ||= { total: 0, last30: 0, last_date: null });
          a.total += 1;
          const d = new Date(m.date);
          if (d >= thirtyAgo) a.last30 += 1;
          if (!a.last_date || d > new Date(a.last_date)) a.last_date = m.date;
        });
      }

      // Group session registrations
      const sessionAgg: Record<string, { upcoming: number; past: number }> = {};
      if (userIds.length) {
        const today = new Date().toISOString().slice(0, 10);
        const { data: regs } = await admin
          .from("group_session_registrations")
          .select("user_id, status, group_sessions(session_date)")
          .in("user_id", userIds)
          .eq("status", "confirmed");
        (regs || []).forEach((r: any) => {
          const a = (sessionAgg[r.user_id] ||= { upcoming: 0, past: 0 });
          const d = r.group_sessions?.session_date;
          if (!d) return;
          if (d >= today) a.upcoming += 1;
          else a.past += 1;
        });
      }

      // 1:1 appointments counts
      const apptAgg: Record<string, { upcoming: number; past: number }> = {};
      if (userIds.length) {
        const today = new Date().toISOString().slice(0, 10);
        const { data: appts } = await admin
          .from("agendamentos")
          .select("user_id, data_consulta, status")
          .in("user_id", userIds);
        (appts || []).forEach((a: any) => {
          const x = (apptAgg[a.user_id] ||= { upcoming: 0, past: 0 });
          if (!a.data_consulta) return;
          const cancelled = ["cancelado", "rejeitado"].includes(a.status || "");
          if (cancelled) return;
          if (a.data_consulta >= today) x.upcoming += 1;
          else x.past += 1;
        });
      }

      const rows = (profiles || []).map((p: any) => {
        const pac = pacByProfile[p.id];
        return {
          profile_id: p.id,
          user_id: p.user_id,
          nome: p.nome,
          email: p.email,
          data_nascimento: p.data_nascimento,
          genero: p.genero,
          foto_perfil_url: p.foto_perfil_url,
          created_at: p.created_at,
          last_sign_in_at: lastLoginMap[p.user_id] || null,
          email_confirmed_at: emailConfirmedMap[p.user_id] || null,
          tenant_id: p.tenant_id,
          patient_id: pac?.id || null,
          eh_estudante: pac?.eh_estudante || false,
          institutions: pac ? instByPatient[pac.id] || [] : [],
          mood: moodAgg[p.user_id] || { total: 0, last30: 0, last_date: null },
          sessions: sessionAgg[p.user_id] || { upcoming: 0, past: 0 },
          appointments: apptAgg[p.user_id] || { upcoming: 0, past: 0 },
        };
      });

      return json({ rows, total: count || 0, page, pageSize });
    }

    if (action === "detail") {
      const profileId = body.profile_id;
      if (!profileId) return json({ error: "profile_id required" }, 400);

      const { data: profile } = await admin
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();
      if (!profile) return json({ error: "not found" }, 404);

      const { data: authUser } = await admin.auth.admin.getUserById(profile.user_id);

      const { data: paciente } = await admin
        .from("pacientes")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();

      const patientId = paciente?.id;

      const [emergencyRes, institutionsRes, moodsRes, analysesRes, registrationsRes, appointmentsRes, tenantsRes] =
        await Promise.all([
          patientId
            ? admin.from("patient_emergency_contacts").select("*").eq("patient_id", patientId)
            : Promise.resolve({ data: [] }),
          patientId
            ? admin
                .from("patient_institutions")
                .select("*, educational_institutions(id, name, type, has_partnership)")
                .eq("patient_id", patientId)
            : Promise.resolve({ data: [] }),
          admin
            .from("mood_entries")
            .select("*")
            .eq("user_id", profile.user_id)
            .order("date", { ascending: false })
            .limit(180),
          admin
            .from("mood_entry_analyses")
            .select("*")
            .eq("user_id", profile.user_id)
            .order("created_at", { ascending: false })
            .limit(180),
          admin
            .from("group_session_registrations")
            .select(
              "*, group_sessions(id, title, session_date, start_time, duration_minutes, session_type, professional_id, profissionais(display_name))",
            )
            .eq("user_id", profile.user_id)
            .order("registered_at", { ascending: false }),
          admin
            .from("agendamentos")
            .select("*, profissionais(display_name)")
            .eq("user_id", profile.user_id)
            .order("data_consulta", { ascending: false })
            .limit(200),
          admin
            .from("user_tenants")
            .select("*, tenants(id, name, slug)")
            .eq("user_id", profile.user_id),
        ]);

      return json({
        profile,
        auth: {
          last_sign_in_at: (authUser?.user as any)?.last_sign_in_at || null,
          email_confirmed_at: (authUser?.user as any)?.email_confirmed_at || null,
          created_at: (authUser?.user as any)?.created_at || null,
          providers: (authUser?.user as any)?.app_metadata?.providers || [],
        },
        paciente,
        emergency_contacts: emergencyRes.data || [],
        institutions: institutionsRes.data || [],
        mood_entries: moodsRes.data || [],
        mood_analyses: analysesRes.data || [],
        group_registrations: registrationsRes.data || [],
        appointments: appointmentsRes.data || [],
        tenants: tenantsRes.data || [],
      });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("admin-patients-overview error:", e);
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
