import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const UNICAMP_ID = "d06b3a18-efef-478a-84cb-bbaa5e8ddd36";
const MEDCOS_TENANT_ID = "3a9ae5ec-50a9-4674-b808-7735e5f0afb5"; // Medcos
const RBE_TENANT_ID = "472db0ac-0f45-4998-97da-490bc579efb1"; // Rede Bem Estar
const DEMO_MARKER = "[DEMO-UNICAMP]";
const EMAIL_DOMAIN = "@unicamp.edu.br";

// Professional data
const PROFESSIONALS = [
  {
    nome: "Dra. Camila Andrade Ribeiro",
    email: "camila.ribeiro@unicamp.edu.br",
    telefone: "(19) 99999-0001",
    profissao: "Psicóloga Clínica",
    servicos_normalizados: ["TCC", "Ansiedade", "Depressão"],
    preco_consulta: 150,
    crp: "CRP 06/112233",
    relationship_type: "partner",
    resumo: "Psicóloga clínica com especialização em Terapia Cognitivo-Comportamental. Atua no núcleo de saúde mental da UNICAMP.",
  },
  {
    nome: "Dr. Thiago Nascimento Costa",
    email: "thiago.costa@unicamp.edu.br",
    telefone: "(19) 99999-0002",
    profissao: "Psicólogo",
    servicos_normalizados: ["Psicanálise", "Trauma", "Luto"],
    preco_consulta: 140,
    crp: "CRP 06/223344",
    relationship_type: "partner",
    resumo: "Psicólogo com formação psicanalítica. Especialista em trauma e processos de luto. Docente colaborador no Instituto de Psicologia.",
  },
  {
    nome: "Amanda Cristina Melo",
    email: "amanda.melo@unicamp.edu.br",
    telefone: "(19) 99999-0003",
    profissao: "Estudante de Psicologia",
    servicos_normalizados: ["Atendimento Supervisionado", "Acolhimento"],
    preco_consulta: 80,
    crp: "CRP 06/334455",
    relationship_type: "partner",
    resumo: "Estudante de Psicologia em fase de estágio supervisionado. Atendimento de acolhimento e escuta qualificada.",
  },
  {
    nome: "Dr. Marcos Vinicius Prado",
    email: "marcos.prado@unicamp.edu.br",
    telefone: "(19) 99999-0004",
    profissao: "Psicólogo Clínico",
    servicos_normalizados: ["Neuropsicologia", "TDAH", "Avaliação Neuropsicológica"],
    preco_consulta: 180,
    crp: "CRP 06/445566",
    relationship_type: "employee",
    resumo: "Neuropsicólogo especializado em avaliação e reabilitação cognitiva. Pesquisador do Laboratório de Neurociências da UNICAMP.",
  },
];

// Student data
const STUDENTS = [
  { nome: "Laura Fernandes Dias", email: "laura.fernandes@unicamp.edu.br", telefone: "(19) 98888-0001", periodo: "5º", status: "enrolled" },
  { nome: "Bruno Almeida Torres", email: "bruno.almeida@unicamp.edu.br", telefone: "(19) 98888-0002", periodo: "7º", status: "enrolled" },
  { nome: "Bianca Rodrigues Lima", email: "bianca.rodrigues@unicamp.edu.br", telefone: "(19) 98888-0003", periodo: "3º", status: "enrolled" },
  { nome: "Caio Henrique Souza", email: "caio.henrique@unicamp.edu.br", telefone: "(19) 98888-0004", periodo: "9º", status: "enrolled" },
  { nome: "Leticia Martins Pereira", email: "leticia.martins@unicamp.edu.br", telefone: "(19) 98888-0005", periodo: "4º", status: "enrolled" },
  { nome: "Gustavo Costa Moreira", email: "gustavo.costa@unicamp.edu.br", telefone: "(19) 98888-0006", periodo: "6º", status: "enrolled" },
  { nome: "Fernanda Oliveira Santos", email: "fernanda.oliveira@unicamp.edu.br", telefone: "(19) 98888-0007", periodo: "10º", status: "graduated" },
  { nome: "Leonardo Carvalho Nunes", email: "leonardo.carvalho@unicamp.edu.br", telefone: "(19) 98888-0008", periodo: "8º", status: "enrolled" },
  { nome: "Raquel Sousa Freitas", email: "raquel.sousa@unicamp.edu.br", telefone: "(19) 98888-0009", periodo: "2º", status: "enrolled" },
  { nome: "Vitor Barbosa Gomes", email: "vitor.barbosa@unicamp.edu.br", telefone: "(19) 98888-0010", periodo: "5º", status: "inactive" },
];

