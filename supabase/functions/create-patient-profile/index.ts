import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { 
      nome, 
      email, 
      password, 
      dataNascimento, 
      genero, 
      cpf,
      comoConheceu,
      ehEstudante,
      instituicaoEnsino,
      telefone,
      existingUserId
    } = await req.json();

    console.log('Creating patient profile for:', email);

    let userId;

    // If existing user ID is provided (Google users), use it
    if (existingUserId) {
      userId = existingUserId;
      console.log('Using existing user ID:', userId);
    } else {
      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      
      if (existingUser?.user) {
        console.log('User already exists, using existing user ID:', existingUser.user.id);
        userId = existingUser.user.id;
      } else {
        // Create user account for email/password users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: false, // Auto-confirm email for direct registration
        });

        if (authError || !authData.user) {
          console.error('Error creating user:', authError);
          return new Response(
            JSON.stringify({ error: 'Failed to create user account', details: authError?.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        userId = authData.user.id;
        console.log('User created with ID:', userId);
      }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let profileData;
    
    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return new Response(
        JSON.stringify({ error: 'User already registered', details: 'Este email já está cadastrado. Tente fazer login.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Create profile
      const { data: newProfileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          nome,
          email,
          data_nascimento: dataNascimento,
          genero,
          cpf,
          como_conheceu: comoConheceu,
          tipo_usuario: 'paciente'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Failed to create profile', details: profileError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      profileData = newProfileData;
    }

    console.log('Profile created:', profileData);

    // Create patient record
    const { data: patientData, error: patientError } = await supabase
      .from('pacientes')
      .insert({
        profile_id: profileData.id,
        eh_estudante: ehEstudante,
        instituicao_ensino: ehEstudante ? instituicaoEnsino : null
      })
      .select()
      .single();

    if (patientError) {
      console.error('Error creating patient record:', patientError);
      // Clean up user and profile if patient creation fails
      await supabase.from('profiles').delete().eq('id', profileData.id);
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Failed to create patient record', details: patientError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Patient record created:', patientData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profileData,
        patient: patientData,
        user: { id: userId, email }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});