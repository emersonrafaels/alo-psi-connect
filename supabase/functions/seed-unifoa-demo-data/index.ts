import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const UNIFOA_ID = "33b11baa-2679-4673-a72e-b705c76c73f1";
const DEFAULT_TENANT_ID = "472db0ac-0f45-4998-97da-490bc579efb1"; // Rede Bem Estar
const DEMO_MARKER = "[DEMO-UNIFOA]";

// Professional data
const PROFESSIONALS = [
  {
    nome: "Dr. Ricardo Alves Monteiro",
    email: "ricardo.monteiro@unifoa.edu.br",
    telefone: "(24) 99999-0001",
    profissao: "Psicólogo",
    especialidades: ["TCC", "Ansiedade", "Depressão"],
    preco: 180,
    crp: "CRP 05/12345",
    relationship_type: "supervisor",
    bio: "Psicólogo clínico com especialização em Terapia Cognitivo-Comportamental. Professor e supervisor de estágio na UniFOA.",
  },
  {
    nome: "Dra. Fernanda Lima Santos",
    email: "fernanda.lima@unifoa.edu.br",
    telefone: "(24) 99999-0002",
    profissao: "Psicólogo",
    especialidades: ["Psicanálise", "Luto", "Trauma"],
    preco: 200,
    crp: "CRP 05/23456",
    relationship_type: "supervisor",
    bio: "Psicóloga com formação psicanalítica. Especialista em luto e trauma. Coordenadora do núcleo de atendimento psicológico da UniFOA.",
  },
  {
    nome: "Dr. Carlos Eduardo Martins",
    email: "carlos.martins@unifoa.edu.br",
    telefone: "(24) 99999-0003",
    profissao: "Psicólogo",
    especialidades: ["Neuropsicologia", "TDAH", "Avaliação Psicológica"],
    preco: 220,
    crp: "CRP 05/34567",
    relationship_type: "affiliated",
    bio: "Neuropsicólogo especializado em avaliação e reabilitação cognitiva. Atende crianças, adolescentes e adultos.",
  },
  {
    nome: "Dra. Patricia Rocha Silva",
    email: "patricia.rocha@unifoa.edu.br",
    telefone: "(24) 99999-0004",
    profissao: "Psicoterapeuta",
    especialidades: ["Terapia de Casal", "Terapia Familiar", "Mediação de Conflitos"],
    preco: 190,
    crp: "CRP 05/45678",
    relationship_type: "affiliated",
    bio: "Psicoterapeuta sistêmica especializada em relações familiares e conjugais. Experiência de 15 anos em clínica.",
  },
  {
    nome: "Dr. André Luiz Ferreira",
    email: "andre.ferreira@unifoa.edu.br",
    telefone: "(24) 99999-0005",
    profissao: "Psicólogo",
    especialidades: ["Psicologia Esportiva", "Alta Performance", "Motivação"],
    preco: 170,
    crp: "CRP 05/56789",
    relationship_type: "affiliated",
    bio: "Psicólogo esportivo com experiência em equipes de alto rendimento. Trabalha com atletas profissionais e amadores.",
  },
];

// Student data
const STUDENTS = [
  { nome: "Lucas Mendes Silva", email: "lucas.mendes@unifoa.edu.br", telefone: "(24) 98888-0001", periodo: "7º", status: "enrolled" },
  { nome: "Mariana Costa Oliveira", email: "mariana.costa@unifoa.edu.br", telefone: "(24) 98888-0002", periodo: "5º", status: "enrolled" },
  { nome: "Rafael Santos Pereira", email: "rafael.santos@unifoa.edu.br", telefone: "(24) 98888-0003", periodo: "9º", status: "enrolled" },
  { nome: "Julia Almeida Rodrigues", email: "julia.almeida@unifoa.edu.br", telefone: "(24) 98888-0004", periodo: "3º", status: "enrolled" },
  { nome: "Gabriel Ferreira Lima", email: "gabriel.ferreira@unifoa.edu.br", telefone: "(24) 98888-0005", periodo: "8º", status: "enrolled" },
  { nome: "Ana Beatriz Souza", email: "ana.beatriz@unifoa.edu.br", telefone: "(24) 98888-0006", periodo: "6º", status: "enrolled" },
  { nome: "Pedro Henrique Carvalho", email: "pedro.carvalho@unifoa.edu.br", telefone: "(24) 98888-0007", periodo: "4º", status: "graduated" },
  { nome: "Isabela Martins Costa", email: "isabela.martins@unifoa.edu.br", telefone: "(24) 98888-0008", periodo: "10º", status: "inactive" },
];