// Coupon data - 6 coupons for both tenants
const COUPONS = [
  {
    code: "UNICAMP-BOAS-VINDAS-RBE",
    name: "Boas-Vindas UNICAMP 20%",
    description: "Desconto de 20% para estudantes da UNICAMP - Rede Bem Estar",
    discount_type: "percentage",
    discount_value: 20,
    target_audience: "institution_students",
    professional_scope: "all_tenant",
    maximum_uses: null,
    tenant_id: RBE_TENANT_ID,
  },
  {
    code: "UNICAMP-PRIMEIRA-SESSAO-RBE",
    name: "R$40 Primeira Sessão",
    description: "Desconto de R$40 na primeira consulta - Rede Bem Estar",
    discount_type: "fixed_amount",
    discount_value: 40,
    target_audience: "all",
    professional_scope: "all_tenant",
    maximum_uses: 100,
    tenant_id: RBE_TENANT_ID,
  },
  {
    code: "UNICAMP-ESTUDANTE-RBE",
    name: "Estudante UNICAMP 25%",
    description: "Desconto especial de 25% para estudantes matriculados - Rede Bem Estar",
    discount_type: "percentage",
    discount_value: 25,
    target_audience: "institution_students",
    professional_scope: "institution_professionals",
    maximum_uses: 50,
    tenant_id: RBE_TENANT_ID,
  },
  {
    code: "UNICAMP-BOAS-VINDAS-MEDCOS",
    name: "Boas-Vindas UNICAMP 20%",
    description: "Desconto de 20% para estudantes da UNICAMP - Medcos",
    discount_type: "percentage",
    discount_value: 20,
    target_audience: "institution_students",
    professional_scope: "all_tenant",
    maximum_uses: null,
    tenant_id: MEDCOS_TENANT_ID,
  },
  {
    code: "UNICAMP-ESTUDANTE-MEDCOS",
    name: "Estudante UNICAMP 25%",
    description: "Desconto especial de 25% para estudantes matriculados - Medcos",
    discount_type: "percentage",
    discount_value: 25,
    target_audience: "institution_students",
    professional_scope: "institution_professionals",
    maximum_uses: 50,
    tenant_id: MEDCOS_TENANT_ID,
  },
  {
    code: "UNICAMP-PRIMEIRA-GRATIS",
    name: "Primeira Sessão Grátis",
    description: "100% de desconto na primeira sessão para estudantes UNICAMP",
    discount_type: "percentage",
    discount_value: 100,
    target_audience: "institution_students",
    professional_scope: "all_tenant",
    maximum_uses: 20,
    tenant_id: MEDCOS_TENANT_ID,
  },
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(hour: number, minute: number = 0): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
}

// Check for existing demo data
async function checkExistingDemoData(supabase: any): Promise<{
  professionals: number;
  students: number;
  coupons: number;
}> {
  const { count: professionals } = await supabase
    .from("profissionais")
    .select("*", { count: "exact", head: true })
    .like("resumo", `%${DEMO_MARKER}%`);

  const { count: students } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .like("email", `%${EMAIL_DOMAIN}`)
    .eq("tipo_usuario", "paciente");

  const { count: coupons } = await supabase
    .from("institution_coupons")
    .select("*", { count: "exact", head: true })
    .like("description", `%${DEMO_MARKER}%`);

  return { 
    professionals: professionals || 0, 
    students: students || 0, 
    coupons: coupons || 0 
  };
}

