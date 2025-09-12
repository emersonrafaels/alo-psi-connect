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

    // Create profile with admin privileges
    const { data: profile, error: profileError } = await supabaseAdmin
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

    console.log('Profile created successfully:', profile.id);

    // Create professional data
    const { data: professional, error: professionalError } = await supabaseAdmin
      .from('profissionais')
      .insert({
        profile_id: profile.id,
        user_id: parseInt(userId),
        ...professionalData
      })
      .select()
      .single();

    if (professionalError) {
      console.error('Professional creation error:', professionalError);
      throw professionalError;
    }

    console.log('Professional data created successfully:', professional.id);

    // Create schedules if provided
    if (horariosData && horariosData.length > 0) {
      const horariosFormatted = horariosData.map((horario: any) => ({
        user_id: parseInt(userId),
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

      console.log('Schedules created successfully');
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
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});