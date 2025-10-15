import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    );

    // Get current user and verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is super admin or admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = userRoles?.some(r => r.role === 'super_admin' || r.role === 'admin');
    
    if (roleError || !hasPermission) {
      console.error('Permission denied. User roles:', userRoles);
      return new Response(
        JSON.stringify({ error: 'Permission denied. Only admins can delete users.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { userId, profileId, deletionReason } = await req.json();
    
    if (!userId && !profileId) {
      return new Response(
        JSON.stringify({ error: 'User ID or Profile ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Starting deletion process - userId: ${userId || 'N/A'}, profileId: ${profileId || 'N/A'}`);

    // 1. Get user profile data for audit
    let query = supabase.from('profiles').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (profileId) {
      query = query.eq('id', profileId);
    }
    
    const { data: profile, error: profileError } = await query.maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Store deleted user data for audit
    const isOrphan = !profile.user_id;
    const { error: auditError } = await supabase
      .from('deleted_users')
      .insert({
        original_user_id: profile.user_id || '00000000-0000-0000-0000-000000000000',
        email: profile.email,
        nome: profile.nome,
        tipo_usuario: profile.tipo_usuario,
        deleted_by: user.id,
        deletion_reason: `${isOrphan ? '[ORPHAN PROFILE] ' : ''}${deletionReason || 'No reason provided'}`,
        user_data: profile
      });

    if (auditError) {
      console.error('Error creating audit record:', auditError);
      return new Response(
        JSON.stringify({ error: 'Error creating audit record' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 3. Delete related data in order (most dependent first)
    console.log('Deleting related data...');

    // Only delete auth.users-related data if user_id exists
    if (profile.user_id) {
      // Delete mood factors first (depends on mood_entries)
      console.log('Deleting mood factors...');
      const { data: moodEntryIds } = await supabaseAdmin
        .from('mood_entries')
        .select('id')
        .eq('user_id', profile.user_id);
      
      if (moodEntryIds?.length) {
        await supabaseAdmin.from('mood_factors').delete().in('mood_entry_id', moodEntryIds.map(entry => entry.id));
      }

      // Delete mood entries (has foreign key to auth.users)
      console.log('Deleting mood entries...');
      await supabaseAdmin.from('mood_entries').delete().eq('user_id', profile.user_id);

      // Delete AI insights history (has foreign key to auth.users)
      console.log('Deleting AI insights history...');
      await supabaseAdmin.from('ai_insights_history').delete().eq('user_id', profile.user_id);
      
      // Delete AI insights usage
      console.log('Deleting AI insights usage...');
      await supabaseAdmin.from('ai_insights_usage').delete().eq('user_id', profile.user_id);

      // Delete booking tracking
      console.log('Deleting booking tracking...');
      await supabaseAdmin.from('user_booking_tracking').delete().eq('user_id', profile.user_id);
      
      // Delete comments
      console.log('Deleting comments...');
      await supabaseAdmin.from('comments').delete().eq('user_id', profile.user_id);
      
      // Cancel appointments (don't delete for history)
      await supabaseAdmin
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('user_id', profile.user_id);
    } else {
      console.log('⚠️ [ORPHAN PROFILE] Skipping auth-related data deletions');
    }
    
    // Delete patient info
    const { data: patientData } = await supabaseAdmin
      .from('pacientes')
      .select('id')
      .eq('profile_id', profile.id);
    
    if (patientData?.length) {
      await supabaseAdmin.from('pacientes').delete().eq('profile_id', profile.id);
    }
    
    // Delete professional info and sessions
    const { data: professionalData } = await supabaseAdmin
      .from('profissionais')
      .select('user_id')
      .eq('profile_id', profile.id);
    
    if (professionalData?.length) {
      const professionalUserId = professionalData[0].user_id;
      await supabaseAdmin.from('profissionais_sessoes').delete().eq('user_id', professionalUserId);
      await supabaseAdmin.from('profissionais').delete().eq('profile_id', profile.id);
    }
    
    // Delete user roles (only if user_id exists)
    if (profile.user_id) {
      await supabaseAdmin.from('user_roles').delete().eq('user_id', profile.user_id);
      
      // Delete password reset tokens
      await supabaseAdmin.from('password_reset_tokens').delete().eq('user_id', profile.user_id);
    }
    
    // Delete agendamento tokens
    await supabaseAdmin.from('agendamento_tokens').delete().eq('email', profile.email);

    // 4. Delete profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profile.id);

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
      return new Response(
        JSON.stringify({ error: 'Error deleting user profile' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 5. Delete from auth.users using admin client (only if user_id exists)
    if (profile.user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
        return new Response(
          JSON.stringify({ error: 'Error deleting user from authentication system' }),
          { status: 500, headers: corsHeaders }
        );
      }
      console.log(`Auth user ${profile.user_id} deleted successfully`);
    } else {
      console.log(`⚠️ [ORPHAN PROFILE] Skipping auth.users deletion - no user_id`);
    }

    console.log(`Profile ${profile.id} deleted successfully`);

    // Ensure we return properly formatted user data
    const formattedUserData = {
      id: profile.user_id || profile.id,
      nome: profile.nome || null,
      email: profile.email || null,
      tipo_usuario: profile.tipo_usuario || 'unknown',
      deletedAt: new Date().toISOString(),
      wasOrphan: isOrphan
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted completely',
        deletedUser: formattedUserData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});