// Seed functions
async function seedProfessionals(supabase: any): Promise<{ created: number; ids: number[] }> {
  console.log("[Seed UNICAMP] Creating professionals...");
  const createdIds: number[] = [];

  for (let i = 0; i < PROFESSIONALS.length; i++) {
    const prof = PROFESSIONALS[i];
    const demoUserId = 88880 + i; // Different from UniFOA
    const userLogin = prof.email.split("@")[0];

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        nome: prof.nome,
        email: prof.email,
        tipo_usuario: "profissional",
        tenant_id: MEDCOS_TENANT_ID,
        user_id: null,
      })
      .select("id")
      .single();

    if (profileError) {
      console.error(`[Seed UNICAMP] Error creating profile for ${prof.nome}:`, profileError);
      continue;
    }

    // Create professional record
    const { data: professional, error: profError } = await supabase
      .from("profissionais")
      .insert({
        profile_id: profile.id,
        display_name: prof.nome,
        first_name: prof.nome.split(" ")[0],
        last_name: prof.nome.split(" ").slice(1).join(" "),
        email_secundario: prof.email,
        telefone: prof.telefone,
        crp_crm: prof.crp,
        profissao: prof.profissao,
        servicos_normalizados: prof.servicos_normalizados,
        preco_consulta: prof.preco_consulta,
        resumo: `${prof.resumo} ${DEMO_MARKER}`,
        resumo_profissional: prof.resumo,
        ativo: true,
        em_destaque: false,
        user_id: demoUserId,
        user_login: userLogin,
        user_email: prof.email,
      })
      .select("id")
      .single();

    if (profError) {
      console.error(`[Seed UNICAMP] Error creating professional for ${prof.nome}:`, profError);
      continue;
    }

    // Link to UNICAMP
    await supabase.from("professional_institutions").insert({
      professional_id: professional.id,
      institution_id: UNICAMP_ID,
      relationship_type: prof.relationship_type,
      is_active: true,
    });

    // Link to tenant
    await supabase.from("professional_tenants").insert({
      professional_id: professional.id,
      tenant_id: MEDCOS_TENANT_ID,
      is_featured: false,
    });

    createdIds.push(professional.id);
    console.log(`[Seed UNICAMP] Created professional: ${prof.nome} (ID: ${professional.id})`);
  }

  return { created: createdIds.length, ids: createdIds };
}

async function seedStudents(supabase: any): Promise<{ created: number; ids: string[] }> {
  console.log("[Seed UNICAMP] Creating students...");
  const createdIds: string[] = [];

  for (const student of STUDENTS) {
    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        nome: student.nome,
        email: student.email,
        tipo_usuario: "paciente",
        tenant_id: MEDCOS_TENANT_ID,
        user_id: null,
      })
      .select("id")
      .single();

    if (profileError) {
      console.error(`[Seed UNICAMP] Error creating profile for ${student.nome}:`, profileError);
      continue;
    }

    // Create patient record
    const { data: patient, error: patientError } = await supabase
      .from("pacientes")
      .insert({
        profile_id: profile.id,
        eh_estudante: true,
        instituicao_ensino: null,
        tenant_id: MEDCOS_TENANT_ID,
      })
      .select("id")
      .single();

    if (patientError) {
      console.error(`[Seed UNICAMP] Error creating patient for ${student.nome}:`, patientError);
      continue;
    }

    // Link to UNICAMP
    await supabase.from("patient_institutions").insert({
      patient_id: patient.id,
      institution_id: UNICAMP_ID,
      enrollment_status: student.status,
      enrollment_date: formatDate(addDays(new Date(), -365)),
    });

    createdIds.push(patient.id);
    console.log(`[Seed UNICAMP] Created student: ${student.nome} (ID: ${patient.id})`);
  }

  return { created: createdIds.length, ids: createdIds };
}

