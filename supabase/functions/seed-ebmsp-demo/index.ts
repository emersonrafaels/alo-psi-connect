import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INSTITUTION_NAME = "EBMSP - Escola Bahiana de Medicina e Saúde Pública";
const TENANT_ID = "472db0ac-0f45-4998-97da-490bc579efb1";
const ADMIN_EMAIL = "wixivir268@bowlfuel.com";
const ADMIN_NAME = "Administrador EBMSP";
const MARKER = "[DEMO-EBMSP]";
const STUDENT_COUNT = 100;
const PROFESSIONAL_COUNT = 8;

const firstNames = [
  "Alice", "Amanda", "Ana", "Arthur", "Beatriz", "Bianca", "Bruno", "Caio", "Camila", "Carolina",
  "Clara", "Daniel", "Davi", "Eduarda", "Elisa", "Emanuel", "Felipe", "Fernanda", "Gabriel", "Gabriela",
  "Giovana", "Guilherme", "Heitor", "Helena", "Igor", "Isabela", "Joana", "João", "Júlia", "Larissa",
  "Laura", "Leonardo", "Letícia", "Lucas", "Luiza", "Manuela", "Marcelo", "Mariana", "Mateus", "Miguel",
  "Natália", "Nicolas", "Pedro", "Rafael", "Raquel", "Renata", "Sofia", "Thiago", "Valentina", "Vinícius",
];
const lastNames = ["Almeida", "Andrade", "Barbosa", "Cardoso", "Carvalho", "Costa", "Ferreira", "Gomes", "Lima", "Macedo", "Matos", "Mendes", "Moreira", "Nascimento", "Oliveira", "Pereira", "Ribeiro", "Rocha", "Santana", "Santos", "Silva", "Souza", "Teixeira", "Vieira"];
const patterns = ["stable", "exam_stress", "improving", "burnout", "volatile"] as const;
type Pattern = typeof patterns[number];

const journalByPattern: Record<Pattern, string[]> = {
  stable: ["Consegui organizar bem a rotina de estudos hoje.", "Dia produtivo e equilibrado.", "A prática de respiração me ajudou a manter o foco."],
  exam_stress: ["A proximidade das avaliações aumentou minha ansiedade.", "Estou preocupado com o volume de conteúdo.", "Foi difícil desacelerar depois dos estudos."],
  improving: ["Hoje consegui lidar melhor com a pressão.", "Percebi uma melhora gradual no meu sono.", "Pedir ajuda deixou o dia mais leve."],
  burnout: ["Senti muito cansaço e pouca energia para estudar.", "A rotina pareceu pesada hoje.", "Preciso encontrar espaço para descansar."],
  volatile: ["Meu humor oscilou bastante ao longo do dia.", "Comecei bem, mas terminei o dia mais tenso.", "Tive momentos de foco e outros de muita preocupação."],
};

const clamp = (value: number, min = 1, max = 5) => Math.max(min, Math.min(max, Math.round(value)));
const dateAgo = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};
const timestampAgo = (days: number, hour = 12) => `${dateAgo(days)}T${String(hour).padStart(2, "0")}:00:00.000Z`;
const deterministic = (seed: number) => {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
};

function studentIdentity(index: number) {
  const first = firstNames[index % firstNames.length];
  const last = lastNames[(index * 7) % lastNames.length];
  const second = lastNames[(index * 11 + 3) % lastNames.length];
  const suffix = String(index + 1).padStart(3, "0");
  return { name: `${first} ${last} ${second}`, email: `aluno.demo.${suffix}@ebmsp.demo.redebemestar.com.br` };
}

