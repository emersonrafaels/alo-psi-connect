import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is admin or super_admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = userRoles?.some(r => r.role === 'super_admin' || r.role === 'admin');
    
    if (roleError || !hasPermission) {
      console.error('Permission denied. User roles:', userRoles);
      return new Response(
        JSON.stringify({ error: 'Permission denied. Only admins can cleanup orphan profiles.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { emailPattern } = await req.json();

    if (!emailPattern) {
      return new Response(
        JSON.stringify({ error: 'Email pattern is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[Cleanup] Finding orphan profiles with pattern: ${emailPattern}`);

    // Find orphan profiles (profiles without user_id)
    const { data: orphanProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, nome, tipo_usuario')
      .is('user_id', null)
      .like('email', emailPattern);

    if (fetchError) {
      console.error('Error fetching orphan profiles:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orphan profiles', details: fetchError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!orphanProfiles || orphanProfiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No orphan profiles found',
          deletedCount: 0,
          deletedProfiles: []
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`[Cleanup] Found ${orphanProfiles.length} orphan profiles to delete`);

    const deletedProfiles = [];
    const errors = [];

    // Delete each orphan profile and related data
    for (const profile of orphanProfiles) {
      try {
        console.log(`[Cleanup] Deleting orphan profile: ${profile.email} (${profile.id})`);

        // Delete related data in order
        // 1. Delete mood_factors (linked to mood_entries)
        const { data: moodEntries } = await supabase
          .from('mood_entries')
          .select('id')
          .eq('profile_id', profile.id);

        if (moodEntries && moodEntries.length > 0) {
          const moodEntryIds = moodEntries.map(e => e.id);
          await supabase.from('mood_factors').delete().in('mood_entry_id', moodEntryIds);
          console.log(`[Cleanup] Deleted mood_factors for profile ${profile.email}`);
        }

        // 2. Delete mood_entries
        await supabase.from('mood_entries').delete().eq('profile_id', profile.id);
        console.log(`[Cleanup] Deleted mood_entries for profile ${profile.email}`);

        // 3. Delete emotion_configurations
        await supabase.from('emotion_configurations').delete().eq('user_id', profile.id);
        console.log(`[Cleanup] Deleted emotion_configurations for profile ${profile.email}`);

        // 4. Delete comments (if user_id is set to profile.id in some cases)
        await supabase.from('comments').delete().eq('user_id', profile.id);
        console.log(`[Cleanup] Deleted comments for profile ${profile.email}`);

        // 5. Delete from profissionais if tipo_usuario is 'profissional'
        if (profile.tipo_usuario === 'profissional') {
          // First get the professional record
          const { data: professional } = await supabase
            .from('profissionais')
            .select('id')
            .eq('profile_id', profile.id)
            .maybeSingle();

          if (professional) {
            // Delete professional_tenants
            await supabase.from('professional_tenants').delete().eq('professional_id', professional.id);
            console.log(`[Cleanup] Deleted professional_tenants for ${profile.email}`);

            // Delete professional_unavailability
            await supabase.from('professional_unavailability').delete().eq('professional_id', professional.id);
            console.log(`[Cleanup] Deleted professional_unavailability for ${profile.email}`);

            // Delete profissionais_sessoes
            await supabase.from('profissionais_sessoes').delete().eq('user_id', professional.id);
            console.log(`[Cleanup] Deleted profissionais_sessoes for ${profile.email}`);

            // Delete the professional record
            await supabase.from('profissionais').delete().eq('profile_id', profile.id);
            console.log(`[Cleanup] Deleted profissionais record for ${profile.email}`);
          }
        }

        // 6. Delete from pacientes if tipo_usuario is 'paciente'
        if (profile.tipo_usuario === 'paciente') {
          await supabase.from('pacientes').delete().eq('profile_id', profile.id);
          console.log(`[Cleanup] Deleted pacientes record for ${profile.email}`);
        }

        // 7. Finally, delete the profile itself
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (deleteError) {
          throw deleteError;
        }

        console.log(`[Cleanup] Successfully deleted orphan profile: ${profile.email}`);
        deletedProfiles.push(profile);

      } catch (error: any) {
        console.error(`[Cleanup] Error deleting profile ${profile.email}:`, error);
        errors.push({
          email: profile.email,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Cleanup completed. Deleted ${deletedProfiles.length} of ${orphanProfiles.length} orphan profiles`,
        deletedCount: deletedProfiles.length,
        deletedProfiles: deletedProfiles.map(p => ({ email: p.email, nome: p.nome })),
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Unexpected error in cleanup-orphan-profiles:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
