import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brazilian names for dynamic generation
const FIRST_NAMES = [
  "Ana", "Beatriz", "Camila", "Daniela", "Eduardo", "Fernando", "Gabriela", 
  "Helena", "Igor", "Julia", "Leonardo", "Mariana", "Nicolas", "Patricia", 
  "Rafael", "Thiago", "Vanessa", "William", "Yara", "Lucas", "Carolina",
  "Bruno", "Leticia", "Gustavo", "Fernanda", "Raquel", "Vitor", "Amanda",
  "Marcos", "Bianca", "Caio", "Laura", "Diego", "Isabela", "Pedro"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", 
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", 
  "Nascimento", "Andrade", "Melo", "Torres", "Prado", "Freitas", "Moreira",
  "Barbosa", "Nunes", "Dias", "Mendes", "Vieira", "Rocha", "Monteiro"
];

const SPECIALTIES = [
  ["Terapia Cognitivo-Comportamental", "Ansiedade", "Depressão"],
  ["Psicanálise", "Trauma", "Luto"],
  ["Neuropsicologia", "TDAH", "Autismo"],
  ["Terapia Familiar", "Relacionamentos", "Autoestima"],
  ["Psicologia Infantil", "Desenvolvimento", "Aprendizagem"],
  ["Gestalt-terapia", "Autoconhecimento", "Estresse"],
  ["Psicologia Organizacional", "Burnout", "Carreira"],
];

const PROFESSIONS = [
  { title: "Psicólogo(a) Clínico(a)", prefix: "Dr(a)." },
  { title: "Psicólogo(a)", prefix: "Dr(a)." },
  { title: "Psicanalista", prefix: "Dr(a)." },
  { title: "Neuropsicólogo(a)", prefix: "Dr(a)." },
  { title: "Estudante de Psicologia", prefix: "" },
];

const MOOD_TAGS = [
  "#ansiedade", "#calma", "#foco", "#sono", "#exercício", "#meditação",
  "#trabalho", "#família", "#amigos", "#lazer", "#estudos", "#provas",
  "#estágio", "#tcc", "#relacionamento", "#autoestima", "#gratidão"
];

const JOURNAL_TEMPLATES = [
  "Hoje foi um dia produtivo. Consegui manter o foco nas atividades.",
  "Senti um pouco de ansiedade pela manhã, mas melhorou ao longo do dia.",
  "Tive uma boa noite de sono e acordei disposto(a).",
  "As aulas foram intensas, mas aprendi muito.",
  "Pratiquei meditação e me senti mais tranquilo(a).",
  "Conversei com amigos e isso melhorou meu humor.",
  "Dia de provas foi estressante, mas consegui me controlar.",
  "Fiz exercícios físicos e me senti mais energizado(a).",
  "Tive dificuldade para dormir ontem à noite.",
  "O estágio está sendo desafiador mas gratificante.",
  "Sinto que estou evoluindo no meu autoconhecimento.",
  "Dia tranquilo, consegui equilibrar estudos e descanso.",
];

// Tenant IDs
const TENANT_MEDCOS = "3a9ae5ec-50a9-4674-b808-7735e5f0afb5";
const TENANT_RBE = "472db0ac-0f45-4998-97da-490bc579efb1";

// Helper functions
function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomName(): { firstName: string; lastName1: string; lastName2: string; fullName: string } {
  const firstName = getRandomItem(FIRST_NAMES);
  const lastName1 = getRandomItem(LAST_NAMES);
  const lastName2 = getRandomItem(LAST_NAMES.filter(n => n !== lastName1));
  return {
    firstName,
    lastName1,
    lastName2,
    fullName: `${firstName} ${lastName1} ${lastName2}`,
  };
}

function generateEmailDomain(institutionName: string): string {
  // Extract acronym from parentheses if present
  const match = institutionName.match(/\(([^)]+)\)/);
  if (match) {
    return `${match[1].toLowerCase().replace(/\s+/g, '')}.edu.br`;
  }
  
  // Generate slug from name
  const slug = institutionName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/universidade|centro|faculdade|instituto|de|do|da|dos|das|universitário|universitaria/gi, '')
    .trim()
    .split(' ')
    .filter(Boolean)[0] || 'demo';
  
  return `${slug}.edu.br`;
}

function generateCRP(): string {
  const region = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
  const number = String(Math.floor(Math.random() * 900000) + 100000);
  return `CRP ${region}/${number}`;
}

