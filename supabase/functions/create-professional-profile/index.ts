import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean profile data for UPDATE operations
function cleanProfileDataForUpdate(data: any): any {
  const cleanData = { ...data };
  
  // Remove immutable fields that should never be updated
  delete cleanData.id;
  delete cleanData.user_id;
  delete cleanData.created_at;
  
  // SEMPRE forçar tipo_usuario como profissional em cadastros/updates profissionais
  cleanData.tipo_usuario = 'profissional';
  
  console.log('🧹 Cleaned profile data for update:', {
    original_keys: Object.keys(data),
    cleaned_keys: Object.keys(cleanData),
    forcing_tipo_usuario: 'profissional'
  });
  
  return cleanData;
}

// Helper function to clean professional data for UPDATE operations
function cleanProfessionalDataForUpdate(data: any): any {
  const cleanData = { ...data };
  
  // Remove immutable fields that should never be updated
  delete cleanData.id;
  delete cleanData.user_id;
  delete cleanData.profile_id;
  delete cleanData.created_at;
  
  console.log('🧹 Cleaned professional data for update:', {
    original_keys: Object.keys(data),
    cleaned_keys: Object.keys(cleanData)
  });
  
  return cleanData;
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
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px ${primaryColor}33;">✅ Confirmar Email</a>
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
    
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { profileData, professionalData, horariosData, userId, tenantSlug: requestTenantSlug } = await req.json();

    // Detect tenant from multiple sources
    const origin = req.headers.get('origin') || '';
    const referer = req.headers.get('referer') || '';

    console.log('🔍 Tenant Detection:', { 
      origin, 
      referer, 
      requestTenantSlug,
      method: 'create-professional-profile'
    });

    // Priority: 1. Explicit tenantSlug from request, 2. Referer, 3. Origin, 4. Default
    const tenantSlug = requestTenantSlug || 
      (referer.includes('/medcos') ? 'medcos' : 
       (origin.includes('/medcos') ? 'medcos' : 'alopsi'));

    console.log('✅ Using tenant:', tenantSlug);

    // Fetch tenant data
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, logo_url, primary_color')
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
      
      // Check for duplicate profiles with same user_id
      const { data: duplicateProfiles, error: duplicateCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, created_at')
        .eq('user_id', userId);
      
      if (!duplicateCheckError && duplicateProfiles && duplicateProfiles.length > 1) {
        console.warn('⚠️ Found duplicate profiles for user_id:', userId, 'Count:', duplicateProfiles.length);
        
        // Keep the oldest profile, delete the rest
        const sortedProfiles = duplicateProfiles.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const profileToKeep = sortedProfiles[0];
        const profilesToDelete = sortedProfiles.slice(1);
        
        console.log('🗑️ Deleting duplicate profiles, keeping:', profileToKeep.id);
        
        for (const dupProfile of profilesToDelete) {
          await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', dupProfile.id);
          
          console.log('Deleted duplicate profile:', dupProfile.id);
        }
        
        // Update existingProfile reference to the one we kept
        existingProfile.id = profileToKeep.id;
      }
      
      // Clean profile data before update (remove immutable fields)
      const cleanedProfileData = cleanProfileDataForUpdate(profileData);
      
      console.log('📝 Updating profile with cleaned data');
      
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          ...cleanedProfileData,
          tenant_id: tenant.id
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Profile update error:', updateError);
        console.error('Error code:', updateError.code);
        console.error('Error message:', updateError.message);
        console.error('Error details:', updateError.details);
        throw new Error(`Erro ao atualizar profile: ${updateError.message} (${updateError.code})`);
      }

      if (!updatedProfile) {
        throw new Error('Falha ao atualizar profile - nenhum registro retornado');
      }
      
      console.log('✅ Profile updated successfully');
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
      
      // Clean professional data before update (remove immutable fields)
      const cleanedProfessionalData = cleanProfessionalDataForUpdate(professionalData);
      
      console.log('📝 Updating professional with cleaned data');
      
      // Update existing professional
      const { data: updatedProfessionals, error: updateError } = await supabaseAdmin
        .from('profissionais')
        .update(cleanedProfessionalData)
        .eq('profile_id', profile.id)
        .select();

      if (updateError) {
        console.error('❌ Professional update error:', updateError);
        console.error('Error code:', updateError.code);
        console.error('Error message:', updateError.message);
        console.error('Error details:', updateError.details);
        throw new Error(`Erro ao atualizar profissional: ${updateError.message} (${updateError.code})`);
      }

      if (!updatedProfessionals || updatedProfessionals.length === 0) {
        throw new Error('Falha ao atualizar profissional - nenhum registro retornado');
      }
      
      console.log('✅ Professional updated successfully. Rows affected:', updatedProfessionals.length);
      professional = updatedProfessionals[0];
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
                from: `${tenant.name} <noreply@alopsi.com.br>`,
                to: [profileData.email],
                subject: `Bem-vindo à ${tenant.name} - Confirme seu email`,
                html: generateConfirmationEmailHTML(
                  tenant.name,
                  tenant.primary_color,
                  tenant.logo_url,
                  profileData.nome,
                  confirmationUrl,
                  true
                )
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