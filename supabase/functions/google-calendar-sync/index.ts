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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabaseClient.auth.getUser(token);

    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    // Get user's Google Calendar tokens
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_calendar_token, google_calendar_refresh_token')
      .eq('user_id', user.user.id)
      .single();

    if (profileError || !profile?.google_calendar_token) {
      throw new Error('Google Calendar não conectado');
    }

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

    if (!calendarResponse.ok) {
      if (calendarResponse.status === 401) {
        // Token expired, try to refresh
        if (profile.google_calendar_refresh_token) {
          const refreshResponse = await refreshGoogleToken(profile.google_calendar_refresh_token);
          if (refreshResponse.success) {
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
              throw new Error('Erro ao sincronizar após refresh do token');
            }
            
            const retryData = await retryResponse.json();
            return handleSyncSuccess(retryData, corsHeaders);
          }
        }
        throw new Error('Token de acesso expirado. Reconecte sua conta Google.');
      }
      throw new Error('Erro ao acessar Google Calendar');
    }

    const calendarData = await calendarResponse.json();
    return handleSyncSuccess(calendarData, corsHeaders);

  } catch (error: any) {
    console.error('Error in google-calendar-sync function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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

function handleSyncSuccess(calendarData: any, corsHeaders: any) {
  // Filter busy events (not available, not transparent)
  const busyEvents = calendarData.items?.filter((event: any) => 
    event.status === 'confirmed' && 
    event.transparency !== 'transparent' &&
    event.start?.dateTime && 
    event.end?.dateTime
  ) || [];

  console.log(`Sincronizados ${busyEvents.length} eventos ocupados do Google Calendar`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      eventsCount: busyEvents.length,
      message: `${busyEvents.length} eventos sincronizados com sucesso!`
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

serve(handler);