function moodFor(pattern: Pattern, chronologicalIndex: number, total: number, seed: number) {
  const noise = deterministic(seed) - 0.5;
  const progress = chronologicalIndex / Math.max(total - 1, 1);
  if (pattern === "stable") return { mood: clamp(4 + noise), anxiety: clamp(2 + noise), energy: clamp(4 + noise), sleep: clamp(4 + noise) };
  if (pattern === "exam_stress") {
    const recentPressure = progress > 0.68 ? 1.5 : 0;
    return { mood: clamp(3 - recentPressure + noise), anxiety: clamp(3 + recentPressure + noise), energy: clamp(3 - recentPressure / 2 + noise), sleep: clamp(3 - recentPressure / 2 + noise) };
  }
  if (pattern === "improving") return { mood: clamp(2 + progress * 3 + noise), anxiety: clamp(5 - progress * 3 + noise), energy: clamp(2 + progress * 2 + noise), sleep: clamp(2 + progress * 2 + noise) };
  if (pattern === "burnout") return { mood: clamp(2 + noise), anxiety: clamp(4 + noise), energy: clamp(2 + noise), sleep: clamp(2 + noise) };
  const wave = Math.sin(chronologicalIndex * 1.4 + seed) * 1.6;
  return { mood: clamp(3 + wave), anxiety: clamp(3 - wave / 2), energy: clamp(3 + wave / 2), sleep: clamp(3 + wave / 3) };
}

function emotionValues(pattern: Pattern, values: ReturnType<typeof moodFor>) {
  if (pattern === "stable") return { calma: values.mood, motivação: values.energy, gratidão: Math.max(2, values.mood - 1) };
  if (pattern === "improving") return { esperança: values.mood, calma: Math.max(1, 6 - values.anxiety), motivação: values.energy };
  if (pattern === "burnout") return { exaustão: 6 - values.energy, desânimo: 6 - values.mood, preocupação: values.anxiety };
  if (pattern === "exam_stress") return { ansiedade: values.anxiety, preocupação: values.anxiety, frustração: Math.max(1, 5 - values.mood) };
  return { ansiedade: values.anxiety, confusão: 3, motivação: values.energy };
}

function riskFor(pattern: Pattern) {
  if (pattern === "burnout") return { risk: "high", priority: "high", status: "in_progress" };
  if (pattern === "exam_stress") return { risk: "high", priority: "urgent", status: "triaged" };
  if (pattern === "volatile") return { risk: "medium", priority: "medium", status: "in_progress" };
  return { risk: "low", priority: "low", status: "resolved" };
}

async function requireAdmin(req: Request, admin: any) {
  if (Deno.env.get("EBMSP_SEED_ENABLED") === "true") {
    const { data: seedAdmin, error } = await admin.from("profiles").select("user_id").eq("email", ADMIN_EMAIL).maybeSingle();
    if (error || !seedAdmin?.user_id) throw new Error("Seed administrator not found");
    return seedAdmin.user_id;
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = authHeader.slice(7);
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) throw new Error("Unauthorized");
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).in("role", ["admin", "super_admin"]);
  if (!roles?.length) throw new Error("Forbidden");
  return userData.user.id;
}

