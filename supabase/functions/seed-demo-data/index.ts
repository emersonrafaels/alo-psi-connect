import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Compact data arrays
const NAMES = ["Ana","Beatriz","Camila","Eduardo","Fernando","Gabriela","Helena","Igor","Julia","Leonardo","Mariana","Rafael","Thiago","Lucas","Bruno","Gustavo","Pedro"];
const SURNAMES = ["Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Almeida","Pereira","Lima","Gomes","Costa"];
const SPECS = [["TCC","Ansiedade"],["Psicanálise","Trauma"],["Neuropsicologia","TDAH"],["Terapia Familiar","Autoestima"]];
const TENANT_MEDCOS = "3a9ae5ec-50a9-4674-b808-7735e5f0afb5";
const DEMO_ADMIN_ID = "11111111-1111-1111-1111-111111111111";

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

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

// ── Emotion values per pattern ──

const EMOTION_VALUES_CONFIG: Record<string, {
  emotions: Record<string, [number, number]>; // [min, max] range
  generate?: (i: number, total: number) => Record<string, number>;
}> = {
  exam_stress: {
    emotions: { ansiedade: [3, 5], medo: [2, 4], frustração: [2, 4], preocupação: [3, 5], estresse: [3, 5] },
  },
  progressive_improvement: {
    emotions: {},
    generate: (i, total) => {
      const progress = total > 1 ? i / (total - 1) : 1;
      return {
        ansiedade: clamp(5 - progress * 4 + (Math.random() - 0.5), 1, 5),
        calma: clamp(1 + progress * 4 + (Math.random() - 0.5), 1, 5),
        esperança: clamp(1 + progress * 3 + (Math.random() - 0.5), 1, 5),
        gratidão: clamp(progress * 4 + (Math.random() - 0.5), 1, 5),
      };
    },
  },
  burnout: {
    emotions: { exaustão: [3, 5], desânimo: [3, 5], apatia: [2, 4], tristeza: [2, 4], irritação: [2, 3] },
  },
  healthy: {
    emotions: { calma: [3, 5], gratidão: [2, 4], motivação: [3, 5], alegria: [3, 5], equilíbrio: [3, 5] },
  },
  volatile: {
    emotions: {},
    generate: (i) => {
      const wave = Math.sin(i * 1.5);
      if (wave > 0) {
        return { alegria: rand(3, 5), motivação: rand(2, 4), calma: rand(2, 4) };
      }
      return { ansiedade: rand(3, 5), irritação: rand(2, 4), confusão: rand(2, 4) };
    },
  },
  random: {
    emotions: { ansiedade: [1, 4], calma: [1, 4], alegria: [1, 4], tristeza: [1, 3], motivação: [1, 4] },
  },
};

function generateEmotionValues(patternKey: string, i: number, total: number): Record<string, number> {
  const config = EMOTION_VALUES_CONFIG[patternKey] || EMOTION_VALUES_CONFIG.random;
  if (config.generate) return config.generate(i, total);
  const result: Record<string, number> = {};
  for (const [emotion, [min, max]] of Object.entries(config.emotions)) {
    result[emotion] = rand(min, max);
  }
  return result;
}

// ── Pattern-specific data ──