async function seedCoupons(supabase: any): Promise<{ created: number; ids: string[] }> {
  console.log("[Seed UNICAMP] Creating coupons...");
  const createdIds: string[] = [];

  for (const coupon of COUPONS) {
    // Delete existing coupon with same code first
    await supabase
      .from("institution_coupons")
      .delete()
      .eq("code", coupon.code);

    const { data, error } = await supabase
      .from("institution_coupons")
      .insert({
        institution_id: UNICAMP_ID,
        tenant_id: coupon.tenant_id,
        code: coupon.code,
        name: coupon.name,
        description: `${coupon.description} ${DEMO_MARKER}`,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        target_audience: coupon.target_audience,
        professional_scope: coupon.professional_scope,
        maximum_uses: coupon.maximum_uses,
        is_active: true,
        valid_from: formatDate(new Date()),
        valid_until: "2026-12-31",
      })
      .select("id")
      .single();

    if (error) {
      console.error(`[Seed UNICAMP] Error creating coupon ${coupon.code}:`, JSON.stringify(error));
      continue;
    }

    createdIds.push(data.id);
    console.log(`[Seed UNICAMP] Created coupon: ${coupon.code} (ID: ${data.id})`);
  }

  return { created: createdIds.length, ids: createdIds };
}

async function seedMoodEntries(supabase: any): Promise<{ created: number }> {
  console.log("[Seed UNICAMP] Creating mood entries...");
  let created = 0;

  // Get student profiles
  const { data: students } = await supabase
    .from("profiles")
    .select("id, user_id")
    .like("email", `%${EMAIL_DOMAIN}`)
    .eq("tipo_usuario", "paciente");

  if (!students || students.length === 0) {
    console.log("[Seed UNICAMP] No students found for mood entries");
    return { created: 0 };
  }

  const tags = [
    ["#provas", "#estresse"],
    ["#estágio", "#motivação"],
    ["#tcc", "#ansiedade"],
    ["#aulas", "#sono"],
    ["#exercício", "#energia"],
    ["#meditação", "#calma"],
    ["#amigos", "#alegria"],
    ["#família", "#gratidão"],
    ["#laboratório", "#pesquisa"],
    ["#ic", "#artigo"],
  ];

  for (const student of students) {
    const entriesCount = randomInt(10, 15);
    
    for (let i = 0; i < entriesCount; i++) {
      const daysAgo = randomInt(0, 30);
      const date = addDays(new Date(), -daysAgo);
      
      const moodScore = randomInt(3, 9);
      const sleepHours = randomInt(4, 9);
      const sleepQuality = Math.min(10, sleepHours + randomInt(-1, 2));
      const energyLevel = Math.min(10, moodScore + randomInt(-2, 2));
      const anxietyLevel = Math.max(1, 10 - moodScore + randomInt(-1, 2));

      const { error } = await supabase.from("mood_entries").insert({
        profile_id: student.id,
        user_id: student.user_id,
        tenant_id: MEDCOS_TENANT_ID,
        date: formatDate(date),
        mood_score: moodScore,
        energy_level: energyLevel,
        anxiety_level: anxietyLevel,
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        tags: randomElement(tags),
        journal_text: `Entrada de diário demo ${DEMO_MARKER}`,
      });

      if (!error) created++;
    }
  }

  console.log(`[Seed UNICAMP] Created ${created} mood entries`);
  return { created };
}

