import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { 
      sourceProfessionalId, 
      targetProfessionalId,
      sourceProfileId,
      targetProfileId,
      photoUrl 
    } = await req.json();

    // Validação de dados
    if (!sourceProfessionalId || !targetProfessionalId || !sourceProfileId || !targetProfileId) {
      throw new Error('Parâmetros obrigatórios ausentes');
    }

    console.log('[Consolidation] Starting consolidation process...');
    console.log(`[Consolidation] Source: Professional ${sourceProfessionalId}, Profile ${sourceProfileId}`);
    console.log(`[Consolidation] Target: Professional ${targetProfessionalId}, Profile ${targetProfileId}`);

    // 1. Buscar dados completos de ambos os perfis para merge inteligente
    const { data: sourceProf, error: sourceProfError } = await supabaseClient
      .from('profissionais')
      .select('*')
      .eq('id', sourceProfessionalId)
      .single();

    if (sourceProfError) {
      throw new Error(`Erro ao buscar profissional origem: ${sourceProfError.message}`);
    }

    const { data: targetProf, error: targetProfError } = await supabaseClient
      .from('profissionais')
      .select('*')
      .eq('id', targetProfessionalId)
      .single();

    if (targetProfError) {
      throw new Error(`Erro ao buscar profissional destino: ${targetProfError.message}`);
    }

    console.log('[Consolidation] Professional data fetched');

    // 2. Merge inteligente: transferir campos se target não tem mas source tem
    const updateData: any = {};
    
    // Foto: priorizar photoUrl passado, senão pegar do source se target não tem
    if (photoUrl) {
      updateData.foto_perfil_url = photoUrl;
    } else if (sourceProf.foto_perfil_url && !targetProf.foto_perfil_url) {
      updateData.foto_perfil_url = sourceProf.foto_perfil_url;
    }

    // Email secundário
    if (sourceProf.email_secundario && !targetProf.email_secundario) {
      updateData.email_secundario = sourceProf.email_secundario;
    }

    // Telefone
    if (sourceProf.telefone && !targetProf.telefone) {
      updateData.telefone = sourceProf.telefone;
    }

    // Resumo profissional
    if (sourceProf.resumo_profissional_html && !targetProf.resumo_profissional_html) {
      updateData.resumo_profissional_html = sourceProf.resumo_profissional_html;
    }

    // LinkedIn
    if (sourceProf.linkedin && !targetProf.linkedin) {
      updateData.linkedin = sourceProf.linkedin;
    }

    // Atualizar target professional com merge
    if (Object.keys(updateData).length > 0) {
      const { error: updateProfError } = await supabaseClient
        .from('profissionais')
        .update(updateData)
        .eq('id', targetProfessionalId);

      if (updateProfError) {
        throw new Error(`Erro ao atualizar profissional destino: ${updateProfError.message}`);
      }

      console.log('[Consolidation] Target professional updated with merged data:', Object.keys(updateData));
    }

    // 3. Atualizar foto no profile target se necessário
    if (updateData.foto_perfil_url) {
      const { error: updateProfileError } = await supabaseClient
        .from('profiles')
        .update({ foto_perfil_url: updateData.foto_perfil_url })
        .eq('id', targetProfileId);

      if (updateProfileError) {
        throw new Error(`Erro ao atualizar foto do perfil: ${updateProfileError.message}`);
      }

      console.log('[Consolidation] Profile photo updated');
    }

    // 4. Buscar dados do profile source para auditoria
    const { data: sourceProfileData, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', sourceProfileId)
      .single();

    if (fetchError) {
      throw new Error(`Erro ao buscar perfil origem: ${fetchError.message}`);
    }

    // 5. Criar registro de auditoria detalhado
    const auditData = {
      source_professional: sourceProf,
      source_profile: sourceProfileData,
      target_professional_id: targetProfessionalId,
      target_profile_id: targetProfileId,
      merged_fields: Object.keys(updateData),
      consolidation_timestamp: new Date().toISOString()
    };

    const { error: auditError } = await supabaseClient
      .from('deleted_users')
      .insert({
        original_user_id: sourceProfileData.user_id || '00000000-0000-0000-0000-000000000000',
        email: sourceProfileData.email,
        nome: sourceProfileData.nome,
        tipo_usuario: sourceProfileData.tipo_usuario,
        deletion_reason: `Perfil duplicado consolidado no ID ${targetProfessionalId}. Campos mesclados: ${Object.keys(updateData).join(', ') || 'nenhum'}`,
        deleted_by: null,
        user_data: auditData
      });

    if (auditError) {
      throw new Error(`Erro ao criar registro de auditoria: ${auditError.message}`);
    }

    console.log('[Consolidation] Audit record created with merge details');

    // 6. Deletar registros em professional_tenants
    const { error: deleteTenantsError } = await supabaseClient
      .from('professional_tenants')
      .delete()
      .eq('professional_id', sourceProfessionalId);

    if (deleteTenantsError) {
      throw new Error(`Erro ao deletar professional_tenants: ${deleteTenantsError.message}`);
    }

    console.log('[Consolidation] Professional tenants deleted');

    // 7. Deletar registro em profissionais
    const { error: deleteProfError } = await supabaseClient
      .from('profissionais')
      .delete()
      .eq('id', sourceProfessionalId);

    if (deleteProfError) {
      throw new Error(`Erro ao deletar profissional: ${deleteProfError.message}`);
    }

    console.log('[Consolidation] Professional record deleted');

    // 8. Deletar registro em profiles
    const { error: deleteProfileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', sourceProfileId);

    if (deleteProfileError) {
      throw new Error(`Erro ao deletar perfil: ${deleteProfileError.message}`);
    }

    console.log('[Consolidation] Profile deleted');
    console.log('[Consolidation] Consolidation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Perfil ${sourceProfessionalId} consolidado em ${targetProfessionalId} com sucesso`,
        merged_fields: Object.keys(updateData)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[Consolidation] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