// Coupon data
const COUPONS = [
  {
    code: "UNIFOA20",
    name: "Desconto UniFOA 20%",
    description: "Desconto de 20% para todos os alunos matriculados na UniFOA",
    discount_type: "percentage",
    discount_value: 20,
    target_audience: "institution_students",
    professional_scope: "all_professionals",
    maximum_uses: null,
  },
  {
    code: "UNIFOA50PRIMEIRA",
    name: "R$50 Primeira Consulta",
    description: "Desconto de R$50 na primeira consulta para novos pacientes",
    discount_type: "fixed",
    discount_value: 50,
    target_audience: "non_enrolled_patients",
    professional_scope: "all_professionals",
    maximum_uses: 100,
  },
  {
    code: "PSICO2024",
    name: "Desconto Formandos 30%",
    description: "Desconto especial de 30% para formandos de Psicologia",
    discount_type: "percentage",
    discount_value: 30,
    target_audience: "institution_students",
    professional_scope: "institution_professionals",
    maximum_uses: 50,
  },
  {
    code: "BEMESTAR",
    name: "Bem-Estar 15%",
    description: "Desconto de 15% válido para todos os usuários",
    discount_type: "percentage",
    discount_value: 15,
    target_audience: "all_patients",
    professional_scope: "all_professionals",
    maximum_uses: 200,
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

// Seed functions
async function seedProfessionals(supabase: any): Promise<{ created: number; ids: number[] }> {
  console.log("[Seed] Creating professionals...");
  const createdIds: number[] = [];

  for (const prof of PROFESSIONALS) {
    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        nome: prof.nome,
        email: prof.email,
        tipo_usuario: "profissional",
        tenant_id: DEFAULT_TENANT_ID,
        user_id: null, // Demo profiles don't have auth users
      })
      .select("id")
      .single();

    if (profileError) {
      console.error(`[Seed] Error creating profile for ${prof.nome}:`, profileError);
      continue;
    }

    // Create professional record
    const { data: professional, error: profError } = await supabase
      .from("profissionais")
      .insert({
        profile_id: profile.id,
        display_name: prof.nome,
        first_name: prof.nome.split(" ")[0],
        email_secundario: prof.email,
        crp_crm: prof.crp,
        profissao: prof.profissao,
        especialidades: prof.especialidades,
        preco: prof.preco,
        bio: prof.bio + ` ${DEMO_MARKER}`,
        ativo: true,
        em_destaque: false,
        user_id: null,
      })
      .select("id")
      .single();

    if (profError) {
      console.error(`[Seed] Error creating professional for ${prof.nome}:`, profError);
      continue;
    }

    // Link to UniFOA
    await supabase.from("professional_institutions").insert({
      professional_id: professional.id,
      institution_id: UNIFOA_ID,
      relationship_type: prof.relationship_type,
      is_active: true,
    });

    // Link to tenant
    await supabase.from("professional_tenants").insert({
      professional_id: professional.id,
      tenant_id: DEFAULT_TENANT_ID,
      is_featured: false,
    });

    createdIds.push(professional.id);
    console.log(`[Seed] Created professional: ${prof.nome} (ID: ${professional.id})`);
  }

  return { created: createdIds.length, ids: createdIds };
}