async function ensureInstitution(admin: any) {
  const { data: existing } = await admin.from("educational_institutions").select("id").eq("name", INSTITUTION_NAME).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin.from("educational_institutions").insert({
    name: INSTITUTION_NAME, type: "private", is_active: true, has_partnership: true,
    can_manage_users: true, can_manage_coupons: true, can_manage_professionals: true,
    anonymize_students: false, benchmark_opt_in: true,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function ensureAdmin(admin: any, institutionId: string) {
  const { data: profile } = await admin.from("profiles").select("id,user_id").eq("email", ADMIN_EMAIL).maybeSingle();
  let profileId = profile?.id;
  let userId = profile?.user_id;
  let created = false;
  if (!userId) {
    const password = `Eb@${crypto.randomUUID().replaceAll("-", "").slice(0, 14)}!`;
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL, password, email_confirm: true, user_metadata: { nome: ADMIN_NAME },
    });
    if (authError) throw authError;
    userId = authData.user.id;
    const { data: createdProfile, error: profileError } = await admin.from("profiles").insert({
      user_id: userId, nome: ADMIN_NAME, email: ADMIN_EMAIL, tipo_usuario: "admin", tenant_id: TENANT_ID,
    }).select("id").single();
    if (profileError) throw profileError;
    profileId = createdProfile.id;
    created = true;
    const { error: emailError } = await admin.functions.invoke("notify-institution-link", { body: {
      userEmail: ADMIN_EMAIL, userName: ADMIN_NAME, institutionName: INSTITUTION_NAME,
      role: "admin", tenantId: TENANT_ID, isNewUser: true, temporaryPassword: password,
    }});
    if (emailError) console.error("Admin notification failed", emailError.message);
  }
  await admin.from("user_roles").upsert({ user_id: userId, role: "institution_admin" }, { onConflict: "user_id,role" });
  await admin.from("institution_users").upsert({ user_id: userId, institution_id: institutionId, tenant_id: TENANT_ID, role: "admin", is_active: true }, { onConflict: "user_id,institution_id,tenant_id" });
  if (profileId) await admin.from("user_tenants").upsert({ user_id: profileId, tenant_id: TENANT_ID, is_primary: true }, { onConflict: "user_id,tenant_id" });
  return { created, userId };
}

async function ensureProfessionals(admin: any, institutionId: string) {
  const specialties = ["Ansiedade acadêmica", "Terapia cognitivo-comportamental", "Sono e rotina", "Acolhimento psicológico", "Prevenção ao esgotamento", "Autoconhecimento", "Orientação de carreira", "Habilidades socioemocionais"];
  let created = 0;
  for (let index = 0; index < PROFESSIONAL_COUNT; index++) {
    const email = `profissional.demo.${String(index + 1).padStart(2, "0")}@ebmsp.demo.redebemestar.com.br`;
    const { data: existingProfile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    let profileId = existingProfile?.id;
    if (!profileId) {
      const { data: inserted, error } = await admin.from("profiles").insert({ nome: `Profissional Demo EBMSP ${index + 1}`, email, tipo_usuario: "profissional", tenant_id: TENANT_ID }).select("id").single();
      if (error) throw error;
      profileId = inserted.id;
    }
    const { data: existingProfessional } = await admin.from("profissionais").select("id").eq("profile_id", profileId).maybeSingle();
    let professionalId = existingProfessional?.id;
    if (!professionalId) {
      const { data: inserted, error } = await admin.from("profissionais").insert({
        profile_id: profileId, user_id: 880000 + index, user_login: `ebmsp.prof.${index + 1}`, user_email: email,
        display_name: `Profissional Demo EBMSP ${index + 1}`, first_name: "Profissional", profissao: "Psicólogo(a)",
        crp_crm: `CRP 03/${String(900001 + index)}`, preco_consulta: 120 + index * 10,
        resumo: `${MARKER} Especialista em ${specialties[index]}.`, servicos_normalizados: [specialties[index]],
        ativo: true, em_destaque: index < 3, ordem_destaque: index < 3 ? index + 1 : null,
      }).select("id").single();
      if (error) throw error;
      professionalId = inserted.id;
      created++;
    }
    await admin.from("professional_institutions").upsert({ professional_id: professionalId, institution_id: institutionId, relationship_type: index < 4 ? "employee" : "partner", is_active: true, start_date: dateAgo(180 + index * 10), notes: MARKER }, { onConflict: "professional_id,institution_id" });
    await admin.from("professional_tenants").upsert({ professional_id: professionalId, tenant_id: TENANT_ID, is_featured: index < 3, featured_order: index < 3 ? index + 1 : null }, { onConflict: "professional_id,tenant_id" });
  }
  return created;
}

async function ensureStudent(admin: any, institutionId: string, index: number, grantedBy: string) {
  const identity = studentIdentity(index);
  const { data: existingProfile } = await admin.from("profiles").select("id,user_id").eq("email", identity.email).maybeSingle();
  let profileId = existingProfile?.id;
  let userId = existingProfile?.user_id;
  let created = false;
  if (!userId) {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: identity.email, password: `DemoEBMSP-${String(index + 1).padStart(3, "0")}-${crypto.randomUUID().slice(0, 8)}!`,
      email_confirm: true, user_metadata: { nome: identity.name, demo: true },
    });
    if (authError) throw authError;
    userId = authData.user.id;
    const { data: inserted, error } = await admin.from("profiles").insert({
      user_id: userId, nome: identity.name, email: identity.email, tipo_usuario: "paciente", tenant_id: TENANT_ID,
      data_nascimento: `${1997 + (index % 8)}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`,
      genero: index % 3 === 0 ? "masculino" : index % 3 === 1 ? "feminino" : "nao_binario",
    }).select("id").single();
    if (error) throw error;
    profileId = inserted.id;
    created = true;
  }
  const { data: existingPatient } = await admin.from("pacientes").select("id").eq("profile_id", profileId).maybeSingle();
  let patientId = existingPatient?.id;
  if (!patientId) {
    const { data: inserted, error } = await admin.from("pacientes").insert({ profile_id: profileId, eh_estudante: true, instituicao_ensino: INSTITUTION_NAME, tenant_id: TENANT_ID }).select("id").single();
    if (error) throw error;
    patientId = inserted.id;
  }
  await admin.from("patient_institutions").upsert({ patient_id: patientId, institution_id: institutionId, enrollment_status: "enrolled", enrollment_date: dateAgo(90 + index % 120) }, { onConflict: "patient_id,institution_id" });
  await admin.from("user_tenants").upsert({ user_id: profileId, tenant_id: TENANT_ID, is_primary: true }, { onConflict: "user_id,tenant_id" });
  await admin.from("institution_buddy_students").upsert({ institution_id: institutionId, patient_id: patientId, granted_by: grantedBy }, { onConflict: "institution_id,patient_id" });
  return { ...identity, profileId, userId, patientId, created, pattern: patterns[index % patterns.length] };
}