function generateDemoMarker(institutionName: string): string {
  const match = institutionName.match(/\(([^)]+)\)/);
  const acronym = match ? match[1].toUpperCase() : institutionName.toUpperCase().slice(0, 10);
  return `[DEMO-${acronym}]`;
}

function getRandomDate(daysBack: number): Date {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysBack);
  return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
}

function getFutureDate(daysAhead: number): Date {
  const now = new Date();
  return new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
}

// Main seeding functions
async function seedProfessionals(
  supabase: any,
  institutionId: string,
  institutionName: string,
  count: number,
  tenantId: string
) {
  const demoMarker = generateDemoMarker(institutionName);
  const emailDomain = generateEmailDomain(institutionName);
  const professionals = [];

  console.log(`[seed-demo-data] Creating ${count} professionals for ${institutionName}`);

  for (let i = 0; i < count; i++) {
    const name = generateRandomName();
    const profession = getRandomItem(PROFESSIONS);
    const specialties = getRandomItem(SPECIALTIES);
    const price = Math.floor(Math.random() * 120) + 80; // 80-200
    
    const displayName = profession.prefix 
      ? `${profession.prefix} ${name.fullName}` 
      : name.fullName;
    
    const email = `${name.firstName.toLowerCase()}.${name.lastName1.toLowerCase()}@${emailDomain}`;

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        nome: name.fullName,
        email: email,
        tipo_usuario: "profissional",
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (profileError) {
      console.error(`Error creating profile: ${profileError.message}`);
      continue;
    }

    // Create professional
    const { data: professional, error: profError } = await supabase
      .from("profissionais")
      .insert({
        profile_id: profile.id,
        display_name: displayName,
        first_name: name.firstName,
        last_name: `${name.lastName1} ${name.lastName2}`,
        user_email: email,
        profissao: profession.title,
        crp_crm: generateCRP(),
        preco_consulta: price,
        resumo: `${demoMarker} Profissional especializado em ${specialties.join(", ")}.`,
        resumo_profissional: `Atendimento focado em ${specialties[0]} com abordagem humanizada.`,
        servicos_normalizados: specialties,
        ativo: true,
        em_destaque: i < 2, // First 2 are featured
        ordem_destaque: i < 2 ? i + 1 : null,
      })
      .select()
      .single();

    if (profError) {
      console.error(`Error creating professional: ${profError.message}`);
      continue;
    }

    // Link to institution
    await supabase.from("professional_institutions").insert({
      professional_id: professional.id,
      institution_id: institutionId,
      relationship_type: i % 3 === 0 ? "employee" : "partner",
      is_active: true,
      start_date: getRandomDate(365).toISOString().split("T")[0],
    });

    // Link to tenant
    await supabase.from("professional_tenants").insert({
      professional_id: professional.id,
      tenant_id: tenantId,
      is_featured: i < 2,
      featured_order: i < 2 ? i + 1 : null,
    });

    professionals.push(professional);
  }

  return professionals;
}

async function seedStudents(
  supabase: any,
  institutionId: string,
  institutionName: string,
  count: number,
  tenantId: string
) {
  const demoMarker = generateDemoMarker(institutionName);
  const emailDomain = generateEmailDomain(institutionName);
  const students = [];
  const statuses = ["enrolled", "enrolled", "enrolled", "enrolled", "graduated", "inactive"];

  console.log(`[seed-demo-data] Creating ${count} students for ${institutionName}`);

  for (let i = 0; i < count; i++) {
    const name = generateRandomName();
    const email = `${name.firstName.toLowerCase()}.${name.lastName1.toLowerCase()}@${emailDomain}`;
    const status = getRandomItem(statuses);

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        nome: name.fullName,
        email: email,
        tipo_usuario: "paciente",
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (profileError) {
      console.error(`Error creating student profile: ${profileError.message}`);
      continue;
    }

    // Create patient record
    const { data: patient, error: patientError } = await supabase
      .from("pacientes")
      .insert({
        profile_id: profile.id,
        nome: name.fullName,
        email: email,
        telefone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
        instituicao_ensino: institutionName,
        observacoes: `${demoMarker} Estudante demo`,
      })
      .select()
      .single();

    if (patientError) {
      console.error(`Error creating patient: ${patientError.message}`);
      continue;
    }

    // Link to institution
    await supabase.from("patient_institutions").insert({
      patient_id: patient.id,
      institution_id: institutionId,
      enrollment_status: status,
      enrollment_date: getRandomDate(365).toISOString().split("T")[0],
    });

    students.push({ profile, patient });
  }

  return students;
}

