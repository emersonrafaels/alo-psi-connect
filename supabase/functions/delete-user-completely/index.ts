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

    // Check if user is super admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !userRoles?.some(r => r.role === 'super_admin')) {
      console.error('Permission denied. User roles:', userRoles);
      return new Response(
        JSON.stringify({ error: 'Permission denied. Only super admins can delete users.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { userId, deletionReason } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Starting deletion process for user: ${userId}`);

    // 1. Get user profile data for audit
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

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
    const { error: auditError } = await supabase
      .from('deleted_users')
      .insert({
        original_user_id: userId,
        email: profile.email,
        nome: profile.nome,
        tipo_usuario: profile.tipo_usuario,
        deleted_by: user.id,
        deletion_reason: deletionReason || 'No reason provided',
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

    // Delete AI insights history (has foreign key to auth.users)
    console.log('Deleting AI insights history...');
    await supabase.from('ai_insights_history').delete().eq('user_id', userId);
    
    // Delete AI insights usage
    console.log('Deleting AI insights usage...');
    await supabase.from('ai_insights_usage').delete().eq('user_id', userId);

    // Delete booking tracking
    console.log('Deleting booking tracking...');
    await supabase.from('user_booking_tracking').delete().eq('user_id', userId);
    
    // Delete comments
    console.log('Deleting comments...');
    await supabase.from('comments').delete().eq('user_id', userId);
    
    // Cancel appointments (don't delete for history)
    await supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('user_id', userId);
    
    // Delete patient info
    const { data: patientData } = await supabase
      .from('pacientes')
      .select('id')
      .eq('profile_id', profile.id);
    
    if (patientData?.length) {
      await supabase.from('pacientes').delete().eq('profile_id', profile.id);
    }
    
    // Delete professional info and sessions
    const { data: professionalData } = await supabase
      .from('profissionais')
      .select('user_id')
      .eq('profile_id', profile.id);
    
    if (professionalData?.length) {
      const professionalUserId = professionalData[0].user_id;
      await supabase.from('profissionais_sessoes').delete().eq('user_id', professionalUserId);
      await supabase.from('profissionais').delete().eq('profile_id', profile.id);
    }
    
    // Delete user roles
    await supabase.from('user_roles').delete().eq('user_id', userId);
    
    // Delete password reset tokens
    await supabase.from('password_reset_tokens').delete().eq('user_id', userId);
    
    // Delete agendamento tokens
    await supabase.from('agendamento_tokens').delete().eq('email', profile.email);

    // 4. Delete profile
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
      return new Response(
        JSON.stringify({ error: 'Error deleting user profile' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 5. Delete from auth.users using admin client
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return new Response(
        JSON.stringify({ error: 'Error deleting user from authentication system' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`User ${userId} deleted successfully`);

    // Ensure we return properly formatted user data
    const formattedUserData = {
      id: userId,
      nome: profile.nome || null,
      email: profile.email || null,
      tipo_usuario: profile.tipo_usuario || 'unknown',
      deletedAt: new Date().toISOString()
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