async function seedStudents(supabase: any): Promise<{ created: number; ids: string[] }> {
  console.log("[Seed] Creating students...");
  const createdIds: string[] = [];

  for (const student of STUDENTS) {
    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        nome: student.nome,
        email: student.email,
        tipo_usuario: "paciente",
        tenant_id: DEFAULT_TENANT_ID,
        user_id: null,
      })
      .select("id")
      .single();

    if (profileError) {
      console.error(`[Seed] Error creating profile for ${student.nome}:`, profileError);
      continue;
    }

    // Create patient record
    const { data: patient, error: patientError } = await supabase
      .from("pacientes")
      .insert({
        profile_id: profile.id,
        eh_estudante: true,
        instituicao_ensino: `UniFOA - ${student.periodo} período ${DEMO_MARKER}`,
        tenant_id: DEFAULT_TENANT_ID,
      })
      .select("id")
      .single();

    if (patientError) {
      console.error(`[Seed] Error creating patient for ${student.nome}:`, patientError);
      continue;
    }

    // Link to UniFOA
    await supabase.from("patient_institutions").insert({
      patient_id: patient.id,
      institution_id: UNIFOA_ID,
      enrollment_status: student.status,
      enrollment_date: formatDate(addDays(new Date(), -365)),
    });

    createdIds.push(patient.id);
    console.log(`[Seed] Created student: ${student.nome} (ID: ${patient.id})`);
  }

  return { created: createdIds.length, ids: createdIds };
}

