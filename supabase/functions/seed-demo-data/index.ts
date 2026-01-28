import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Compact data arrays
const NAMES = ["Ana","Beatriz","Camila","Eduardo","Fernando","Gabriela","Helena","Igor","Julia","Leonardo","Mariana","Rafael","Thiago","Lucas","Bruno","Gustavo","Pedro"];
const SURNAMES = ["Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Almeida","Pereira","Lima","Gomes","Costa"];
const SPECS = [["TCC","Ansiedade"],["Psicanálise","Trauma"],["Neuropsicologia","TDAH"],["Terapia Familiar","Autoestima"]];
const TAGS = ["#ansiedade","#calma","#foco","#estudos","#provas","#tcc"];
const JOURNALS = ["Dia produtivo.","Ansiedade pela manhã.","Boa noite de sono.","Aulas intensas.","Meditação ajudou.","Dia estressante."];
const TENANT_MEDCOS = "3a9ae5ec-50a9-4674-b808-7735e5f0afb5";

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

function genName() {
  const f = pick(NAMES), l1 = pick(SURNAMES), l2 = pick(SURNAMES.filter(s => s !== l1));
  return { first: f, full: `${f} ${l1} ${l2}`, login: `${f.toLowerCase()}.${l1.toLowerCase()}` };
}

function genDomain(name: string): string {
  const m = name.match(/\(([^)]+)\)/);
  if (m) return `${m[1].toLowerCase().replace(/\s+/g, '')}.edu.br`;
  return `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ')[0]}.edu.br`;
}

function genMarker(name: string): string {
  const m = name.match(/\(([^)]+)\)/);
  return `[DEMO-${m ? m[1].toUpperCase() : name.toUpperCase().slice(0, 8)}]`;
}

function pastDate(days: number): Date {
  return new Date(Date.now() - Math.floor(Math.random() * days) * 86400000);
}

function futureDate(days: number): Date {
  return new Date(Date.now() + (Math.floor(Math.random() * days) + 1) * 86400000);
}

async function seedProfessionals(supabase: any, instId: string, instName: string, count: number, tenantId: string) {
  const marker = genMarker(instName), domain = genDomain(instName), profs = [];
  console.log(`[seed] Creating ${count} professionals`);

  for (let i = 0; i < count; i++) {
    const n = genName(), spec = pick(SPECS), price = 80 + Math.floor(Math.random() * 120);
    const email = `${n.login}@${domain}`, displayName = `Dr(a). ${n.full}`;
    const fakeUserId = 99000 + (Date.now() % 100000) + i;

    const { data: profile } = await supabase.from("profiles").insert({
      nome: n.full, email, tipo_usuario: "profissional", tenant_id: tenantId
    }).select().single();
    if (!profile) continue;

    const { data: prof } = await supabase.from("profissionais").insert({
      profile_id: profile.id, user_id: fakeUserId, user_login: n.login.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      user_email: email, display_name: displayName, first_name: n.first,
      profissao: "Psicólogo(a)", crp_crm: `CRP ${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}/${Math.floor(Math.random() * 900000) + 100000}`,
      preco_consulta: price, resumo: `${marker} Especialista em ${spec.join(", ")}.`,
      servicos_normalizados: spec, ativo: true, em_destaque: i < 2, ordem_destaque: i < 2 ? i + 1 : null
    }).select().single();
    if (!prof) continue;

    await supabase.from("professional_institutions").insert({
      professional_id: prof.id, institution_id: instId, relationship_type: i % 3 === 0 ? "employee" : "partner",
      is_active: true, start_date: pastDate(365).toISOString().split("T")[0]
    });
    await supabase.from("professional_tenants").insert({
      professional_id: prof.id, tenant_id: tenantId, is_featured: i < 2, featured_order: i < 2 ? i + 1 : null
    });
    profs.push(prof);
  }
  return profs;
}

