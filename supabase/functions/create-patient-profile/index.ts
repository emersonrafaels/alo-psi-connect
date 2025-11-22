import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper para gerar email HTML dinâmico baseado no tenant
function generateConfirmationEmailHTML(
  tenantName: string,
  tenantColor: string,
  tenantLogo: string | null,
  recipientName: string,
  confirmationUrl: string,
  isProfessional: boolean = false
): string {
  const primaryColor = tenantColor.startsWith('#') ? tenantColor : `hsl(${tenantColor})`;
  const welcomeTitle = isProfessional ? '🎉 Bem-vindo à nossa equipe!' : `Bem-vindo ao ${tenantName}!`;
  const welcomeMessage = isProfessional
    ? `Obrigado por se cadastrar como profissional! Sua conta foi criada com sucesso em nossa plataforma. Estamos muito felizes em tê-lo(a) conosco!`
    : `Obrigado por se cadastrar! Para ativar sua conta, confirme seu email clicando no botão abaixo:`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu email - ${tenantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 40px 20px; text-align: center;">
            ${tenantLogo 
              ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;" />` 
              : `<h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${tenantName}</h1>`
            }
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Conectando você ao cuidado mental</p>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: ${primaryColor}; margin: 0 0 20px 0; font-size: 24px;">${welcomeTitle}</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">Olá, <strong>${recipientName}</strong>!</p>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">${welcomeMessage}</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid ${primaryColor};">
              <p style="margin: 0; font-size: 16px; color: #4b5563;">Para começar a utilizar todos os recursos da plataforma, confirme seu email clicando no botão abaixo:</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">✅ Confirmar Email</a>
            </div>
            <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #a16207;"><strong>⏰ Importante:</strong> Este link expira em 24 horas por segurança.</p>
            </div>
            <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">Se você não solicitou este cadastro, pode ignorar este email com segurança.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #6b7280; margin: 0; font-size: 13px;">Enviado com 💙 pela equipe do <strong>${tenantName}</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
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
      raca,
      sexualidade,
      cpf,
      comoConheceu,
      ehEstudante,
      instituicaoEnsino,
      telefone,
      existingUserId,
      tenantSlug: requestTenantSlug
    } = await req.json();

    console.log('Creating patient profile for:', email);

    // Detect tenant from multiple sources
    const origin = req.headers.get('origin') || '';
    const referer = req.headers.get('referer') || '';

    console.log('🔍 Tenant Detection:', { 
      origin, 
      referer, 
      requestTenantSlug,
      method: 'create-patient-profile'
    });

    // Priority: 1. Explicit tenantSlug from request, 2. Referer, 3. Origin, 4. Default
    const tenantSlug = requestTenantSlug || 
      (referer.includes('/medcos') ? 'medcos' : 
       (origin.includes('/medcos') ? 'medcos' : 'alopsi'));

    console.log('✅ Using tenant:', tenantSlug);

    // Get tenant data
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, primary_color')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenantData) {
      console.error('Tenant not found:', tenantSlug);
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tenantId = tenantData.id;

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
          raca: raca || null,
          sexualidade: sexualidade || null,
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
          raca: raca || null,
          sexualidade: sexualidade || null,
          cpf,
          como_conheceu: comoConheceu,
          tipo_usuario: 'paciente',
          tenant_id: tenantId
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
          instituicao_ensino: ehEstudante ? instituicaoEnsino : null,
          tenant_id: tenantId
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

    // Create institution link if student and institution provided
    if (ehEstudante && instituicaoEnsino) {
      console.log('Creating institution link for student:', patientData.id, instituicaoEnsino);
      
      // Check if link already exists
      const { data: existingLink } = await supabase
        .from('patient_institutions')
        .select('id')
        .eq('patient_id', patientData.id)
        .eq('institution_id', instituicaoEnsino)
        .maybeSingle();

      if (!existingLink) {
        // Create new institution link
        const { error: linkError } = await supabase
          .from('patient_institutions')
          .insert({
            patient_id: patientData.id,
            institution_id: instituicaoEnsino,
            enrollment_status: 'enrolled',
            enrollment_date: new Date().toISOString()
          });

        if (linkError) {
          console.error('Error creating institution link:', linkError);
        } else {
          console.log('Institution link created successfully');
        }
      } else {
        console.log('Institution link already exists');
      }
    }

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
            const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br';
            const tenantPath = tenantSlug === 'medcos' ? '/medcos' : '';
            const confirmationUrl = `${baseUrl}${tenantPath}/auth?confirm=true&token=${confirmationToken}`;

            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: `${tenantData.name} <noreply@alopsi.com.br>`,
                to: [email],
                subject: `Confirme seu email - ${tenantData.name}`,
                html: generateConfirmationEmailHTML(
                  tenantData.name,
                  tenantData.primary_color,
                  tenantData.logo_url,
                  nome,
                  confirmationUrl,
                  false
                )
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
        userId: userId,
        profileId: profileData.id,
        patientId: patientData.id,
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