async function seedMoodAndBuddy(admin: any, institutionId: string, student: any, index: number) {
  const total = 36 + (index % 10);
  const skippedModulo = 5 + (index % 4);
  const moodRows = [];
  for (let daysAgo = 44; daysAgo >= 0; daysAgo--) {
    if ((daysAgo + index) % skippedModulo === 0) continue;
    const chronologicalIndex = 44 - daysAgo;
    const values = moodFor(student.pattern, chronologicalIndex, total, index * 100 + daysAgo);
    moodRows.push({
      user_id: student.userId, profile_id: student.profileId, tenant_id: TENANT_ID, date: dateAgo(daysAgo),
      mood_score: values.mood, anxiety_level: values.anxiety, energy_level: values.energy,
      sleep_hours: 4 + values.sleep, sleep_quality: values.sleep,
      journal_text: journalByPattern[student.pattern][(daysAgo + index) % journalByPattern[student.pattern].length],
      tags: student.pattern === "stable" ? ["#equilíbrio", "#rotina"] : student.pattern === "improving" ? ["#progresso", "#autocuidado"] : ["#estudos", "#ansiedade"],
      emotion_values: emotionValues(student.pattern, values), created_at: timestampAgo(daysAgo, 8 + index % 10), updated_at: timestampAgo(daysAgo, 8 + index % 10),
    });
  }
  const { data: insertedEntries, error: moodError } = await admin.from("mood_entries").upsert(moodRows, { onConflict: "user_id,date" }).select("id,date,mood_score,anxiety_level");
  if (moodError) throw moodError;
  const analysisRows = (insertedEntries || []).filter((_: any, entryIndex: number) => entryIndex % 3 === 0).map((entry: any) => ({
    mood_entry_id: entry.id, user_id: student.userId,
    risk_level: entry.mood_score <= 2 && entry.anxiety_level >= 4 ? "critical" : entry.mood_score <= 3 ? "alert" : entry.anxiety_level >= 4 ? "attention" : "healthy",
    buddy_message: entry.mood_score <= 2 ? "Percebi um dia mais difícil. Que tal fazer uma pausa e escolher um apoio?" : "Seu registro ajuda a reconhecer padrões e cuidar da sua rotina.",
    source: "demo_seed", raw_payload: { marker: MARKER, pattern: student.pattern }, created_at: `${entry.date}T12:00:00.000Z`, updated_at: `${entry.date}T12:00:00.000Z`,
  }));
  if (analysisRows.length) {
    const moodEntryIds = analysisRows.map((row: any) => row.mood_entry_id);
    await admin.from("mood_entry_analyses").delete().in("mood_entry_id", moodEntryIds);
    const { error } = await admin.from("mood_entry_analyses").insert(analysisRows);
    if (error) throw error;
  }

  const portrait = {
    patient_id: student.patientId, mind_on: "Minha formação, minha saúde e como equilibrar as responsabilidades.",
    calms_me: "Respirar com calma, caminhar e conversar com pessoas de confiança.", wants_to_improve: ["sono", "organização", "ansiedade"],
    dreams: "Concluir minha formação com saúde e confiança.", message_to_buddy: "Quero ajuda para perceber meus padrões sem julgamentos.",
    triggers: ["avaliações", "sobrecarga", "pouco descanso"], values_list: ["cuidado", "aprendizado", "empatia"],
    current_mood: student.pattern === "stable" ? "equilibrado" : "em adaptação", anxiety: student.pattern === "exam_stress" ? 8 : student.pattern === "burnout" ? 7 : 4,
    sadness: student.pattern === "burnout" ? 7 : 3, motivation: student.pattern === "burnout" ? 3 : 7,
    privacy: "only_me", sleep_quality: student.pattern === "burnout" ? 3 : 7, stress_level: student.pattern === "stable" ? 3 : 7,
    energy_level: student.pattern === "burnout" ? 3 : 7, three_words: ["dedicado", "curioso", "humano"],
    strengths_self: ["persistência", "empatia"], next_3_months: "Construir uma rotina sustentável de estudo e autocuidado.",
    biggest_challenge: "Equilibrar as demandas acadêmicas sem deixar o descanso de lado.", support_people: "Família, amigos e colegas de turma.",
    self_care_rituals: ["caminhada", "música", "respiração"], hobbies: ["leitura", "atividade física"],
    avoid_situations: ["acumular tarefas"], ask_help_ease: index % 3 + 2, preferred_tone: "acolhedor", reminder_time: "19:00:00",
  };
  await admin.from("buddy_portraits").upsert(portrait, { onConflict: "patient_id" });
  const current = moodFor(student.pattern, total - 1, total, index);
  await admin.from("buddy_insights").delete().eq("patient_id", student.patientId).eq("model", "demo-ebmsp-v1");
  const { error: insightError } = await admin.from("buddy_insights").insert({
    patient_id: student.patientId, institution_id: institutionId, period_start: dateAgo(29), period_end: dateAgo(0),
    wellbeing_score: current.mood, emotional_stability: student.pattern === "volatile" ? 2.4 : current.mood,
    sleep_quality: current.sleep, habit_consistency: 3 + (index % 5) * 0.5,
    strengths: ["Persistência acadêmica", "Capacidade de pedir apoio"],
    attention_points: student.pattern === "stable" ? ["Manter a rotina de descanso"] : ["Carga acadêmica", "Qualidade do sono"],
    map_topics: ["estudos", "sono", "autocuidado"], sources: { mood_entries: total, scales: true, practices: true },
    narrative: `Nos últimos 30 dias, o Buddy identificou um padrão ${student.pattern === "stable" ? "estável" : "que merece acompanhamento"}, com sinais ligados à rotina acadêmica.`,
    recommendations: ["Manter registros frequentes", "Usar uma prática breve nos dias mais intensos", "Buscar apoio quando necessário"],
    model: "demo-ebmsp-v1", insight_type: "connected", payload: { marker: MARKER, pattern: student.pattern }, created_at: timestampAgo(index % 5),
  });
  if (insightError) throw insightError;
  return insertedEntries?.length || 0;
}

