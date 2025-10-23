import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CatalogueRequest {
  action: 'catalogue';
  custom_name: string;
  official_data: {
    name: string;
    type: 'public' | 'private';
    has_partnership: boolean;
    is_active: boolean;
  };
}

interface LinkRequest {
  action: 'link';
  custom_name: string;
  target_institution_id: string;
}

type NormalizeRequest = CatalogueRequest | LinkRequest;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autorizado');
    }

    // Verificar permissões de admin
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      throw rolesError;
    }

    const isAdmin = userRoles?.some(
      (r: any) => r.role === 'admin' || r.role === 'super_admin'
    );

    if (!isAdmin) {
      throw new Error('Permissão negada. Apenas administradores podem normalizar instituições.');
    }

    const body: NormalizeRequest = await req.json();
    console.log('[normalize-institutions] Request:', JSON.stringify(body));

    let updatedCount = 0;
    let officialName = '';

    if (body.action === 'catalogue') {
      // 1. Criar nova instituição na tabela educational_institutions
      const { data: newInstitution, error: createError } = await supabaseClient
        .from('educational_institutions')
        .insert({
          name: body.official_data.name,
          type: body.official_data.type,
          has_partnership: body.official_data.has_partnership,
          is_active: body.official_data.is_active,
        })
        .select()
        .single();

      if (createError) {
        console.error('[normalize-institutions] Error creating institution:', createError);
        throw createError;
      }

      console.log('[normalize-institutions] Created institution:', newInstitution);
      officialName = body.official_data.name;

      // 2. Atualizar pacientes com o nome oficial
      const { data: updatedPatients, error: updateError } = await supabaseClient
        .from('pacientes')
        .update({ instituicao_ensino: officialName })
        .ilike('instituicao_ensino', body.custom_name.trim())
        .select();

      if (updateError) {
        console.error('[normalize-institutions] Error updating patients:', updateError);
        throw updateError;
      }

      updatedCount = updatedPatients?.length || 0;
      console.log(`[normalize-institutions] Updated ${updatedCount} patients`);

    } else if (body.action === 'link') {
      // 1. Buscar nome oficial da instituição target
      const { data: targetInstitution, error: fetchError } = await supabaseClient
        .from('educational_institutions')
        .select('name')
        .eq('id', body.target_institution_id)
        .single();

      if (fetchError || !targetInstitution) {
        throw new Error('Instituição target não encontrada');
      }

      officialName = targetInstitution.name;
      console.log('[normalize-institutions] Target institution name:', officialName);

      // 2. Atualizar pacientes com o nome oficial
      const { data: updatedPatients, error: updateError } = await supabaseClient
        .from('pacientes')
        .update({ instituicao_ensino: officialName })
        .ilike('instituicao_ensino', body.custom_name.trim())
        .select();

      if (updateError) {
        console.error('[normalize-institutions] Error updating patients:', updateError);
        throw updateError;
      }

      updatedCount = updatedPatients?.length || 0;
      console.log(`[normalize-institutions] Linked ${updatedCount} patients`);
    } else {
      throw new Error('Ação inválida');
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: body.action,
        updated_count: updatedCount,
        official_name: officialName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[normalize-institutions] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