const PATTERN_CONFIG: Record<string, {
  tags: string[];
  journals: string[];
  generate: (index: number, total: number) => { mood: number; anxiety: number; energy: number; sleep: number };
}> = {
  exam_stress: {
    tags: ["#provas", "#estresse", "#ansiedade", "#pressão", "#estudos"],
    journals: [
      "Semana de provas, não consigo dormir direito.",
      "Muita pressão com as entregas.",
      "Ansiedade forte antes da prova.",
      "Não consegui me concentrar nos estudos.",
      "Estômago embrulhado de nervoso.",
      "Sinto que vou reprovar, muita coisa para estudar.",
    ],
    generate: (i, total) => {
      const isRecentWeek = i >= total - 7;
      if (isRecentWeek) {
        return { mood: rand(1, 2), anxiety: rand(4, 5), energy: rand(1, 3), sleep: rand(3, 5) };
      }
      return { mood: rand(3, 4), anxiety: rand(2, 3), energy: rand(3, 4), sleep: rand(6, 8) };
    },
  },
  progressive_improvement: {
    tags: ["#terapia", "#progresso", "#autoconhecimento", "#melhora", "#gratidão"],
    journals: [
      "Comecei a terapia, me sinto vulnerável.",
      "Hoje foi um pouco melhor que ontem.",
      "Percebi um padrão no meu comportamento.",
      "Estou dormindo melhor com a nova rotina.",
      "Me sinto mais leve depois da sessão.",
      "Dia bom! Consegui lidar com a ansiedade.",
      "Gratidão pelo progresso que estou fazendo.",
    ],
    generate: (i, total) => {
      const progress = total > 1 ? i / (total - 1) : 1;
      return {
        mood: clamp(1 + progress * 4 + (Math.random() - 0.5), 1, 5),
        anxiety: clamp(5 - progress * 4 + (Math.random() - 0.5), 1, 5),
        energy: clamp(2 + progress * 3 + (Math.random() - 0.5), 1, 5),
        sleep: clamp(4 + progress * 4 + (Math.random() - 0.5), 3, 9),
      };
    },
  },
  burnout: {
    tags: ["#esgotamento", "#cansaço", "#sobrecarga", "#exaustão", "#desmotivação"],
    journals: [
      "Não tenho energia pra nada.",
      "Mais um dia arrastado.",
      "Corpo e mente exaustos.",
      "Não consigo me motivar para estudar.",
      "Tudo parece demais.",
      "Dormi mal de novo, insônia crônica.",
    ],
    generate: () => ({
      mood: rand(1, 3),
      anxiety: rand(3, 4),
      energy: rand(1, 2),
      sleep: rand(4, 6),
    }),
  },
  healthy: {
    tags: ["#calma", "#foco", "#equilíbrio", "#bem-estar", "#rotina"],
    journals: [
      "Dia produtivo e equilibrado.",
      "Boa noite de sono, acordei disposto(a).",
      "Meditação pela manhã ajudou muito.",
      "Me sinto em paz hoje.",
      "Estudos fluindo bem, sem ansiedade.",
      "Exercício físico + alimentação boa = dia top.",
    ],
    generate: () => ({
      mood: rand(3, 5),
      anxiety: rand(1, 2),
      energy: rand(3, 5),
      sleep: rand(7, 9),
    }),
  },
  volatile: {
    tags: ["#ansiedade", "#calma", "#foco", "#estresse", "#alívio", "#confuso"],
    journals: [
      "Altos e baixos o dia todo.",
      "Comecei bem mas depois desandou.",
      "Humor instável, não sei o que sinto.",
      "Explosão emocional seguida de culpa.",
      "De repente ficou tudo bem.",
      "Oscilando entre motivação e desânimo.",
    ],
    generate: (i, total) => {
      const wave = Math.sin(i * 1.5) * 2 + (Math.random() - 0.5) * 2;
      const mood = clamp(3 + wave, 1, 5);
      return {
        mood,
        anxiety: clamp(6 - mood + (Math.random() - 0.5), 1, 5),
        energy: clamp(mood + (Math.random() - 0.5), 1, 5),
        sleep: clamp(5 + wave * 0.8, 3, 9),
      };
    },
  },
  random: {
    tags: ["#ansiedade", "#calma", "#foco", "#estudos", "#provas", "#tcc"],
    journals: ["Dia produtivo.", "Ansiedade pela manhã.", "Boa noite de sono.", "Aulas intensas.", "Meditação ajudou.", "Dia estressante."],
    generate: () => ({
      mood: rand(1, 5),
      anxiety: rand(1, 5),
      energy: rand(1, 5),
      sleep: rand(4, 9),
    }),
  },
};

// ── Triage config per pattern ──

const TRIAGE_CONFIG: Record<string, { risk: string; priority: string; action: string; notes: string }> = {
  exam_stress: { risk: "high", priority: "urgent", action: "Encaminhar para acolhimento psicológico", notes: "[DEMO] Aluno apresenta sinais de estresse acadêmico intenso" },
  burnout: { risk: "high", priority: "high", action: "Agendar sessão de acompanhamento", notes: "[DEMO] Esgotamento emocional identificado nos registros" },
  volatile: { risk: "medium", priority: "medium", action: "Monitorar evolução emocional", notes: "[DEMO] Oscilações emocionais frequentes observadas" },
  progressive_improvement: { risk: "low", priority: "low", action: "Manter acompanhamento", notes: "[DEMO] Aluno em melhora progressiva" },
  healthy: { risk: "low", priority: "low", action: "Nenhuma ação necessária", notes: "[DEMO] Aluno com indicadores saudáveis" },
  random: { risk: "medium", priority: "medium", action: "Avaliar necessidade de suporte", notes: "[DEMO] Padrão emocional variável" },
};

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

