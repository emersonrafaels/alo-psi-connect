import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarSyncRequest {
  action: 'sync';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Iniciando sincronização do Google Calendar...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authorization header missing');
      throw new Error('Authorization header obrigatório');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extraído, validando usuário...');
    
    const { data: user, error: userError } = await supabaseClient.auth.getUser(token);
    console.log('User data:', user?.user?.id ? 'User found' : 'No user', userError ? `Error: ${userError.message}` : 'No error');

    if (userError || !user.user) {
      console.error('User authentication failed:', userError);
      throw new Error('Usuário não autenticado');
    }

    console.log('Usuário autenticado:', user.user.id);

    // Get user's Google Calendar tokens
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_calendar_token, google_calendar_refresh_token')
      .eq('user_id', user.user.id)
      .single();

    console.log('Profile data:', profile ? 'Profile found' : 'No profile', profileError ? `Error: ${profileError.message}` : 'No error');

    if (profileError || !profile?.google_calendar_token) {
      console.error('Profile or token not found:', profileError);
      throw new Error('Google Calendar não conectado');
    }

    console.log('Google Calendar token encontrado, buscando eventos...');

    // Get calendar events for the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}&` +
      `timeMax=${thirtyDaysFromNow.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${profile.google_calendar_token}`,
        },
      }
    );

    console.log('Google Calendar API response status:', calendarResponse.status);

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', errorText);
      
      if (calendarResponse.status === 401) {
        console.log('Token expirado, tentando renovar...');
        // Token expired, try to refresh
        if (profile.google_calendar_refresh_token) {
          const refreshResponse = await refreshGoogleToken(profile.google_calendar_refresh_token);
          if (refreshResponse.success) {
            console.log('Token renovado com sucesso');
            // Update tokens and retry
            await supabaseClient
              .from('profiles')
              .update({
                google_calendar_token: refreshResponse.access_token,
              })
              .eq('user_id', user.user.id);

            // Retry the calendar request with new token
            const retryResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
              `timeMin=${now.toISOString()}&` +
              `timeMax=${thirtyDaysFromNow.toISOString()}&` +
              `singleEvents=true&` +
              `orderBy=startTime`,
              {
                headers: {
                  'Authorization': `Bearer ${refreshResponse.access_token}`,
                },
              }
            );
            
            if (!retryResponse.ok) {
              const retryErrorText = await retryResponse.text();
              console.error('Retry request failed:', retryErrorText);
              throw new Error('Erro ao sincronizar após refresh do token');
            }
            
            const retryData = await retryResponse.json();
            return await handleSyncSuccess(retryData, corsHeaders, supabaseClient, user.user.id);
          }
        }
        throw new Error('Token de acesso expirado. Reconecte sua conta Google.');
      }
      throw new Error(`Erro ao acessar Google Calendar: ${calendarResponse.status} - ${errorText}`);
    }

    const calendarData = await calendarResponse.json();
    console.log('Dados do calendário recebidos, processando eventos...');
    return await handleSyncSuccess(calendarData, corsHeaders, supabaseClient, user.user.id);

  } catch (error: any) {
    console.error('Error in google-calendar-sync function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Verifique os logs para mais detalhes'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function refreshGoogleToken(refreshToken: string) {
  try {
    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    return { success: true, access_token: data.access_token };
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return { success: false };
  }
}

async function handleSyncSuccess(calendarData: any, corsHeaders: any, supabaseClient: any, userId: string) {
  // Filter busy events (not available, not transparent)
  const busyEvents = calendarData.items?.filter((event: any) => 
    event.status === 'confirmed' && 
    event.transparency !== 'transparent' &&
    event.start?.dateTime && 
    event.end?.dateTime
  ) || [];

  console.log(`Encontrados ${busyEvents.length} eventos ocupados do Google Calendar`);

  // Save events to database
  let savedCount = 0;
  for (const event of busyEvents) {
    try {
      const { error } = await supabaseClient
        .from('google_calendar_events')
        .upsert({
          user_id: userId,
          event_id: event.id,
          title: event.summary || 'Evento sem título',
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          is_busy: true,
        }, {
          onConflict: 'user_id,event_id'
        });

      if (error) {
        console.error('Erro ao salvar evento:', event.id, error);
      } else {
        savedCount++;
      }
    } catch (error) {
      console.error('Erro ao processar evento:', event.id, error);
    }
  }

  console.log(`Salvos ${savedCount} eventos no banco de dados`);

  // Get saved events to return
  const { data: savedEvents, error: fetchError } = await supabaseClient
    .from('google_calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (fetchError) {
    console.error('Erro ao buscar eventos salvos:', fetchError);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      eventsCount: busyEvents.length,
      savedCount: savedCount,
      events: savedEvents || [],
      message: `${savedCount} eventos sincronizados e salvos com sucesso!`
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

serve(handler);