async function seedCoupons(
  supabase: any,
  institutionId: string,
  institutionName: string,
  tenantId: string
) {
  const match = institutionName.match(/\(([^)]+)\)/);
  const acronym = match ? match[1].toUpperCase() : institutionName.toUpperCase().slice(0, 8);
  const tenantSuffix = tenantId === TENANT_MEDCOS ? "MEDCOS" : "RBE";

  console.log(`[seed-demo-data] Creating coupons for ${institutionName}`);

  const coupons = [
    {
      code: `${acronym}-BOAS-VINDAS-${tenantSuffix}`,
      name: "Boas-vindas Institucional",
      discount_type: "percentage",
      discount_value: 20,
      target_audience: "institution_members",
    },
    {
      code: `${acronym}-PRIMEIRA-${tenantSuffix}`,
      name: "Primeira Sessão",
      discount_type: "fixed_amount",
      discount_value: 40,
      target_audience: "all",
    },
    {
      code: `${acronym}-ESTUDANTE-${tenantSuffix}`,
      name: "Desconto Estudante",
      discount_type: "percentage",
      discount_value: 25,
      target_audience: "institution_members",
    },
  ];

  for (const coupon of coupons) {
    await supabase.from("institution_coupons").insert({
      institution_id: institutionId,
      tenant_id: tenantId,
      code: coupon.code,
      name: coupon.name,
      description: `[DEMO] Cupom promocional ${coupon.name}`,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      target_audience: coupon.target_audience,
      is_active: true,
      valid_from: new Date().toISOString(),
      valid_until: "2026-12-31T23:59:59Z",
      maximum_uses: 100,
      uses_per_user: 1,
    });
  }

  return coupons.length;
}

async function seedMoodEntries(
  supabase: any,
  institutionId: string,
  students: any[],
  entriesPerStudent: number,
  tenantId: string
) {
  console.log(`[seed-demo-data] Creating ~${students.length * entriesPerStudent} mood entries`);

  let totalCreated = 0;

  for (const student of students) {
    for (let i = 0; i < entriesPerStudent; i++) {
      const date = getRandomDate(30);
      const tags = getRandomItems(MOOD_TAGS, Math.floor(Math.random() * 3) + 1);

      await supabase.from("mood_entries").insert({
        profile_id: student.profile.id,
        tenant_id: tenantId,
        date: date.toISOString().split("T")[0],
        mood_score: Math.floor(Math.random() * 5) + 1,
        anxiety_level: Math.floor(Math.random() * 5) + 1,
        energy_level: Math.floor(Math.random() * 5) + 1,
        sleep_hours: Math.floor(Math.random() * 5) + 4, // 4-9 hours
        sleep_quality: Math.floor(Math.random() * 5) + 1,
        journal_text: getRandomItem(JOURNAL_TEMPLATES),
        tags: tags,
      });

      totalCreated++;
    }
  }

  return totalCreated;
}

async function seedAppointments(
  supabase: any,
  institutionName: string,
  professionals: any[],
  students: any[],
  tenantId: string
) {
  if (professionals.length === 0 || students.length === 0) {
    console.log("[seed-demo-data] Skipping appointments - no professionals or students");
    return 0;
  }

  const demoMarker = generateDemoMarker(institutionName);
  console.log(`[seed-demo-data] Creating appointments for ${institutionName}`);

  let created = 0;
  const statuses = [
    { status: "realizado", count: 25, isPast: true },
    { status: "cancelado", count: 3, isPast: true },
    { status: "confirmado", count: 8, isPast: false },
    { status: "pendente", count: 4, isPast: false },
  ];

  for (const config of statuses) {
    for (let i = 0; i < config.count; i++) {
      const professional = getRandomItem(professionals);
      const student = getRandomItem(students);
      const date = config.isPast 
        ? getRandomDate(60) 
        : getFutureDate(Math.floor(Math.random() * 30) + 1);
      
      const hour = 8 + Math.floor(Math.random() * 10); // 8-17
      const horario = `${String(hour).padStart(2, '0')}:00:00`;

      await supabase.from("agendamentos").insert({
        professional_id: professional.id,
        user_id: student.profile.user_id || student.profile.id,
        tenant_id: tenantId,
        nome_paciente: student.patient.nome,
        email_paciente: student.patient.email,
        telefone_paciente: student.patient.telefone,
        data_consulta: date.toISOString().split("T")[0],
        horario: horario,
        status: config.status,
        valor: professional.preco_consulta,
        observacoes: `${demoMarker} Agendamento demo`,
      });

      created++;
    }
  }

  return created;
}

