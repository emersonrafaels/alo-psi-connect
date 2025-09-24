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
    let isNewUser = false; // Track if we're creating a new user

    // If existing user ID is provided (Google users), use it
    if (existingUserId) {
      userId = existingUserId;
      isNewUser = false; // Google users don't need email confirmation
      console.log('Using existing user ID (Google):', userId);
    } else {
      // Check if user already exists by querying profiles table instead
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (existingProfile?.user_id) {
        console.log('User already exists, using existing user ID:', existingProfile.user_id);
        userId = existingProfile.user_id;
        isNewUser = false; // Existing user
      } else {
        // Create user account for email/password users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: false, // Don't auto-confirm - we'll send our own email
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
        isNewUser = true; // New user created, needs confirmation
        console.log('New user created with ID:', userId);
      }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    let profileData;
    
    if (existingProfile) {
      console.log('Profile already exists, updating:', existingProfile.id);
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          nome,
          email,
          data_nascimento: dataNascimento,
          genero,
          cpf,
          como_conheceu: comoConheceu,
          tipo_usuario: 'paciente'
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      profileData = updatedProfile;
    } else {
      // Create new profile
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

    console.log('Profile processed successfully:', profileData.id);

    // Check if patient already exists
    const { data: existingPatient } = await supabase
      .from('pacientes')
      .select('*')
      .eq('profile_id', profileData.id)
      .maybeSingle();

    let patientData;
    
    if (existingPatient) {
      console.log('Patient already exists, updating:', existingPatient.id);
      // Update existing patient
      const { data: updatedPatient, error: updateError } = await supabase
        .from('pacientes')
        .update({
          eh_estudante: ehEstudante,
          instituicao_ensino: ehEstudante ? instituicaoEnsino : null
        })
        .eq('profile_id', profileData.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating patient record:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update patient record', details: updateError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      patientData = updatedPatient;
    } else {
      // Create patient record
      const { data: newPatientData, error: patientError } = await supabase
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
        return new Response(
          JSON.stringify({ error: 'Failed to create patient record', details: patientError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      patientData = newPatientData;
    }

    console.log('Patient record processed successfully:', patientData.id);

    // Send confirmation email if user was created in this session
    let confirmationEmailSent = false;
    if (isNewUser && !existingUserId) { // Only for new email/password users, not Google users
      try {
        console.log('Sending confirmation email for new user:', email);
        
        // Generate confirmation token
        const confirmationToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

        // Invalidate any existing tokens for this user first
        await supabase
          .from('email_confirmation_tokens')
          .update({ used: true })
          .eq('user_id', userId)
          .eq('used', false);

        // Save new token to database
        const { error: tokenError } = await supabase
          .from('email_confirmation_tokens')
          .insert({
            user_id: userId,
            email: email,
            token: confirmationToken,
            expires_at: expiresAt.toISOString(),
            used: false
          });

        if (tokenError) {
          console.error('Error saving confirmation token:', tokenError);
        } else {
          // Send email using Resend
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey) {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Alô, Psi! <noreply@alopsi.com.br>',
                to: [email],
                subject: 'Confirme seu email - Alô, Psi!',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333; text-align: center;">Bem-vindo ao Alô, Psi!</h1>
                    <p style="color: #666; font-size: 16px;">Olá ${nome},</p>
                    <p style="color: #666; font-size: 16px;">
                      Obrigado por se cadastrar! Para ativar sua conta, clique no link abaixo:
                    </p>
                     <div style="text-align: center; margin: 30px 0;">
                       <a href="${Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br'}/auth?confirm=true&token=${confirmationToken}" 
                          style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                         Confirmar Email
                       </a>
                     </div>
                    <p style="color: #666; font-size: 14px;">
                      Este link expira em 24 horas.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                      Se você não solicitou este cadastro, pode ignorar este email.
                    </p>
                  </div>
                `
              }),
            });

            if (emailResponse.ok) {
              confirmationEmailSent = true;
              console.log('Confirmation email sent successfully');
            } else {
              console.error('Failed to send confirmation email:', await emailResponse.text());
            }
          } else {
            console.error('RESEND_API_KEY not found');
          }
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profileData,
        patient: patientData,
        user: { id: userId, email },
        confirmationEmailSent,
        isNewUser
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});