async function seedMoodEntries(supabase: any, students: any[], entriesPerStudent: number, tenantId: string, patterns: string[]) {
  const validPatterns = patterns.filter(p => PATTERN_CONFIG[p]);
  if (!validPatterns.length) validPatterns.push("random");

  console.log(`[seed] Creating ~${students.length * entriesPerStudent} mood entries with patterns: ${validPatterns.join(", ")}`);
  let total = 0;

  for (let si = 0; si < students.length; si++) {
    const s = students[si];
    const patternKey = validPatterns[si % validPatterns.length];
    const config = PATTERN_CONFIG[patternKey];

    for (let i = 0; i < entriesPerStudent; i++) {
      const values = config.generate(i, entriesPerStudent);
      const daysAgo = entriesPerStudent - i;
      const date = new Date(Date.now() - daysAgo * 86400000);
      const emotionValues = generateEmotionValues(patternKey, i, entriesPerStudent);

      await supabase.from("mood_entries").insert({
        profile_id: s.profile.id, tenant_id: tenantId,
        date: date.toISOString().split("T")[0],
        mood_score: values.mood,
        anxiety_level: values.anxiety,
        energy_level: values.energy,
        sleep_hours: values.sleep,
        sleep_quality: values.mood,
        journal_text: pick(config.journals),
        tags: pickN(config.tags, 2),
        emotion_values: emotionValues,
      });
      total++;
    }
  }
  return total;
}

async function seedTriageRecords(supabase: any, instId: string, students: any[], patterns: string[]) {
  const validPatterns = patterns.filter(p => TRIAGE_CONFIG[p]);
  if (!validPatterns.length) validPatterns.push("random");

  console.log(`[seed] Creating triage records for ${students.length} students`);
  let total = 0;
  const statuses = ["triaged", "in_progress", "resolved"];

  for (let si = 0; si < students.length; si++) {
    const s = students[si];
    const patternKey = validPatterns[si % validPatterns.length];
    const triageConf = TRIAGE_CONFIG[patternKey];
    const recordCount = rand(1, 2);

    for (let r = 0; r < recordCount; r++) {
      const daysAgo = rand(3, 30);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);
      const status = statuses[rand(0, 2)];
      const resolvedAt = status === "resolved" ? new Date(createdAt.getTime() + rand(1, 7) * 86400000) : null;
      const followUpDate = status !== "resolved" ? new Date(Date.now() + rand(1, 14) * 86400000) : null;

      await supabase.from("student_triage").insert({
        patient_id: s.patient.id,
        institution_id: instId,
        triaged_by: DEMO_ADMIN_ID,
        status,
        risk_level: triageConf.risk,
        priority: triageConf.priority,
        recommended_action: triageConf.action,
        notes: `${triageConf.notes} (registro ${r + 1})`,
        created_at: createdAt.toISOString(),
        updated_at: (resolvedAt || createdAt).toISOString(),
        resolved_at: resolvedAt?.toISOString() || null,
        follow_up_date: followUpDate?.toISOString().split("T")[0] || null,
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
      // Clean up triage records for demo patients
      await supabase.from("student_triage").delete().in("patient_id", pIds);
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

    const { action, institution_id, institution_name, institution_type = "private", professionals_count, students_count, mood_entries_per_student, tenant_id = TENANT_MEDCOS, data_patterns = ["random"] } = await req.json();
    const safeProfCount = professionals_count || 5;
    const safeStudentCount = students_count || 10;
    const safeMoodCount = mood_entries_per_student || 12;
    console.log(`[seed] Action: ${action}, Institution: ${institution_name || institution_id}, Profs: ${safeProfCount}, Students: ${safeStudentCount}, Mood: ${safeMoodCount}, Patterns: ${data_patterns}`);

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
      const profs = await seedProfessionals(supabase, instId, instName, safeProfCount, tenant_id);
      details.professionals = profs.length;
      const students = await seedStudents(supabase, instId, instName, safeStudentCount, tenant_id);
      details.students = students.length;
      details.coupons = await seedCoupons(supabase, instId, instName, tenant_id);
      details.mood_entries = await seedMoodEntries(supabase, students, safeMoodCount, tenant_id, data_patterns);
      details.triage_records = await seedTriageRecords(supabase, instId, students, data_patterns);
      details.appointments = await seedAppointments(supabase, instName, profs, students, tenant_id);
      details.patterns_used = data_patterns;
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
