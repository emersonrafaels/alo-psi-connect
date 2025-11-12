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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { sourceProfessionalId, targetProfessionalId, sourceProfileId, targetProfileId, photoUrl } = await req.json();

    console.log('Starting consolidation:', {
      sourceProfessionalId,
      targetProfessionalId,
      sourceProfileId,
      targetProfileId,
      photoUrl
    });

    // Step 1: Transfer photo to target professional
    const { error: profPhotoError } = await supabaseAdmin
      .from('profissionais')
      .update({ foto_perfil_url: photoUrl })
      .eq('id', targetProfessionalId);

    if (profPhotoError) {
      throw new Error(`Failed to update professional photo: ${profPhotoError.message}`);
    }

    console.log('Updated professional photo');

    // Step 2: Transfer photo to target profile
    const { error: profilePhotoError } = await supabaseAdmin
      .from('profiles')
      .update({ foto_perfil_url: photoUrl })
      .eq('id', targetProfileId);

    if (profilePhotoError) {
      throw new Error(`Failed to update profile photo: ${profilePhotoError.message}`);
    }

    console.log('Updated profile photo');

    // Step 3: Delete source profile data
    // First, get profile data for audit
    const { data: profileData, error: getProfileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', sourceProfileId)
      .single();

    if (getProfileError) {
      throw new Error(`Failed to fetch source profile: ${getProfileError.message}`);
    }

    // Insert into deleted_users for audit
    const { error: auditError } = await supabaseAdmin
      .from('deleted_users')
      .insert({
        original_user_id: profileData.user_id || '00000000-0000-0000-0000-000000000000',
        nome: profileData.nome || 'Unknown',
        email: profileData.email || 'unknown@email.com',
        tipo_usuario: profileData.tipo_usuario || 'profissional',
        deletion_reason: `Perfil duplicado consolidado no professional_id ${targetProfessionalId}`,
        user_data: profileData,
        deleted_by: null
      });

    if (auditError) {
      console.error('Failed to create audit record:', auditError);
    }

    console.log('Created audit record');

    // Step 4: Delete professional_tenants
    const { error: tenantsError } = await supabaseAdmin
      .from('professional_tenants')
      .delete()
      .eq('professional_id', sourceProfessionalId);

    if (tenantsError) {
      throw new Error(`Failed to delete professional_tenants: ${tenantsError.message}`);
    }

    console.log('Deleted professional_tenants records');

    // Step 5: Delete profissionais record
    const { error: profError } = await supabaseAdmin
      .from('profissionais')
      .delete()
      .eq('id', sourceProfessionalId);

    if (profError) {
      throw new Error(`Failed to delete profissionais record: ${profError.message}`);
    }

    console.log('Deleted profissionais record');

    // Step 6: Delete profiles record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', sourceProfileId);

    if (profileError) {
      throw new Error(`Failed to delete profiles record: ${profileError.message}`);
    }

    console.log('Deleted profiles record');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Professional profiles consolidated successfully',
        consolidatedInto: targetProfessionalId,
        deletedProfile: sourceProfessionalId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error consolidating profiles:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
