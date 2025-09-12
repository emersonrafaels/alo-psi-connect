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

      const horariosFormatted = horariosData.map((horario: any) => ({
        user_id: finalUserId, // Use the correct user_id
        day: horario.day,
        start_time: horario.startTime,
        end_time: horario.endTime,
        minutos_janela: horario.duration || 30
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profile,
        professional: professional 
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