async function seedStudents(supabase: any, instId: string, instName: string, count: number, tenantId: string) {
  const domain = genDomain(instName), students = [];
  console.log(`[seed] Creating ${count} students`);

  for (let i = 0; i < count; i++) {
    const n = genName(), email = `${n.login}@${domain}`;
    const tel = `(${10 + Math.floor(Math.random() * 90)}) 9${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const { data: profile } = await supabase.from("profiles").insert({
      nome: n.full, email, tipo_usuario: "paciente", tenant_id: tenantId
    }).select().single();
    if (!profile) continue;

    const { data: patient } = await supabase.from("pacientes").insert({
      profile_id: profile.id, eh_estudante: true, instituicao_ensino: instName, tenant_id: tenantId
    }).select().single();
    if (!patient) continue;

    await supabase.from("patient_institutions").insert({
      patient_id: patient.id, institution_id: instId, enrollment_status: "enrolled",
      enrollment_date: pastDate(365).toISOString().split("T")[0]
    });
    students.push({ profile: { ...profile, telefone: tel }, patient });
  }
  return students;
}

async function seedCoupons(supabase: any, instId: string, instName: string, tenantId: string) {
  const m = instName.match(/\(([^)]+)\)/), acronym = m ? m[1].toUpperCase() : instName.toUpperCase().slice(0, 6);
  console.log(`[seed] Creating coupons`);

  const coupons = [
    { code: `${acronym}-WELCOME`, name: "Boas-vindas", discount_type: "percentage", discount_value: 20 },
    { code: `${acronym}-FIRST`, name: "Primeira Sessão", discount_type: "fixed_amount", discount_value: 40 },
  ];

  for (const c of coupons) {
    await supabase.from("institution_coupons").insert({
      institution_id: instId, tenant_id: tenantId, code: c.code, name: c.name,
      description: `[DEMO] ${c.name}`, discount_type: c.discount_type, discount_value: c.discount_value,
      target_audience: "all", is_active: true, valid_from: new Date().toISOString(),
      valid_until: "2026-12-31T23:59:59Z", maximum_uses: 100, uses_per_user: 1
    });
  }
  return coupons.length;
}

async function seedMoodEntries(supabase: any, students: any[], entriesPerStudent: number, tenantId: string) {
  console.log(`[seed] Creating ~${students.length * entriesPerStudent} mood entries`);
  let total = 0;
  for (const s of students) {
    for (let i = 0; i < entriesPerStudent; i++) {
      await supabase.from("mood_entries").insert({
        profile_id: s.profile.id, tenant_id: tenantId,
        date: pastDate(30).toISOString().split("T")[0],
        mood_score: Math.floor(Math.random() * 5) + 1,
        anxiety_level: Math.floor(Math.random() * 5) + 1,
        energy_level: Math.floor(Math.random() * 5) + 1,
        sleep_hours: Math.floor(Math.random() * 5) + 4,
        journal_text: pick(JOURNALS), tags: pickN(TAGS, 2)
      });
      total++;
    }
  }
  return total;
}

async function seedAppointments(supabase: any, instName: string, profs: any[], students: any[], tenantId: string) {
  if (!profs.length || !students.length) return 0;
  const marker = genMarker(instName);
  console.log(`[seed] Creating appointments`);
  let count = 0;
  const configs = [
    { status: "realizado", n: 10, past: true },
    { status: "confirmado", n: 5, past: false },
    { status: "pendente", n: 3, past: false }
  ];

  for (const cfg of configs) {
    for (let i = 0; i < cfg.n; i++) {
      const prof = pick(profs), stu = pick(students);
      const date = cfg.past ? pastDate(60) : futureDate(30);
      const hour = 8 + Math.floor(Math.random() * 10);

      await supabase.from("agendamentos").insert({
        professional_id: prof.id, user_id: stu.profile.id, tenant_id: tenantId,
        nome_paciente: stu.profile.nome, email_paciente: stu.profile.email,
        telefone_paciente: stu.profile.telefone || "(00) 00000-0000",
        data_consulta: date.toISOString().split("T")[0],
        horario: `${String(hour).padStart(2, '0')}:00:00`,
        status: cfg.status, valor: prof.preco_consulta,
        observacoes: `${marker} Demo`
      });
      count++;
    }
  }
  return count;
}

async function cleanup(supabase: any, instId: string, instName: string) {
  const marker = genMarker(instName), domain = genDomain(instName);
  console.log(`[seed] Cleanup for ${instName}`);

  await supabase.from("institution_coupons").delete().eq("institution_id", instId).ilike("description", "%[DEMO]%");

  const { data: profLinks } = await supabase.from("professional_institutions").select("professional_id").eq("institution_id", instId);
  if (profLinks?.length) {
    const ids = profLinks.map((p: any) => p.professional_id);
    await supabase.from("agendamentos").delete().in("professional_id", ids).ilike("observacoes", `%${marker}%`);
    
    const { data: demoProfs } = await supabase.from("profissionais").select("id, profile_id").in("id", ids).ilike("resumo", `%${marker}%`);
    if (demoProfs?.length) {
      const pIds = demoProfs.map((p: any) => p.id), profileIds = demoProfs.map((p: any) => p.profile_id).filter(Boolean);
      await supabase.from("professional_institutions").delete().in("professional_id", pIds);
      await supabase.from("professional_tenants").delete().in("professional_id", pIds);
      await supabase.from("profissionais").delete().in("id", pIds);
      if (profileIds.length) await supabase.from("profiles").delete().in("id", profileIds);
    }
  }

  const { data: patLinks } = await supabase.from("patient_institutions").select("patient_id").eq("institution_id", instId);
  if (patLinks?.length) {
    const ids = patLinks.map((p: any) => p.patient_id);
    const { data: demoPats } = await supabase.from("pacientes").select("id, profile_id").in("id", ids).eq("instituicao_ensino", instName);
    if (demoPats?.length) {
      const pIds = demoPats.map((p: any) => p.id), profileIds = demoPats.map((p: any) => p.profile_id).filter(Boolean);
      if (profileIds.length) await supabase.from("mood_entries").delete().in("profile_id", profileIds);
      await supabase.from("patient_institutions").delete().in("patient_id", pIds);
      await supabase.from("pacientes").delete().in("id", pIds);
      if (profileIds.length) await supabase.from("profiles").delete().in("id", profileIds);
    }
  }
  return { success: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });

    const { data: claims } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action, institution_id, institution_name, institution_type = "private", professionals_count = 5, students_count = 10, mood_entries_per_student = 12, tenant_id = TENANT_MEDCOS } = await req.json();
    console.log(`[seed] Action: ${action}, Institution: ${institution_name || institution_id}`);

    let instId = institution_id, instName = institution_name;

    if (action === "create_institution" && institution_name) {
      const { data: newInst, error } = await supabase.from("educational_institutions").insert({
        name: institution_name, type: institution_type, is_active: true, has_partnership: true,
        can_manage_users: true, can_manage_coupons: true, can_manage_professionals: true
      }).select().single();
      if (error) throw new Error(`Failed to create institution: ${error.message}`);
      instId = newInst.id;
      instName = newInst.name;
    }

    if (instId && !instName) {
      const { data: inst } = await supabase.from("educational_institutions").select("name").eq("id", instId).single();
      instName = inst?.name || "Unknown";
    }

    if (!instId) throw new Error("institution_id or institution_name is required");

    const details: any = {};

    if (action === "create_institution" || action === "seed_all") {
      if (action === "seed_all") await cleanup(supabase, instId, instName);
      const profs = await seedProfessionals(supabase, instId, instName, professionals_count, tenant_id);
      details.professionals = profs.length;
      const students = await seedStudents(supabase, instId, instName, students_count, tenant_id);
      details.students = students.length;
      details.coupons = await seedCoupons(supabase, instId, instName, tenant_id);
      details.mood_entries = await seedMoodEntries(supabase, students, mood_entries_per_student, tenant_id);
      details.appointments = await seedAppointments(supabase, instName, profs, students, tenant_id);
    } else if (action === "cleanup") {
      await cleanup(supabase, instId, instName);
      details.cleaned = true;
    }

    return new Response(JSON.stringify({ success: true, message: `"${action}" executada para ${instName}`, details, institution_id: instId, institution_name: instName }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("[seed] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
