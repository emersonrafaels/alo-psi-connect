import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEventRequest {
  agendamento: {
    id: string;
    nome_paciente: string;
    email_paciente: string;
    telefone_paciente: string;
    data_consulta: string;
    horario: string;
    valor: number;
    observacoes?: string;
    profissionais: {
      display_name: string;
      user_email: string;
      profissao: string;
      telefone: string;
      tempo_consulta: number;
      profile_id: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agendamento }: CalendarEventRequest = await req.json();
    console.log('Creating calendar event for appointment:', agendamento.id);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get professional's Google Calendar tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_token, google_calendar_refresh_token')
      .eq('id', agendamento.profissionais.profile_id)
      .single();

    if (profileError || !profile) {
      console.log('Professional profile not found or no Google Calendar connection');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Professional not connected to Google Calendar' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!profile.google_calendar_token) {
      console.log('Professional does not have Google Calendar connected');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Professional Google Calendar not connected' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create event data
    const dataConsulta = new Date(agendamento.data_consulta);
    const [hours, minutes] = agendamento.horario.split(':');
    const startDateTime = new Date(dataConsulta);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + (agendamento.profissionais.tempo_consulta || 50));

    const eventData = {
      summary: `Consulta - ${agendamento.nome_paciente}`,
      description: `Consulta online com ${agendamento.profissionais.display_name}

📋 Informações da Consulta:
• Paciente: ${agendamento.nome_paciente}
• Email: ${agendamento.email_paciente}
• Telefone: ${agendamento.telefone_paciente}
• Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valor)}

${agendamento.observacoes ? `📝 Observações do Paciente:\n${agendamento.observacoes}\n\n` : ''}

🎥 Link do Google Meet será gerado automaticamente para esta reunião.

📞 Para dúvidas ou reagendamento, entre em contato:
• Email: ${agendamento.profissionais.user_email}
• Telefone: ${agendamento.profissionais.telefone}

---
Gerado automaticamente pelo sistema Alô, Psi`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        {
          email: agendamento.email_paciente,
          displayName: agendamento.nome_paciente,
        },
        {
          email: agendamento.profissionais.user_email,
          displayName: agendamento.profissionais.display_name,
        }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${agendamento.id}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 60 },      // 1 hour before
          { method: 'popup', minutes: 15 },      // 15 minutes before
        ]
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
    };

    // Create calendar event
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.google_calendar_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.text();
      console.error('Google Calendar API error:', errorData);
      
      // Try to refresh token if unauthorized
      if (calendarResponse.status === 401 && profile.google_calendar_refresh_token) {
        console.log('Attempting to refresh Google Calendar token...');
        
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') ?? '',
            client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') ?? '',
            refresh_token: profile.google_calendar_refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          
          // Update the token in database
          await supabase
            .from('profiles')
            .update({ google_calendar_token: tokenData.access_token })
            .eq('id', agendamento.profissionais.profile_id);

          // Retry calendar event creation with new token
          const retryResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );

          if (retryResponse.ok) {
            const eventResult = await retryResponse.json();
            console.log('Calendar event created successfully after token refresh');
            
            return new Response(JSON.stringify({ 
              success: true, 
              eventId: eventResult.id,
              meetLink: eventResult.hangoutLink || eventResult.conferenceData?.entryPoints?.[0]?.uri,
              message: 'Calendar event created successfully'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
        }
      }
      
      throw new Error(`Failed to create calendar event: ${calendarResponse.status} - ${errorData}`);
    }

    const eventResult = await calendarResponse.json();
    console.log('Calendar event created successfully:', eventResult.id);

    const meetLink = eventResult.hangoutLink || eventResult.conferenceData?.entryPoints?.[0]?.uri;
    console.log('Google Meet link:', meetLink);

    return new Response(JSON.stringify({ 
      success: true, 
      eventId: eventResult.id,
      meetLink: meetLink,
      message: 'Calendar event created successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in create-calendar-event function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);