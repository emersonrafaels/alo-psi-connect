import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, nome, institutionId, institutionRole = 'viewer', tenantId } = await req.json();

    // Validações básicas
    if (!email || !password || !nome || !institutionId) {
      return new Response(
        JSON.stringify({ error: 'Email, password, nome and institutionId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Verificar se a instituição existe
    const { data: institution, error: instError } = await supabaseServiceRole
      .from('educational_institutions')
      .select('id')
      .eq('id', institutionId)
      .single();

    if (instError || !institution) {
      return new Response(
        JSON.stringify({ error: 'Institution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Criar usuário no Auth
    const { data: userData, error: authError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome }
    });

    if (authError || !userData.user) {
      throw new Error(authError?.message || 'Failed to create user');
    }

    const userId = userData.user.id;

    // 3. Criar perfil
    const { error: profileError } = await supabaseServiceRole
      .from('profiles')
      .insert({
        user_id: userId,
        nome,
        email,
        tipo_usuario: 'paciente', // Default para admin institucional
        tenant_id: tenantId
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    // 4. Adicionar role institution_admin
    const { error: roleError } = await supabaseServiceRole
      .from('user_roles')
      .insert({ user_id: userId, role: 'institution_admin' });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      throw new Error(`Role assignment failed: ${roleError.message}`);
    }

    // 5. Vincular à instituição
    const { error: institutionError } = await supabaseServiceRole
      .from('institution_users')
      .insert({
        user_id: userId,
        institution_id: institutionId,
        role: institutionRole,
        is_active: true,
        tenant_id: tenantId
      });

    if (institutionError) {
      console.error('Institution linking error:', institutionError);
      throw new Error(`Institution linking failed: ${institutionError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: userId, 
          email, 
          nome, 
          institutionRole,
          institutionId
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-institutional-user:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});