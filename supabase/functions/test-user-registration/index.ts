import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  test_id: string;
  test_type: string;
  tenant: string;
  status: 'success' | 'failed';
  duration_ms: number;
  created_entities?: {
    user_id?: string;
    profile_id?: string;
    professional_id?: number;
    patient_id?: string;
    tenant_association_id?: string;
  };
  validations: Array<{
    check: string;
    passed: boolean;
    details?: string;
  }>;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, tenant, cleanup_user_ids } = await req.json();

    // Cleanup action
    if (action === 'cleanup' && cleanup_user_ids) {
      const cleanupResults = await cleanupTestData(supabaseAdmin, cleanup_user_ids);
      return new Response(JSON.stringify(cleanupResults), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Get tenants
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('*');

    const targetTenant = tenants?.find(t => t.slug === tenant);
    if (!targetTenant) {
      throw new Error(`Tenant ${tenant} não encontrado`);
    }

    let result: TestResult;

    if (action === 'test_professional') {
      result = await testProfessionalRegistration(supabaseAdmin, targetTenant);
    } else if (action === 'test_patient') {
      result = await testPatientRegistration(supabaseAdmin, targetTenant);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function testProfessionalRegistration(supabaseAdmin: any, tenant: any): Promise<TestResult> {
  const startTime = Date.now();
  const timestamp = Date.now();
  const testId = `test-prof-${tenant.slug}-${timestamp}`;
  
  const result: TestResult = {
    test_id: testId,
    test_type: 'professional_registration',
    tenant: tenant.slug,
    status: 'success',
    duration_ms: 0,
    created_entities: {},
    validations: [],
    errors: []
  };

  try {
    const testEmail = `test-prof-${tenant.slug}-${timestamp}@test.com`;
    const testPassword = 'TestPassword123!';
    const testName = `Dr. João Silva (Teste ${tenant.name})`;

    console.log(`[TEST] Creating professional for ${tenant.slug}: ${testEmail}`);

    // Call create-professional-profile edge function
    const { data: createResponse, error: createError } = await supabaseAdmin.functions.invoke(
      'create-professional-profile',
      {
        body: {
          profileData: {
            nome: testName,
            email: testEmail,
            cpf: '123.456.789-00',
            data_nascimento: '1985-05-15',
            genero: 'masculino',
            tipo_usuario: 'profissional'
          },
          professionalData: {
            crp_crm: '01/12345',
            profissao: 'Psicólogo',
            resumo_profissional: 'Profissional de teste para validação do sistema',
            servicos_normalizados: ['Ansiedade', 'Depressão'],
            telefone: '(11) 99999-9999',
            preco_consulta: 150,
            tempo_consulta: 50
          },
          horariosData: [],
          userId: null,
          password: testPassword,
          tenantSlug: tenant.slug
        }
      }
    );

    if (createError) {
      throw new Error(`Erro ao criar profissional: ${createError.message}`);
    }

    const userId = createResponse?.userId;
    const profileId = createResponse?.profileId;
    const professionalId = createResponse?.professionalId;

    result.created_entities = { user_id: userId, profile_id: profileId, professional_id: professionalId };

    console.log(`[TEST] Professional created: user_id=${userId}, profile_id=${profileId}, professional_id=${professionalId}`);

    // Validation 1: Profile created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    result.validations.push({
      check: 'profile_created',
      passed: !profileError && profile !== null,
      details: profileError ? profileError.message : 'Profile criado com sucesso'
    });

    if (profileError || !profile) {
      result.errors.push(`Profile não encontrado: ${profileError?.message}`);
      result.status = 'failed';
      return result;
    }

    // Validation 2: tipo_usuario is 'profissional'
    result.validations.push({
      check: 'tipo_usuario_correct',
      passed: profile.tipo_usuario === 'profissional',
      details: `tipo_usuario = ${profile.tipo_usuario}`
    });

    // Validation 3: tenant_id is correct
    result.validations.push({
      check: 'tenant_id_correct',
      passed: profile.tenant_id === tenant.id,
      details: `tenant_id = ${profile.tenant_id}, expected = ${tenant.id}`
    });

    // Validation 4: Professional record created
    const { data: professional, error: professionalError } = await supabaseAdmin
      .from('profissionais')
      .select('*')
      .eq('id', professionalId)
      .single();

    result.validations.push({
      check: 'professional_created',
      passed: !professionalError && professional !== null,
      details: professionalError ? professionalError.message : 'Profissional criado com sucesso'
    });

    if (professional) {
      // Validation 5: ativo is true
      result.validations.push({
        check: 'professional_active',
        passed: professional.ativo === true,
        details: `ativo = ${professional.ativo}`
      });

      // Validation 6: tempo_consulta is 50
      result.validations.push({
        check: 'tempo_consulta_correct',
        passed: professional.tempo_consulta === 50,
        details: `tempo_consulta = ${professional.tempo_consulta}`
      });

      // Validation 7: preco_consulta is set
      result.validations.push({
        check: 'preco_consulta_set',
        passed: professional.preco_consulta !== null && professional.preco_consulta > 0,
        details: `preco_consulta = ${professional.preco_consulta}`
      });
    }

    // Validation 8: Professional-tenant association
    const { data: profTenant, error: profTenantError } = await supabaseAdmin
      .from('professional_tenants')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('tenant_id', tenant.id)
      .single();

    result.validations.push({
      check: 'tenant_association',
      passed: !profTenantError && profTenant !== null,
      details: profTenantError ? profTenantError.message : 'Associação com tenant criada'
    });

    if (profTenant) {
      result.created_entities!.tenant_association_id = profTenant.id;
    }

    // Check if all validations passed
    const allPassed = result.validations.every(v => v.passed);
    result.status = allPassed ? 'success' : 'failed';

  } catch (error: any) {
    result.errors.push(error.message);
    result.status = 'failed';
    console.error('[TEST] Error:', error);
  }

  result.duration_ms = Date.now() - startTime;
  return result;
}

async function testPatientRegistration(supabaseAdmin: any, tenant: any): Promise<TestResult> {
  const startTime = Date.now();
  const timestamp = Date.now();
  const testId = `test-pac-${tenant.slug}-${timestamp}`;
  
  const result: TestResult = {
    test_id: testId,
    test_type: 'patient_registration',
    tenant: tenant.slug,
    status: 'success',
    duration_ms: 0,
    created_entities: {},
    validations: [],
    errors: []
  };

  try {
    const testEmail = `test-pac-${tenant.slug}-${timestamp}@test.com`;
    const testPassword = 'TestPassword123!';
    const testName = `Carlos Oliveira (Teste ${tenant.name})`;

    console.log(`[TEST] Creating patient for ${tenant.slug}: ${testEmail}`);

    // Call create-patient-profile edge function
    const { data: createResponse, error: createError } = await supabaseAdmin.functions.invoke(
      'create-patient-profile',
      {
        body: {
          nome: testName,
          email: testEmail,
          cpf: '987.654.321-00',
          dataNascimento: '1990-08-20',
          genero: 'masculino',
          password: testPassword,
          ehEstudante: false,
          tenantSlug: tenant.slug
        }
      }
    );

    if (createError) {
      throw new Error(`Erro ao criar paciente: ${createError.message}`);
    }

    const userId = createResponse?.userId;
    const profileId = createResponse?.profileId;
    const patientId = createResponse?.patientId;

    result.created_entities = { user_id: userId, profile_id: profileId, patient_id: patientId };

    console.log(`[TEST] Patient created: user_id=${userId}, profile_id=${profileId}, patient_id=${patientId}`);

    // Validation 1: Profile created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    result.validations.push({
      check: 'profile_created',
      passed: !profileError && profile !== null,
      details: profileError ? profileError.message : 'Profile criado com sucesso'
    });

    if (profileError || !profile) {
      result.errors.push(`Profile não encontrado: ${profileError?.message}`);
      result.status = 'failed';
      return result;
    }

    // Validation 2: tipo_usuario is 'paciente'
    result.validations.push({
      check: 'tipo_usuario_correct',
      passed: profile.tipo_usuario === 'paciente',
      details: `tipo_usuario = ${profile.tipo_usuario}`
    });

    // Validation 3: tenant_id is correct
    result.validations.push({
      check: 'tenant_id_correct',
      passed: profile.tenant_id === tenant.id,
      details: `tenant_id = ${profile.tenant_id}, expected = ${tenant.id}`
    });

    // Validation 4: Patient record created
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('pacientes')
      .select('*')
      .eq('id', patientId)
      .single();

    result.validations.push({
      check: 'patient_created',
      passed: !patientError && patient !== null,
      details: patientError ? patientError.message : 'Paciente criado com sucesso'
    });

    if (patient) {
      // Validation 5: tenant_id matches
      result.validations.push({
        check: 'patient_tenant_id_correct',
        passed: patient.tenant_id === tenant.id,
        details: `patient.tenant_id = ${patient.tenant_id}`
      });

      // Validation 6: profile_id matches
      result.validations.push({
        check: 'patient_profile_id_correct',
        passed: patient.profile_id === profileId,
        details: `patient.profile_id = ${patient.profile_id}`
      });
    }

    // Check if all validations passed
    const allPassed = result.validations.every(v => v.passed);
    result.status = allPassed ? 'success' : 'failed';

  } catch (error: any) {
    result.errors.push(error.message);
    result.status = 'failed';
    console.error('[TEST] Error:', error);
  }

  result.duration_ms = Date.now() - startTime;
  return result;
}

async function cleanupTestData(supabaseAdmin: any, userIds: string[]): Promise<any> {
  const results = {
    success: [] as string[],
    failed: [] as { user_id: string; error: string }[]
  };

  for (const userId of userIds) {
    try {
      console.log(`[CLEANUP] Deleting user ${userId}`);
      
      // Delete from auth.users (cascades to profiles, profissionais, pacientes)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (error) {
        results.failed.push({ user_id: userId, error: error.message });
      } else {
        results.success.push(userId);
      }
    } catch (error: any) {
      results.failed.push({ user_id: userId, error: error.message });
    }
  }

  return results;
}