async function seedAppointments(supabase: any): Promise<{ created: number; past: number; cancelled: number; future: number }> {
  console.log("[Seed UNICAMP] Creating appointments...");

  // Get a real user_id from the system
  const { data: realUser, error: userError } = await supabase
    .from("profiles")
    .select("user_id")
    .not("user_id", "is", null)
    .limit(1)
    .single();

  if (userError || !realUser?.user_id) {
    console.error("[Seed UNICAMP] No valid user_id found for appointments");
    return { created: 0, past: 0, cancelled: 0, future: 0 };
  }

  const DEMO_USER_ID = realUser.user_id;
  console.log(`[Seed UNICAMP] Using real user_id for appointments: ${DEMO_USER_ID}`);

  // Get professionals and students
  const { data: professionals } = await supabase
    .from("profissionais")
    .select("id, preco_consulta, display_name")
    .like("resumo", `%${DEMO_MARKER}%`);

  const { data: studentProfiles } = await supabase
    .from("profiles")
    .select("id, nome, email, user_id")
    .like("email", `%${EMAIL_DOMAIN}`)
    .eq("tipo_usuario", "paciente");

  const { data: coupons } = await supabase
    .from("institution_coupons")
    .select("id, code")
    .like("description", `%${DEMO_MARKER}%`);

  if (!professionals?.length || !studentProfiles?.length) {
    console.log("[Seed UNICAMP] Missing professionals or students for appointments");
    return { created: 0, past: 0, cancelled: 0, future: 0 };
  }

  let past = 0, cancelled = 0, future = 0;

  // Past appointments (25)
  const pastAppointments = [
    { studentIdx: 0, profIdx: 0, daysAgo: 45, useCoupon: true },
    { studentIdx: 0, profIdx: 0, daysAgo: 30, useCoupon: true },
    { studentIdx: 0, profIdx: 0, daysAgo: 15, useCoupon: false },
    { studentIdx: 1, profIdx: 1, daysAgo: 50, useCoupon: true },
    { studentIdx: 1, profIdx: 1, daysAgo: 35, useCoupon: false },
    { studentIdx: 1, profIdx: 1, daysAgo: 20, useCoupon: true },
    { studentIdx: 1, profIdx: 1, daysAgo: 7, useCoupon: false },
    { studentIdx: 2, profIdx: 2, daysAgo: 40, useCoupon: true },
    { studentIdx: 2, profIdx: 2, daysAgo: 25, useCoupon: false },
    { studentIdx: 2, profIdx: 2, daysAgo: 10, useCoupon: true },
    { studentIdx: 3, profIdx: 3, daysAgo: 55, useCoupon: true },
    { studentIdx: 3, profIdx: 3, daysAgo: 40, useCoupon: false },
    { studentIdx: 3, profIdx: 3, daysAgo: 25, useCoupon: true },
    { studentIdx: 4, profIdx: 0, daysAgo: 30, useCoupon: false },
    { studentIdx: 4, profIdx: 0, daysAgo: 15, useCoupon: true },
    { studentIdx: 5, profIdx: 1, daysAgo: 45, useCoupon: true },
    { studentIdx: 5, profIdx: 1, daysAgo: 30, useCoupon: false },
    { studentIdx: 5, profIdx: 2, daysAgo: 15, useCoupon: false },
    { studentIdx: 6, profIdx: 3, daysAgo: 60, useCoupon: true },
    { studentIdx: 6, profIdx: 3, daysAgo: 45, useCoupon: false },
    { studentIdx: 6, profIdx: 3, daysAgo: 30, useCoupon: false },
    { studentIdx: 7, profIdx: 0, daysAgo: 50, useCoupon: true },
    { studentIdx: 7, profIdx: 0, daysAgo: 35, useCoupon: false },
    { studentIdx: 8, profIdx: 1, daysAgo: 20, useCoupon: false },
    { studentIdx: 9, profIdx: 2, daysAgo: 12, useCoupon: true },
  ];

  for (const apt of pastAppointments) {
    const student = studentProfiles[apt.studentIdx % studentProfiles.length];
    const prof = professionals[apt.profIdx % professionals.length];
    const date = addDays(new Date(), -apt.daysAgo);
    const coupon = apt.useCoupon && coupons?.length ? randomElement(coupons) : null;

    const { error } = await supabase.from("agendamentos").insert({
      professional_id: prof.id,
      user_id: DEMO_USER_ID,
      tenant_id: MEDCOS_TENANT_ID,
      nome_paciente: student.nome,
      email_paciente: student.email,
      telefone_paciente: "(19) 98888-0000",
      data_consulta: formatDate(date),
      horario: formatTime(randomInt(9, 18)),
      valor: prof.preco_consulta,
      status: "realizado",
      payment_status: "paid",
      coupon_id: coupon?.id || null,
      observacoes: `Consulta demo realizada ${DEMO_MARKER}`,
    });

    if (error) {
      console.error(`[Seed UNICAMP] Error creating past appointment:`, JSON.stringify(error));
    } else {
      past++;
    }
  }

  // Cancelled appointments (3)
  const cancelledAppointments = [
    { studentIdx: 4, profIdx: 1, daysAgo: 22, reason: "Conflito de horário" },
    { studentIdx: 3, profIdx: 0, daysAgo: 18, reason: "Problema de saúde" },
    { studentIdx: 2, profIdx: 3, daysAgo: 8, reason: "Imprevisto pessoal" },
  ];

  for (const apt of cancelledAppointments) {
    const student = studentProfiles[apt.studentIdx % studentProfiles.length];
    const prof = professionals[apt.profIdx % professionals.length];
    const date = addDays(new Date(), -apt.daysAgo);

    const { error } = await supabase.from("agendamentos").insert({
      professional_id: prof.id,
      user_id: DEMO_USER_ID,
      tenant_id: MEDCOS_TENANT_ID,
      nome_paciente: student.nome,
      email_paciente: student.email,
      telefone_paciente: "(19) 98888-0000",
      data_consulta: formatDate(date),
      horario: formatTime(randomInt(9, 18)),
      valor: prof.preco_consulta,
      status: "cancelado",
      payment_status: "refunded",
      observacoes: `Cancelado: ${apt.reason} ${DEMO_MARKER}`,
    });

    if (error) {
      console.error(`[Seed UNICAMP] Error creating cancelled appointment:`, JSON.stringify(error));
    } else {
      cancelled++;
    }
  }

  // Future appointments (12)
  const futureAppointments = [
    { studentIdx: 0, profIdx: 0, daysAhead: 3, status: "confirmado", useCoupon: true },
    { studentIdx: 1, profIdx: 1, daysAhead: 5, status: "confirmado", useCoupon: false },
    { studentIdx: 2, profIdx: 2, daysAhead: 7, status: "pendente", useCoupon: true },
    { studentIdx: 3, profIdx: 3, daysAhead: 2, status: "confirmado", useCoupon: true },
    { studentIdx: 4, profIdx: 0, daysAhead: 10, status: "confirmado", useCoupon: false },
    { studentIdx: 5, profIdx: 1, daysAhead: 4, status: "pendente", useCoupon: true },
    { studentIdx: 6, profIdx: 2, daysAhead: 18, status: "confirmado", useCoupon: false },
    { studentIdx: 7, profIdx: 3, daysAhead: 20, status: "pendente", useCoupon: true },
    { studentIdx: 8, profIdx: 0, daysAhead: 22, status: "confirmado", useCoupon: false },
    { studentIdx: 9, profIdx: 1, daysAhead: 15, status: "confirmado", useCoupon: true },
    { studentIdx: 0, profIdx: 2, daysAhead: 25, status: "pendente", useCoupon: false },
    { studentIdx: 1, profIdx: 3, daysAhead: 28, status: "confirmado", useCoupon: true },
  ];

  for (const apt of futureAppointments) {
    const student = studentProfiles[apt.studentIdx % studentProfiles.length];
    const prof = professionals[apt.profIdx % professionals.length];
    const date = addDays(new Date(), apt.daysAhead);
    const coupon = apt.useCoupon && coupons?.length ? randomElement(coupons) : null;

    const { error } = await supabase.from("agendamentos").insert({
      professional_id: prof.id,
      user_id: DEMO_USER_ID,
      tenant_id: MEDCOS_TENANT_ID,
      nome_paciente: student.nome,
      email_paciente: student.email,
      telefone_paciente: "(19) 98888-0000",
      data_consulta: formatDate(date),
      horario: formatTime(randomInt(9, 18)),
      valor: prof.preco_consulta,
      status: apt.status,
      payment_status: apt.status === "confirmado" ? "paid" : "pending_payment",
      coupon_id: coupon?.id || null,
      observacoes: `Consulta demo agendada ${DEMO_MARKER}`,
    });

    if (error) {
      console.error(`[Seed UNICAMP] Error creating future appointment:`, JSON.stringify(error));
    } else {
      future++;
    }
  }

  console.log(`[Seed UNICAMP] Created appointments - Past: ${past}, Cancelled: ${cancelled}, Future: ${future}`);
  return { created: past + cancelled + future, past, cancelled, future };
}