async function seedStudentActivities(admin: any, institutionId: string, student: any, index: number, grantedBy: string) {
  const { data: scales } = await admin.from("emotional_scales").select("id,code,item_min,item_max").eq("active", true);
  const itemCounts: Record<string, number> = { WHO5: 5, PHQ9: 9, GAD7: 7, PSS10: 10, ISI: 7, MHCSF: 14 };
  const selectedScales = (scales || []).filter((_: any, scaleIndex: number) => (index + scaleIndex) % 2 === 0).slice(0, 3);
  const scaleRows = selectedScales.flatMap((scale: any, scaleIndex: number) => [21, 6].map((days, periodIndex) => {
    const count = itemCounts[scale.code] || 5;
    const answers = Array.from({ length: count }, (_, answerIndex) => {
      const base = student.pattern === "stable" || student.pattern === "improving" ? scale.item_min + 1 : scale.item_max - 1;
      return Math.max(scale.item_min, Math.min(scale.item_max, base + ((index + answerIndex + periodIndex) % 3) - 1));
    });
    const raw = answers.reduce((sum, value) => sum + value, 0);
    const normalized = Math.round((raw / Math.max(1, count * scale.item_max)) * 10000) / 100;
    return { user_id: student.userId, scale_id: scale.id, scale_code: scale.code, answers, raw_score: raw, normalized_score: normalized, severity: normalized >= 67 ? "alto" : normalized >= 34 ? "moderado" : "baixo", taken_at: timestampAgo(days, 18), created_at: timestampAgo(days, 18) };
  }));
  if (scaleRows.length) await admin.from("emotional_scale_responses").insert(scaleRows);

  const { data: practices } = await admin.from("praticas").select("id").eq("ativo", true).limit(8);
  const practiceRows = Array.from({ length: 3 + index % 4 }, (_, activityIndex) => ({
    pratica_id: practices?.[(index + activityIndex) % Math.max(practices?.length || 1, 1)]?.id,
    user_id: student.userId, estado: ["calmo", "leve", "reflexivo", "energizado"][(index + activityIndex) % 4],
    nota: `${MARKER} Prática concluída durante a rotina acadêmica.`, duracao_segundos: 120 + ((index + activityIndex) % 8) * 60,
    created_at: timestampAgo((index * 3 + activityIndex * 7) % 30, 19),
  })).filter(row => row.pratica_id);
  if (practiceRows.length) await admin.from("praticas_checkouts").insert(practiceRows);

  if (index % 2 === 0) {
    const createdAt = timestampAgo((index % 25) + 1, 20);
    const { data: journey, error } = await admin.from("journey_sessions").insert({
      user_id: student.userId, session_key: `demo-ebmsp-${String(index + 1).padStart(3, "0")}`, tenant_id: TENANT_ID,
      family_id: student.pattern === "stable" ? "alegria" : "medo", emotion_id: student.pattern === "stable" ? "confiante" : "preocupado",
      intensity_before: student.pattern === "stable" ? 3 : 5, intensity_after: student.pattern === "stable" ? 2 : 3,
      practice_id: "respiracao-lenta-ritmada", duration_minutes: 6, perceived_change_ids: ["mais_calmo", "mais_clareza"], usefulness: 4,
      phase: "record", status: "completed", focus_mode: "guided", comprehension: { source: "pressão acadêmica", body: "tensão nos ombros", thoughts: "muitas tarefas" },
      action: { next_step: "organizar as próximas tarefas" }, immediate_regulation: { completed: true }, learning_practice: { completed: true },
      created_at: createdAt, updated_at: createdAt, completed_at: createdAt,
    }).select("id").single();
    if (!error && journey) await admin.from("journey_session_emotions").insert({
      session_id: journey.id, user_id: student.userId, emotion_id: student.pattern === "stable" ? "confiante" : "preocupado",
      family_id: student.pattern === "stable" ? "alegria" : "medo", emotion_level: 3, intensity_before: student.pattern === "stable" ? 3 : 5,
      intensity_after: student.pattern === "stable" ? 2 : 3, is_focus: true, position: 0, created_at: createdAt,
    });
  }

  const triage = riskFor(student.pattern);
  const triageCreated = timestampAgo(2 + index % 26, 10);
  const { error: triageError } = await admin.from("student_triage").insert({
    patient_id: student.patientId, institution_id: institutionId, triaged_by: grantedBy,
    status: triage.status, risk_level: triage.risk, priority: triage.priority,
    recommended_action: triage.risk === "low" ? "Manter acompanhamento preventivo" : triage.risk === "medium" ? "Monitorar evolução e oferecer práticas" : "Oferecer acolhimento psicológico",
    notes: `${MARKER} Triagem demonstrativa baseada no histórico recente.`, created_at: triageCreated, updated_at: triageCreated,
    resolved_at: triage.status === "resolved" ? timestampAgo(index % 4, 15) : null,
    follow_up_date: triage.status !== "resolved" ? dateAgo(-((index % 10) + 1)) : null,
    resolution_type: triage.status === "resolved" ? "monitoring_completed" : null,
    resolution_notes: triage.status === "resolved" ? `${MARKER} Evolução estável após acompanhamento.` : null,
  });
  if (triageError) throw triageError;
}

