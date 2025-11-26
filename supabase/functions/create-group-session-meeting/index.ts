import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GroupSessionMeetingRequest {
  sessionId: string;
  tenantId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, tenantId } = await req.json() as GroupSessionMeetingRequest;

    console.log('🎯 Creating Google Meet for group session:', { sessionId, tenantId });

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados da sessão
    const { data: session, error: sessionError } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Sessão não encontrada');
    }

    // Buscar configuração do tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('google_meet_mode, google_calendar_token, google_calendar_refresh_token, google_calendar_email')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Configuração do tenant não encontrada');
    }

    // Validar token
    if (!tenant.google_calendar_token || !tenant.google_calendar_refresh_token) {
      console.log('⚠️ No Google Calendar token configured for tenant');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google Calendar não configurado para este tenant',
          meetingLink: null 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar data e horário (sem conversão UTC)
    const sessionDate = session.session_date;
    const sessionTime = session.start_time;
    const [hours, minutes] = sessionTime.split(':');
    
    const startDateTime = `${sessionDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
    
    // Calcular horário de término
    const durationMinutes = session.duration_minutes || 60;
    const startDate = new Date(`${sessionDate}T${sessionTime}`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const endDateTime = `${sessionDate}T${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`;

    console.log('📅 Event times:', { startDateTime, endDateTime });

    // Criar evento no Google Calendar
    const eventPayload = {
      summary: session.title,
      description: `${session.description}\n\nTipo: ${session.session_type}\nParticipantes: ${session.max_participants}\n\nPlataforma: Rede Bem Estar`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      conferenceData: {
        createRequest: {
          requestId: `group-session-${sessionId}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: [],
    };

    console.log('📨 Creating Google Calendar event...');

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tenant.google_calendar_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('❌ Google Calendar API error:', errorText);
      throw new Error(`Erro ao criar evento no Google Calendar: ${errorText}`);
    }

    const calendarEvent = await calendarResponse.json();
    const meetLink = calendarEvent.hangoutLink || calendarEvent.conferenceData?.entryPoints?.[0]?.uri;
    const eventId = calendarEvent.id;

    console.log('✅ Google Meet created:', { meetLink, eventId });

    // Atualizar sessão com link do Meet
    const { error: updateError } = await supabase
      .from('group_sessions')
      .update({
        meeting_link: meetLink,
        google_event_id: eventId,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('❌ Error updating session:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        meetingLink: meetLink,
        eventId: eventId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in create-group-session-meeting:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