async function cleanup(supabase: any): Promise<{ deleted: any }> {
  console.log("[Seed UNICAMP] Cleaning up demo data...");
  const deleted: any = {};

  // Delete appointments
  const { count: appointments } = await supabase
    .from("agendamentos")
    .delete({ count: "exact" })
    .like("observacoes", `%${DEMO_MARKER}%`);
  deleted.appointments = appointments || 0;

  // Delete mood entries
  const { count: moodEntries } = await supabase
    .from("mood_entries")
    .delete({ count: "exact" })
    .like("journal_text", `%${DEMO_MARKER}%`);
  deleted.moodEntries = moodEntries || 0;

  // Delete coupons
  const { count: coupons } = await supabase
    .from("institution_coupons")
    .delete({ count: "exact" })
    .like("description", `%${DEMO_MARKER}%`);
  deleted.coupons = coupons || 0;

  // Get patient IDs via email
  const { data: patientProfiles } = await supabase
    .from("profiles")
    .select("id")
    .like("email", `%${EMAIL_DOMAIN}`)
    .eq("tipo_usuario", "paciente");

  if (patientProfiles?.length) {
    const { data: patients } = await supabase
      .from("pacientes")
      .select("id")
      .in("profile_id", patientProfiles.map((p: any) => p.id));

    if (patients?.length) {
      for (const patient of patients) {
        await supabase
          .from("patient_institutions")
          .delete()
          .eq("patient_id", patient.id);
      }

      const { count: patientsCount } = await supabase
        .from("pacientes")
        .delete({ count: "exact" })
        .in("id", patients.map((p: any) => p.id));
      deleted.patients = patientsCount || 0;
    }
  }

  // Get professional IDs
  const { data: professionals } = await supabase
    .from("profissionais")
    .select("id, profile_id")
    .like("resumo", `%${DEMO_MARKER}%`);

  if (professionals?.length) {
    for (const prof of professionals) {
      await supabase
        .from("professional_institutions")
        .delete()
        .eq("professional_id", prof.id);
      await supabase
        .from("professional_tenants")
        .delete()
        .eq("professional_id", prof.id);
    }

    const { count: professionalsCount } = await supabase
      .from("profissionais")
      .delete({ count: "exact" })
      .like("resumo", `%${DEMO_MARKER}%`);
    deleted.professionals = professionalsCount || 0;
  }

  // Delete profiles
  const { count: profiles } = await supabase
    .from("profiles")
    .delete({ count: "exact" })
    .like("email", `%${EMAIL_DOMAIN}`);
  deleted.profiles = profiles || 0;

  console.log("[Seed UNICAMP] Cleanup complete:", deleted);
  return { deleted };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();
    console.log(`[Seed UNICAMP] Received action: ${action}`);

    let result: any = {};

    switch (action) {
      case "seed_all":
        const existing = await checkExistingDemoData(supabase);
        if (existing.professionals > 0 || existing.students > 0 || existing.coupons > 0) {
          console.log("[Seed UNICAMP] Existing demo data found, cleaning up first...", existing);
          await cleanup(supabase);
        }

        const profs = await seedProfessionals(supabase);
        const students = await seedStudents(supabase);
        const coupons = await seedCoupons(supabase);
        const moods = await seedMoodEntries(supabase);
        const apts = await seedAppointments(supabase);
        result = {
          message: "Cenário UNICAMP completo criado com sucesso!",
          details: { professionals: profs, students, coupons, moodEntries: moods, appointments: apts },
        };
        break;

      case "seed_professionals":
        result = {
          message: "Profissionais UNICAMP criados com sucesso!",
          details: await seedProfessionals(supabase),
        };
        break;

      case "seed_students":
        result = {
          message: "Alunos UNICAMP criados com sucesso!",
          details: await seedStudents(supabase),
        };
        break;

      case "seed_coupons":
        result = {
          message: "Cupons UNICAMP criados com sucesso!",
          details: await seedCoupons(supabase),
        };
        break;

      case "seed_mood_entries":
        result = {
          message: "Diários emocionais UNICAMP criados com sucesso!",
          details: await seedMoodEntries(supabase),
        };
        break;

      case "seed_appointments":
        result = {
          message: "Agendamentos UNICAMP criados com sucesso!",
          details: await seedAppointments(supabase),
        };
        break;

      case "cleanup":
        result = {
          message: "Dados demo UNICAMP removidos com sucesso!",
          details: await cleanup(supabase),
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Seed UNICAMP] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