async function seedCoupons(supabase: any): Promise<{ created: number; ids: string[] }> {
  console.log("[Seed] Creating coupons...");
  const createdIds: string[] = [];

  for (const coupon of COUPONS) {
    const { data, error } = await supabase
      .from("institution_coupons")
      .insert({
        institution_id: UNIFOA_ID,
        tenant_id: DEFAULT_TENANT_ID,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description + ` ${DEMO_MARKER}`,
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
      console.error(`[Seed] Error creating coupon ${coupon.code}:`, error);
      continue;
    }

    createdIds.push(data.id);
    console.log(`[Seed] Created coupon: ${coupon.code} (ID: ${data.id})`);
  }

  return { created: createdIds.length, ids: createdIds };
}

async function seedMoodEntries(supabase: any): Promise<{ created: number }> {
  console.log("[Seed] Creating mood entries...");
  let created = 0;

  // Get student profiles
  const { data: students } = await supabase
    .from("profiles")
    .select("id, user_id")
    .like("email", "%@unifoa.edu.br")
    .eq("tipo_usuario", "paciente");

  if (!students || students.length === 0) {
    console.log("[Seed] No students found for mood entries");
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
        tenant_id: DEFAULT_TENANT_ID,
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

  console.log(`[Seed] Created ${created} mood entries`);
  return { created };
}

async function seedAppointments(supabase: any): Promise<{ created: number; past: number; cancelled: number; future: number }> {
  console.log("[Seed] Creating appointments...");

  // Get professionals and students
  const { data: professionals } = await supabase
    .from("profissionais")
    .select("id, preco, display_name")
    .like("bio", `%${DEMO_MARKER}%`);

  const { data: studentProfiles } = await supabase
    .from("profiles")
    .select("id, nome, email, user_id")
    .like("email", "%@unifoa.edu.br")
    .eq("tipo_usuario", "paciente");

  const { data: coupons } = await supabase
    .from("institution_coupons")
    .select("id, code")
    .like("description", `%${DEMO_MARKER}%`);

  if (!professionals?.length || !studentProfiles?.length) {
    console.log("[Seed] Missing professionals or students for appointments");
    return { created: 0, past: 0, cancelled: 0, future: 0 };
  }

  const DUMMY_USER_ID = "11111111-1111-1111-1111-111111111111";
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
    { studentIdx: 4, profIdx: 4, daysAgo: 30, useCoupon: false },
    { studentIdx: 4, profIdx: 4, daysAgo: 15, useCoupon: true },
    { studentIdx: 5, profIdx: 0, daysAgo: 45, useCoupon: true },
    { studentIdx: 5, profIdx: 0, daysAgo: 30, useCoupon: false },
    { studentIdx: 5, profIdx: 1, daysAgo: 15, useCoupon: false },
    { studentIdx: 6, profIdx: 2, daysAgo: 60, useCoupon: true },
    { studentIdx: 6, profIdx: 2, daysAgo: 45, useCoupon: false },
    { studentIdx: 6, profIdx: 2, daysAgo: 30, useCoupon: false },
    { studentIdx: 7, profIdx: 3, daysAgo: 50, useCoupon: true },
    { studentIdx: 7, profIdx: 3, daysAgo: 35, useCoupon: false },
    { studentIdx: 0, profIdx: 4, daysAgo: 20, useCoupon: false },
    { studentIdx: 1, profIdx: 2, daysAgo: 12, useCoupon: true },
  ];

  for (const apt of pastAppointments) {
    const student = studentProfiles[apt.studentIdx % studentProfiles.length];
    const prof = professionals[apt.profIdx % professionals.length];
    const date = addDays(new Date(), -apt.daysAgo);
    const coupon = apt.useCoupon && coupons?.length ? randomElement(coupons) : null;

    const { error } = await supabase.from("agendamentos").insert({
      professional_id: prof.id,
      user_id: DUMMY_USER_ID,
      tenant_id: DEFAULT_TENANT_ID,
      nome_paciente: student.nome,
      email_paciente: student.email,
      telefone_paciente: "(24) 98888-0000",
      data_consulta: formatDate(date),
      horario: formatTime(randomInt(9, 18)),
      valor: prof.preco,
      status: "realizado",
      payment_status: "paid",
      coupon_id: coupon?.id || null,
      observacoes: `Consulta demo realizada ${DEMO_MARKER}`,
    });

    if (!error) past++;
  }

  // Cancelled appointments (3)
  const cancelledAppointments = [
    { studentIdx: 4, profIdx: 1, daysAgo: 22, reason: "Conflito de horário" },
    { studentIdx: 3, profIdx: 4, daysAgo: 18, reason: "Problema de saúde" },
    { studentIdx: 2, profIdx: 3, daysAgo: 8, reason: "Imprevisto pessoal" },
  ];

  for (const apt of cancelledAppointments) {
    const student = studentProfiles[apt.studentIdx % studentProfiles.length];
    const prof = professionals[apt.profIdx % professionals.length];
    const date = addDays(new Date(), -apt.daysAgo);

    const { error } = await supabase.from("agendamentos").insert({
      professional_id: prof.id,
      user_id: DUMMY_USER_ID,
      tenant_id: DEFAULT_TENANT_ID,
      nome_paciente: student.nome,
      email_paciente: student.email,
      telefone_paciente: "(24) 98888-0000",
      data_consulta: formatDate(date),
      horario: formatTime(randomInt(9, 18)),
      valor: prof.preco,
      status: "cancelado",
      payment_status: "refunded",
      observacoes: `Cancelado: ${apt.reason} ${DEMO_MARKER}`,
    });

    if (!error) cancelled++;
  }

  // Future appointments (12)
  const futureAppointments = [
    { studentIdx: 0, profIdx: 0, daysAhead: 3, status: "confirmado", useCoupon: true },
    { studentIdx: 1, profIdx: 1, daysAhead: 5, status: "confirmado", useCoupon: false },
    { studentIdx: 2, profIdx: 2, daysAhead: 7, status: "pendente", useCoupon: true },
    { studentIdx: 3, profIdx: 3, daysAhead: 2, status: "confirmado", useCoupon: true },
    { studentIdx: 4, profIdx: 4, daysAhead: 10, status: "confirmado", useCoupon: false },
    { studentIdx: 5, profIdx: 0, daysAhead: 4, status: "pendente", useCoupon: true },
    { studentIdx: 0, profIdx: 0, daysAhead: 18, status: "confirmado", useCoupon: false },
    { studentIdx: 1, profIdx: 1, daysAhead: 20, status: "pendente", useCoupon: true },
    { studentIdx: 2, profIdx: 2, daysAhead: 22, status: "confirmado", useCoupon: false },
    { studentIdx: 3, profIdx: 3, daysAhead: 15, status: "confirmado", useCoupon: true },
    { studentIdx: 4, profIdx: 4, daysAhead: 25, status: "pendente", useCoupon: false },
    { studentIdx: 5, profIdx: 1, daysAhead: 28, status: "confirmado", useCoupon: true },
  ];

  for (const apt of futureAppointments) {
    const student = studentProfiles[apt.studentIdx % studentProfiles.length];
    const prof = professionals[apt.profIdx % professionals.length];
    const date = addDays(new Date(), apt.daysAhead);
    const coupon = apt.useCoupon && coupons?.length ? randomElement(coupons) : null;

    const { error } = await supabase.from("agendamentos").insert({
      professional_id: prof.id,
      user_id: DUMMY_USER_ID,
      tenant_id: DEFAULT_TENANT_ID,
      nome_paciente: student.nome,
      email_paciente: student.email,
      telefone_paciente: "(24) 98888-0000",
      data_consulta: formatDate(date),
      horario: formatTime(randomInt(9, 18)),
      valor: prof.preco,
      status: apt.status,
      payment_status: apt.status === "confirmado" ? "paid" : "pending_payment",
      coupon_id: coupon?.id || null,
      observacoes: `Consulta demo agendada ${DEMO_MARKER}`,
    });

    if (!error) future++;
  }

  console.log(`[Seed] Created appointments - Past: ${past}, Cancelled: ${cancelled}, Future: ${future}`);
  return { created: past + cancelled + future, past, cancelled, future };
}

async function cleanup(supabase: any): Promise<{ deleted: any }> {
  console.log("[Seed] Cleaning up demo data...");
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

  // Get patient IDs before deleting
  const { data: patients } = await supabase
    .from("pacientes")
    .select("id")
    .like("instituicao_ensino", `%${DEMO_MARKER}%`);

  if (patients?.length) {
    // Delete patient_institutions
    for (const patient of patients) {
      await supabase
        .from("patient_institutions")
        .delete()
        .eq("patient_id", patient.id);
    }
  }

  // Delete patients
  const { count: patientsCount } = await supabase
    .from("pacientes")
    .delete({ count: "exact" })
    .like("instituicao_ensino", `%${DEMO_MARKER}%`);
  deleted.patients = patientsCount || 0;

  // Get professional IDs before deleting
  const { data: professionals } = await supabase
    .from("profissionais")
    .select("id")
    .like("bio", `%${DEMO_MARKER}%`);

  if (professionals?.length) {
    // Delete professional_institutions and professional_tenants
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
  }

  // Delete professionals
  const { count: professionalsCount } = await supabase
    .from("profissionais")
    .delete({ count: "exact" })
    .like("bio", `%${DEMO_MARKER}%`);
  deleted.professionals = professionalsCount || 0;

  // Delete profiles
  const { count: profiles } = await supabase
    .from("profiles")
    .delete({ count: "exact" })
    .like("email", "%@unifoa.edu.br");
  deleted.profiles = profiles || 0;

  console.log("[Seed] Cleanup complete:", deleted);
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
    console.log(`[Seed] Received action: ${action}`);

    let result: any = {};

    switch (action) {
      case "seed_all":
        const profs = await seedProfessionals(supabase);
        const students = await seedStudents(supabase);
        const coupons = await seedCoupons(supabase);
        const moods = await seedMoodEntries(supabase);
        const apts = await seedAppointments(supabase);
        result = {
          message: "Cenário completo criado com sucesso!",
          details: { professionals: profs, students, coupons, moodEntries: moods, appointments: apts },
        };
        break;

      case "seed_professionals":
        result = {
          message: "Profissionais criados com sucesso!",
          details: await seedProfessionals(supabase),
        };
        break;

      case "seed_students":
        result = {
          message: "Alunos criados com sucesso!",
          details: await seedStudents(supabase),
        };
        break;

      case "seed_coupons":
        result = {
          message: "Cupons criados com sucesso!",
          details: await seedCoupons(supabase),
        };
        break;

      case "seed_mood_entries":
        result = {
          message: "Diários emocionais criados com sucesso!",
          details: await seedMoodEntries(supabase),
        };
        break;

      case "seed_appointments":
        result = {
          message: "Agendamentos criados com sucesso!",
          details: await seedAppointments(supabase),
        };
        break;

      case "cleanup":
        result = {
          message: "Dados demo removidos com sucesso!",
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
    console.error("[Seed] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