async function cleanup(
  supabase: any,
  institutionId: string,
  institutionName: string
) {
  const demoMarker = generateDemoMarker(institutionName);
  const emailDomain = generateEmailDomain(institutionName);
  
  console.log(`[seed-demo-data] Cleaning up demo data for ${institutionName}`);
  console.log(`[seed-demo-data] Demo marker: ${demoMarker}, Email domain: ${emailDomain}`);

  // Delete coupons with [DEMO] in description
  await supabase
    .from("institution_coupons")
    .delete()
    .eq("institution_id", institutionId)
    .ilike("description", "%[DEMO]%");

  // Get professional IDs linked to this institution
  const { data: profLinks } = await supabase
    .from("professional_institutions")
    .select("professional_id")
    .eq("institution_id", institutionId);

  if (profLinks && profLinks.length > 0) {
    const profIds = profLinks.map((p: any) => p.professional_id);
    
    // Delete appointments with demo marker
    await supabase
      .from("agendamentos")
      .delete()
      .in("professional_id", profIds)
      .ilike("observacoes", `%${demoMarker}%`);
    
    // Get professionals with demo marker
    const { data: demoProfs } = await supabase
      .from("profissionais")
      .select("id, profile_id")
      .in("id", profIds)
      .ilike("resumo", `%${demoMarker}%`);

    if (demoProfs && demoProfs.length > 0) {
      const demoProfIds = demoProfs.map((p: any) => p.id);
      const demoProfProfileIds = demoProfs.map((p: any) => p.profile_id).filter(Boolean);

      // Delete professional links
      await supabase
        .from("professional_institutions")
        .delete()
        .in("professional_id", demoProfIds);

      await supabase
        .from("professional_tenants")
        .delete()
        .in("professional_id", demoProfIds);

      // Delete professionals
      await supabase
        .from("profissionais")
        .delete()
        .in("id", demoProfIds);

      // Delete profiles
      if (demoProfProfileIds.length > 0) {
        await supabase
          .from("profiles")
          .delete()
          .in("id", demoProfProfileIds);
      }
    }
  }

  // Get patient IDs linked to this institution
  const { data: patientLinks } = await supabase
    .from("patient_institutions")
    .select("patient_id")
    .eq("institution_id", institutionId);

  if (patientLinks && patientLinks.length > 0) {
    const patientIds = patientLinks.map((p: any) => p.patient_id);
    
    // Get patients with demo marker
    const { data: demoPatients } = await supabase
      .from("pacientes")
      .select("id, profile_id")
      .in("id", patientIds)
      .ilike("observacoes", `%${demoMarker}%`);

    if (demoPatients && demoPatients.length > 0) {
      const demoPatientIds = demoPatients.map((p: any) => p.id);
      const demoPatientProfileIds = demoPatients.map((p: any) => p.profile_id).filter(Boolean);

      // Delete mood entries
      if (demoPatientProfileIds.length > 0) {
        await supabase
          .from("mood_entries")
          .delete()
          .in("profile_id", demoPatientProfileIds);
      }

      // Delete patient links
      await supabase
        .from("patient_institutions")
        .delete()
        .in("patient_id", demoPatientIds);

      // Delete patients
      await supabase
        .from("pacientes")
        .delete()
        .in("id", demoPatientIds);

      // Delete profiles
      if (demoPatientProfileIds.length > 0) {
        await supabase
          .from("profiles")
          .delete()
          .in("id", demoPatientProfileIds);
      }
    }
  }

  return { success: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user authentication
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      action,
      institution_id,
      institution_name,
      institution_type = "private",
      professionals_count = 5,
      students_count = 10,
      mood_entries_per_student = 12,
      tenant_id = TENANT_MEDCOS,
    } = await req.json();

    console.log(`[seed-demo-data] Action: ${action}, Institution: ${institution_name || institution_id}`);

    let finalInstitutionId = institution_id;
    let finalInstitutionName = institution_name;

    // Create institution if needed
    if (action === "create_institution" && institution_name) {
      const { data: newInst, error: instError } = await supabase
        .from("educational_institutions")
        .insert({
          name: institution_name,
          type: institution_type,
          is_active: true,
          has_partnership: true,
          can_manage_users: true,
          can_manage_coupons: true,
          can_manage_professionals: true,
        })
        .select()
        .single();

      if (instError) {
        throw new Error(`Failed to create institution: ${instError.message}`);
      }

      finalInstitutionId = newInst.id;
      finalInstitutionName = newInst.name;
      console.log(`[seed-demo-data] Created institution: ${newInst.name} (${newInst.id})`);
    }

    // Get institution name if only ID provided
    if (finalInstitutionId && !finalInstitutionName) {
      const { data: inst } = await supabase
        .from("educational_institutions")
        .select("name")
        .eq("id", finalInstitutionId)
        .single();
      
      finalInstitutionName = inst?.name || "Unknown";
    }

    if (!finalInstitutionId) {
      throw new Error("institution_id or institution_name is required");
    }

    const details: any = {};

    switch (action) {
      case "create_institution":
      case "seed_all": {
        // Cleanup first if seeding all
        if (action === "seed_all") {
          await cleanup(supabase, finalInstitutionId, finalInstitutionName);
        }

        const professionals = await seedProfessionals(
          supabase, finalInstitutionId, finalInstitutionName, 
          professionals_count, tenant_id
        );
        details.professionals = professionals.length;

        const students = await seedStudents(
          supabase, finalInstitutionId, finalInstitutionName,
          students_count, tenant_id
        );
        details.students = students.length;

        const couponsCreated = await seedCoupons(
          supabase, finalInstitutionId, finalInstitutionName, tenant_id
        );
        details.coupons = couponsCreated;

        const moodEntriesCreated = await seedMoodEntries(
          supabase, finalInstitutionId, students, 
          mood_entries_per_student, tenant_id
        );
        details.mood_entries = moodEntriesCreated;

        const appointmentsCreated = await seedAppointments(
          supabase, finalInstitutionName, professionals, students, tenant_id
        );
        details.appointments = appointmentsCreated;

        break;
      }

      case "seed_professionals": {
        const professionals = await seedProfessionals(
          supabase, finalInstitutionId, finalInstitutionName,
          professionals_count, tenant_id
        );
        details.professionals = professionals.length;
        break;
      }

      case "seed_students": {
        const students = await seedStudents(
          supabase, finalInstitutionId, finalInstitutionName,
          students_count, tenant_id
        );
        details.students = students.length;
        break;
      }

      case "seed_coupons": {
        const couponsCreated = await seedCoupons(
          supabase, finalInstitutionId, finalInstitutionName, tenant_id
        );
        details.coupons = couponsCreated;
        break;
      }

      case "seed_mood_entries": {
        // Need to get existing students first
        const { data: patientLinks } = await supabase
          .from("patient_institutions")
          .select("patient_id")
          .eq("institution_id", finalInstitutionId);

        if (patientLinks && patientLinks.length > 0) {
          const patientIds = patientLinks.map((p: any) => p.patient_id);
          const { data: patients } = await supabase
            .from("pacientes")
            .select("id, profile_id, nome, email, telefone")
            .in("id", patientIds);

          if (patients) {
            const studentsData = patients.map((p: any) => ({
              profile: { id: p.profile_id },
              patient: p,
            }));

            const moodEntriesCreated = await seedMoodEntries(
              supabase, finalInstitutionId, studentsData,
              mood_entries_per_student, tenant_id
            );
            details.mood_entries = moodEntriesCreated;
          }
        }
        break;
      }

      case "seed_appointments": {
        // Get existing professionals and students
        const { data: profLinks } = await supabase
          .from("professional_institutions")
          .select("professional_id")
          .eq("institution_id", finalInstitutionId);

        const { data: patientLinks } = await supabase
          .from("patient_institutions")
          .select("patient_id")
          .eq("institution_id", finalInstitutionId);

        if (profLinks && patientLinks) {
          const profIds = profLinks.map((p: any) => p.professional_id);
          const patientIds = patientLinks.map((p: any) => p.patient_id);

          const { data: professionals } = await supabase
            .from("profissionais")
            .select("id, preco_consulta")
            .in("id", profIds);

          const { data: patients } = await supabase
            .from("pacientes")
            .select("id, profile_id, nome, email, telefone")
            .in("id", patientIds);

          if (professionals && patients) {
            const studentsData = patients.map((p: any) => ({
              profile: { id: p.profile_id, user_id: p.profile_id },
              patient: p,
            }));

            const appointmentsCreated = await seedAppointments(
              supabase, finalInstitutionName, professionals, studentsData, tenant_id
            );
            details.appointments = appointmentsCreated;
          }
        }
        break;
      }

      case "cleanup": {
        await cleanup(supabase, finalInstitutionId, finalInstitutionName);
        details.cleaned = true;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ação "${action}" executada com sucesso para ${finalInstitutionName}`,
        details,
        institution_id: finalInstitutionId,
        institution_name: finalInstitutionName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[seed-demo-data] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
