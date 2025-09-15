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
        .update(profileData)
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

    // Send confirmation email for new users (check if user was just created)
    let confirmationEmailSent = false;
    let isNewUser = false;
    
    try {
      // Check if this is a new user by checking if they have a confirmed email
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!authError && authUser.user && !authUser.user.email_confirmed_at) {
        isNewUser = true;
        console.log('Sending confirmation email for new professional user:', profileData.email);
        
        // Generate confirmation token
        const confirmationToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

        // Save token to database
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
                from: 'Alô, Psi! <noreply@alopsi.com>',
                to: [profileData.email],
                subject: 'Confirme seu email - Alô, Psi!',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333; text-align: center;">Bem-vindo ao Alô, Psi!</h1>
                    <p style="color: #666; font-size: 16px;">Olá ${profileData.nome},</p>
                    <p style="color: #666; font-size: 16px;">
                      Obrigado por se cadastrar como profissional! Para ativar sua conta, clique no link abaixo:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${Deno.env.get('APP_BASE_URL') || 'http://localhost:3000'}/auth-callback?token=${confirmationToken}&type=email_confirmation" 
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
    const errorMessage = error?.message || 'Erro desconhecido';
    const errorDetails = error?.details || error?.code || 'Sem detalhes adicionais';
    
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