async function seedInstitutionalExtras(admin: any, institutionId: string) {
  const { data: professionals } = await admin.from("professional_institutions").select("professional_id,profissionais(display_name,preco_consulta)").eq("institution_id", institutionId);
  const { data: students } = await admin.from("patient_institutions").select("patient_id,pacientes(profile_id,profiles(user_id,nome,email))").eq("institution_id", institutionId);
  await admin.from("institution_coupons").delete().eq("institution_id", institutionId).ilike("description", `%${MARKER}%`);
  await admin.from("institution_coupons").insert([
    { institution_id: institutionId, tenant_id: TENANT_ID, code: "EBMSP-CUIDADO", name: "Cuidado EBMSP", description: `${MARKER} 20% de desconto para estudantes`, discount_type: "percentage", discount_value: 20, target_audience: "all", is_active: true, valid_from: new Date().toISOString(), valid_until: `${new Date().getUTCFullYear() + 1}-12-31T23:59:59Z`, maximum_uses: 1000, uses_per_user: 2 },
    { institution_id: institutionId, tenant_id: TENANT_ID, code: "EBMSP-PRIMEIRA", name: "Primeiro acolhimento", description: `${MARKER} Desconto fixo no primeiro acolhimento`, discount_type: "fixed_amount", discount_value: 40, target_audience: "all", is_active: true, valid_from: new Date().toISOString(), valid_until: `${new Date().getUTCFullYear() + 1}-12-31T23:59:59Z`, maximum_uses: 500, uses_per_user: 1 },
  ]);
  const appointments = [];
  for (let index = 0; index < 80; index++) {
    const student: any = students?.[index % Math.max(students?.length || 1, 1)];
    const professional: any = professionals?.[index % Math.max(professionals?.length || 1, 1)];
    const profile = student?.pacientes?.profiles;
    if (!profile?.user_id || !professional?.professional_id) continue;
    const past = index < 55;
    appointments.push({
      user_id: profile.user_id, professional_id: professional.professional_id, tenant_id: TENANT_ID,
      data_consulta: past ? dateAgo((index % 29) + 1) : dateAgo(-((index % 25) + 1)), horario: `${String(8 + index % 10).padStart(2, "0")}:00:00`,
      valor: professional.profissionais?.preco_consulta || 150, status: past ? "realizado" : index % 3 === 0 ? "pendente" : "confirmado",
      nome_paciente: profile.nome, email_paciente: profile.email, telefone_paciente: "(71) 90000-0000", observacoes: `${MARKER} Consulta demonstrativa`,
      payment_status: past ? "paid" : "pending_payment",
    });
  }
  if (appointments.length) await admin.from("agendamentos").insert(appointments);

  await admin.from("group_sessions").delete().eq("institution_id", institutionId).contains("tags", ["demo-ebmsp"]);
  const sessionRows = [
    { title: "Acolhimento na rotina acadêmica", day: 12, status: "scheduled" },
    { title: "Sono e aprendizagem", day: 4, status: "scheduled" },
    { title: "Estratégias para períodos de avaliação", day: -7, status: "scheduled" },
  ].map((session, index) => ({
    tenant_id: TENANT_ID, title: session.title, description: `${MARKER} Encontro de demonstração para estudantes da EBMSP.`,
    session_type: ["roda_conversa", "palestra", "workshop"][index], session_date: dateAgo(session.day), start_time: `${18 + index}:00:00`, duration_minutes: 60,
    organizer_type: "institution", institution_id: institutionId, max_participants: 100, current_registrations: 0,
    is_free: true, price: 0, audience_type: "institutions", allowed_institution_ids: [institutionId], status: session.status,
    tags: ["demo-ebmsp", "bem-estar"], submitted_by: null,
  }));
  const { data: sessions, error: sessionsError } = await admin.from("group_sessions").insert(sessionRows).select("id,status");
  if (sessionsError) throw sessionsError;
  const registrations = [];
  for (const [sessionIndex, session] of (sessions || []).entries()) {
    for (let index = 0; index < 45 + sessionIndex * 10; index++) {
      const profile = (students?.[index % Math.max(students?.length || 1, 1)] as any)?.pacientes?.profiles;
      if (!profile?.user_id) continue;
      registrations.push({ session_id: session.id, user_id: profile.user_id, status: "confirmed", payment_status: "free", registered_at: timestampAgo(20 - sessionIndex * 5, 9), attended_at: sessionIndex < 2 ? timestampAgo(sessionIndex === 0 ? 12 : 4, 19) : null });
    }
  }
  if (registrations.length) {
    const { error } = await admin.from("group_session_registrations").insert(registrations);
    if (error) throw error;
  }
  for (const session of sessions || []) {
    const count = registrations.filter(row => row.session_id === session.id).length;
    await admin.from("group_sessions").update({ current_registrations: count }).eq("id", session.id);
  }
  return { appointments: appointments.length, sessions: sessions?.length || 0, registrations: registrations.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const callerId = await requireAdmin(req, admin);
    const body = await req.json();
    const action = body.action as string;
    const institutionId = await ensureInstitution(admin);

    if (action === "setup") {
      const adminResult = await ensureAdmin(admin, institutionId);
      const professionalsCreated = await ensureProfessionals(admin, institutionId);
      return Response.json({ success: true, institutionId, admin: adminResult, professionalsCreated }, { headers: corsHeaders });
    }
    if (action === "students") {
      const start = Math.max(0, Number(body.start) || 0);
      const count = Math.min(10, Math.max(1, Number(body.count) || 10));
      let studentsCreated = 0;
      let moodEntries = 0;
      for (let index = start; index < Math.min(start + count, STUDENT_COUNT); index++) {
        const student = await ensureStudent(admin, institutionId, index, callerId);
        if (student.created) {
          studentsCreated++;
          moodEntries += await seedMoodAndBuddy(admin, institutionId, student, index);
          await seedStudentActivities(admin, institutionId, student, index, callerId);
        }
      }
      return Response.json({ success: true, institutionId, start, count, studentsCreated, moodEntries }, { headers: corsHeaders });
    }
    if (action === "repair") {
      const { data: links, error } = await admin.from("patient_institutions").select("patient_id,pacientes(profile_id,profiles!inner(user_id,email))").eq("institution_id", institutionId);
      if (error) throw error;
      const start = Math.max(0, Number(body.start) || 0);
      const count = Math.min(20, Math.max(1, Number(body.count) || 20));
      const selectedLinks = (links || []).slice(start, start + count);
      let repaired = 0;
      for (const link of selectedLinks) {
        const patient = Array.isArray((link as any).pacientes) ? (link as any).pacientes[0] : (link as any).pacientes;
        const profile = Array.isArray(patient?.profiles) ? patient.profiles[0] : patient?.profiles;
        const match = profile?.email?.match(/aluno\.demo\.(\d{3})@/);
        if (!match || !profile?.user_id) continue;
        const index = Number(match[1]) - 1;
        const student = { ...studentIdentity(index), profileId: patient.profile_id, userId: profile.user_id, patientId: link.patient_id, created: false, pattern: patterns[index % patterns.length] };
        await seedMoodAndBuddy(admin, institutionId, student, index);
        await admin.from("student_triage").delete().eq("institution_id", institutionId).eq("patient_id", link.patient_id).ilike("notes", `%${MARKER}%`);
        const triage = riskFor(student.pattern);
        const triageCreated = timestampAgo(2 + index % 26, 10);
        const { error: triageError } = await admin.from("student_triage").insert({
          patient_id: student.patientId, institution_id: institutionId, triaged_by: callerId,
          status: triage.status, risk_level: triage.risk, priority: triage.priority,
          recommended_action: triage.risk === "low" ? "Manter acompanhamento preventivo" : triage.risk === "medium" ? "Monitorar evolução e oferecer práticas" : "Oferecer acolhimento psicológico",
          notes: `${MARKER} Triagem demonstrativa baseada no histórico recente.`, created_at: triageCreated, updated_at: triageCreated,
          resolved_at: triage.status === "resolved" ? timestampAgo(index % 4, 15) : null,
          follow_up_date: triage.status !== "resolved" ? dateAgo(-((index % 10) + 1)) : null,
          resolution_type: triage.status === "resolved" ? "monitoring_completed" : null,
          resolution_notes: triage.status === "resolved" ? `${MARKER} Evolução estável após acompanhamento.` : null,
        });
        if (triageError) throw triageError;
        repaired++;
      }
      return Response.json({ success: true, institutionId, start, count, repaired }, { headers: corsHeaders });
    }
    if (action === "finalize") {
      const extras = await seedInstitutionalExtras(admin, institutionId);
      return Response.json({ success: true, institutionId, ...extras }, { headers: corsHeaders });
    }
    throw new Error("Unsupported action");
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error ? String((error as { message: unknown }).message) : JSON.stringify(error);
    return Response.json({ success: false, error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500, headers: corsHeaders });
  }
});