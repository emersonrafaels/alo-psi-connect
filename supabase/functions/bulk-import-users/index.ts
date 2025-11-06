import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserRow {
  nome: string;
  email: string;
  cpf?: string;
  data_nascimento?: string;
  genero?: string;
  telefone?: string;
  tipo_usuario: 'paciente' | 'profissional';
  senha?: string;
  instituicao?: string;
  crp_crm?: string;
  profissao?: string;
  preco_consulta?: number;
}

interface ImportResult {
  success: boolean;
  userId?: string;
  profileId?: string;
  email: string;
  nome: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => ['admin', 'super_admin'].includes(r.role));
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Permission denied. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { users, tenantSlug } = await req.json();
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Bulk Import] Processing ${users.length} users for tenant: ${tenantSlug}`);

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug || 'alopsi')
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: ImportResult[] = [];
    const defaultPassword = 'TrocaSenha@123';

    for (const userData of users as UserRow[]) {
      try {
        console.log(`[Bulk Import] Processing: ${userData.email}`);

        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id')
          .eq('email', userData.email)
          .maybeSingle();

        if (existingProfile) {
          results.push({
            success: false,
            email: userData.email,
            nome: userData.nome,
            error: 'Email já cadastrado'
          });
          continue;
        }

        const password = userData.senha || defaultPassword;
        const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: password,
          email_confirm: false,
          user_metadata: {
            full_name: userData.nome,
            tipo_usuario: userData.tipo_usuario
          }
        });

        if (createUserError || !authUser.user) {
          results.push({
            success: false,
            email: userData.email,
            nome: userData.nome,
            error: `Erro ao criar conta: ${createUserError?.message}`
          });
          continue;
        }

        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: authUser.user.id,
            nome: userData.nome,
            email: userData.email,
            cpf: userData.cpf || null,
            data_nascimento: userData.data_nascimento || null,
            genero: userData.genero || null,
            tipo_usuario: userData.tipo_usuario,
            tenant_id: tenant.id
          })
          .select()
          .single();

        if (profileError) {
          results.push({
            success: false,
            email: userData.email,
            nome: userData.nome,
            error: `Erro ao criar perfil: ${profileError.message}`
          });
          continue;
        }

        if (userData.tipo_usuario === 'paciente') {
          const { error: patientError } = await supabaseAdmin
            .from('pacientes')
            .insert({
              profile_id: profile.id,
              eh_estudante: false,
              tenant_id: tenant.id
            });

          if (patientError) {
            results.push({
              success: false,
              email: userData.email,
              nome: userData.nome,
              error: `Erro ao criar paciente: ${patientError.message}`
            });
            continue;
          }

          if (userData.instituicao) {
            const { data: institution } = await supabaseAdmin
              .from('educational_institutions')
              .select('id')
              .ilike('name', userData.instituicao)
              .maybeSingle();

            if (institution) {
              const { data: patient } = await supabaseAdmin
                .from('pacientes')
                .select('id')
                .eq('profile_id', profile.id)
                .single();

              if (patient) {
                await supabaseAdmin
                  .from('patient_institutions')
                  .insert({
                    patient_id: patient.id,
                    institution_id: institution.id,
                    enrollment_status: 'enrolled'
                  });
              }
            }
          }
        } else {
          const { data: professional, error: professionalError } = await supabaseAdmin
            .from('profissionais')
            .insert({
              profile_id: profile.id,
              user_email: userData.email,
              display_name: userData.nome,
              profissao: userData.profissao || 'Psicólogo(a)',
              crp_crm: userData.crp_crm || null,
              preco_consulta: userData.preco_consulta || 120,
              tempo_consulta: 50,
              ativo: false
            })
            .select()
            .single();

          if (professionalError) {
            results.push({
              success: false,
              email: userData.email,
              nome: userData.nome,
              error: `Erro ao criar profissional: ${professionalError.message}`
            });
            continue;
          }

          if (userData.instituicao && professional) {
            const { data: institution } = await supabaseAdmin
              .from('educational_institutions')
              .select('id')
              .ilike('name', userData.instituicao)
              .maybeSingle();

            if (institution) {
              await supabaseAdmin
                .from('professional_institutions')
                .insert({
                  professional_id: professional.id,
                  institution_id: institution.id,
                  relationship_type: 'employee'
                });
            }
          }
        }

        results.push({
          success: true,
          userId: authUser.user.id,
          profileId: profile.id,
          email: userData.email,
          nome: userData.nome
        });

        console.log(`[Bulk Import] ✅ Success: ${userData.email}`);

      } catch (error) {
        console.error(`[Bulk Import] ❌ Error processing ${userData.email}:`, error);
        results.push({
          success: false,
          email: userData.email,
          nome: userData.nome,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        total: users.length,
        successCount,
        errorCount,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Bulk Import] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
