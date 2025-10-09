import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { profileData, professionalData, horariosData, userId } = await req.json();

    // Detect tenant from request origin/referer
    const origin = req.headers.get('origin') || '';
    const referer = req.headers.get('referer') || '';
    const tenantSlug = (origin.includes('/medcos') || referer.includes('/medcos')) 
      ? 'medcos' 
      : 'alopsi';

    // Fetch tenant_id
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating professional profile for user:', userId);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let profile;
    if (existingProfile) {
      console.log('Profile already exists, updating:', existingProfile.id);
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          ...profileData,
          tenant_id: tenant.id
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }
      profile = updatedProfile;
    } else {
      // Create new profile
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          tenant_id: tenant.id,
          ...profileData
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }
      profile = newProfile;
    }

    console.log('Profile processed successfully:', profile.id);

    // Get the highest user_id from profissionais table to generate next integer ID
    const { data: maxUserIdData } = await supabaseAdmin
      .from('profissionais')
      .select('user_id')
      .order('user_id', { ascending: false })
      .limit(1);

    const nextUserId = maxUserIdData && maxUserIdData.length > 0 
      ? (maxUserIdData[0].user_id || 0) + 1 
      : 1;

    console.log('Using user_id for professional:', nextUserId);

    // Check if professional already exists
    const { data: existingProfessional } = await supabaseAdmin
      .from('profissionais')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    let professional;
    let finalUserId = nextUserId;
    
    if (existingProfessional) {
      console.log('Professional already exists, updating:', existingProfessional.id);
      finalUserId = existingProfessional.user_id; // Use existing user_id
      
      // Update existing professional
      const { data: updatedProfessional, error: updateError } = await supabaseAdmin
        .from('profissionais')
        .update(professionalData)
        .eq('profile_id', profile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Professional update error:', updateError);
        throw updateError;
      }
      professional = updatedProfessional;
    } else {
      // Create new professional with generated integer user_id
      const { data: newProfessional, error: professionalError } = await supabaseAdmin
        .from('profissionais')
        .insert({
          profile_id: profile.id,
          user_id: nextUserId, // Use generated integer ID
          ...professionalData
        })
        .select()
        .single();

      if (professionalError) {
        console.error('Professional creation error:', professionalError);
        throw professionalError;
      }
      professional = newProfessional;

      // Create entry in professional_tenants
      const { error: tenantLinkError } = await supabaseAdmin
        .from('professional_tenants')
        .insert({
          professional_id: newProfessional.id,
          tenant_id: tenant.id,
          is_featured: false,
        });

      if (tenantLinkError) {
        console.error('Error linking professional to tenant:', tenantLinkError);
      } else {
        console.log('Professional linked to tenant:', tenantSlug);
      }
    }

    // Sync photo between profissionais and profiles tables
    if (professional?.foto_perfil_url && professional.foto_perfil_url !== profile.foto_perfil_url) {
      console.log('Syncing photo from profissionais to profiles table');
      await supabaseAdmin
        .from('profiles')
        .update({ foto_perfil_url: professional.foto_perfil_url })
        .eq('id', profile.id);
    }

    console.log('Professional processed successfully:', professional.id);

    // Handle schedules if provided
    if (horariosData && horariosData.length > 0) {
      // First, delete existing schedules for this user
      await supabaseAdmin
        .from('profissionais_sessoes')
        .delete()
        .eq('user_id', finalUserId);

      // Map days to database constraint format (mon, tue, wed, etc.)
      const dayMapping: Record<string, string> = {
        'mon': 'mon',
        'tue': 'tue', 
        'wed': 'wed',
        'thu': 'thu',
        'fri': 'fri',
        'sat': 'sat',
        'sun': 'sun',
        // Support for legacy formats
        'monday': 'mon',
        'tuesday': 'tue',
        'wednesday': 'wed', 
        'thursday': 'thu',
        'friday': 'fri',
        'saturday': 'sat',
        'sunday': 'sun',
        'segunda': 'mon',
        'terca': 'tue',
        'quarta': 'wed', 
        'quinta': 'thu',
        'sexta': 'fri',
        'sabado': 'sat',
        'domingo': 'sun'
      };

      const horariosFormatted = horariosData.map((horario: any) => ({
        user_id: finalUserId, // Use the correct user_id
        day: dayMapping[horario.day] || horario.day, // Map to database format
        start_time: horario.startTime,
        end_time: horario.endTime
      }));

      const { error: horariosError } = await supabaseAdmin
        .from('profissionais_sessoes')
        .insert(horariosFormatted);

      if (horariosError) {
        console.error('Schedules creation error:', horariosError);
        throw horariosError;
      }

      console.log('Schedules processed successfully');
    }

    // Send confirmation email for new users (need to check if user was just created)
    let confirmationEmailSent = false;
    let isNewUser = false;
    
    try {
      // Check if this is a new user by checking if they have an unconfirmed email
      // AND if they were created very recently (within last 10 minutes)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!authError && authUser.user && !authUser.user.email_confirmed_at) {
        // Check if user was created recently (indicates new registration)
        const userCreatedAt = new Date(authUser.user.created_at);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (userCreatedAt > tenMinutesAgo) {
          isNewUser = true;
        console.log('Sending confirmation email for new professional user:', profileData.email);
        
        // Generate confirmation token
        const confirmationToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

        // Invalidate any existing tokens for this user first
        await supabaseAdmin
          .from('email_confirmation_tokens')
          .update({ used: true })
          .eq('user_id', userId)
          .eq('used', false);

        // Save new token to database
        const { error: tokenError } = await supabaseAdmin
          .from('email_confirmation_tokens')
          .insert({
            user_id: userId,
            email: profileData.email,
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
                from: 'Alô, Psi <noreply@alopsi.com.br>',
                to: [profileData.email],
                subject: 'Bem-vindo à Alô, Psi - Confirme seu email',
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Bem-vindo à Alô Psi</title>
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
                      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.1);">
                        
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Alô, Psi</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Conectando você ao cuidado mental</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 20px;">
                          <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">🎉 Bem-vindo à nossa equipe!</h2>
                          
                          <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">
                            Olá, <strong>${profileData.nome}</strong>!
                          </p>
                          
                          <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">
                            Obrigado por se cadastrar como profissional! Sua conta foi criada com sucesso em nossa plataforma. Estamos muito felizes em tê-lo(a) conosco!
                          </p>
                          
                          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #1e40af;">
                            <p style="margin: 0; font-size: 16px; color: #4b5563;">
                              Para começar a utilizar todos os recursos da plataforma, confirme seu email clicando no botão abaixo:
                            </p>
                          </div>
                          
                           <!-- CTA Button -->
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="${Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br'}/auth?confirm=true&token=${confirmationToken}" 
                               style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);">
                              ✅ Confirmar Email
                            </a>
                          </div>
                          
                          <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #0891b2; margin: 30px 0;">
                            <p style="margin: 0; font-size: 14px; color: #a16207;">
                              <strong>⏰ Importante:</strong> Este link expira em 24 horas por segurança.
                            </p>
                          </div>
                          
                          <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">
                            Se você não solicitou este cadastro, pode ignorar este email com segurança.
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
          }
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profile,
        professional: professional,
        confirmationEmailSent,
        isNewUser
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    // Get more specific error message
    const errorMessage = (error as any)?.message || 'Erro desconhecido';
    const errorDetails = (error as any)?.details || (error as any)?.code || 'Sem detalhes adicionais';
    
    console.error('Error details:', errorDetails);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});