import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    tenant_id: string;
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

interface CalendarEventTestRequest {
  agendamento: {
    id: string;
    nome_paciente: string;
    email_paciente: string;
    telefone_paciente?: string;
    data_consulta: string;
    horario: string;
    valor?: number;
    observacoes?: string;
    tenant_id: string;
    professional_id?: number;
  };
  professional?: {
    display_name: string;
    user_email: string;
  };
  duration_minutes?: number;
}

interface TenantGoogleConfig {
  google_meet_mode: 'professional' | 'tenant';
  google_calendar_email: string | null;
  google_calendar_token: string | null;
  google_calendar_refresh_token: string | null;
  google_calendar_scope: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const agendamento = requestBody.agendamento;

    // Detectar formato do payload
    const isTestFormat = !agendamento.profissionais && requestBody.professional;
    console.log('📦 Payload format detected:', isTestFormat ? 'TEST' : 'PRODUCTION');

    // Normalizar dados do profissional para estrutura unificada
    const professionalData = isTestFormat ? {
      display_name: requestBody.professional?.display_name || 'Profissional',
      user_email: requestBody.professional?.user_email || '',
      profissao: 'Psicólogo(a)',  // Valor padrão para testes
      telefone: '',  // Não disponível em formato de teste
      tempo_consulta: requestBody.duration_minutes || 50,
      profile_id: agendamento.professional_id || null
    } : agendamento.profissionais;

    console.log('👤 Professional data normalized:', {
      name: professionalData.display_name,
      email: professionalData.user_email,
      duration: professionalData.tempo_consulta,
      hasProfileId: !!professionalData.profile_id
    });

    // Validar campos obrigatórios
    if (!agendamento.id || !agendamento.nome_paciente || !agendamento.email_paciente || 
        !agendamento.data_consulta || !agendamento.horario || !agendamento.tenant_id) {
      console.error('❌ Missing required fields in agendamento');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados incompletos: faltam campos obrigatórios do agendamento' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!professionalData.display_name || !professionalData.user_email) {
      console.error('❌ Missing required professional fields');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados incompletos: faltam informações do profissional' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating calendar event for appointment:', agendamento.id);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar configuração do tenant
    console.log('Fetching tenant Google Calendar configuration...');
    const { data: tenantConfig, error: tenantError } = await supabase
      .from('tenants')
      .select('google_meet_mode, google_calendar_email, google_calendar_token, google_calendar_refresh_token, google_calendar_scope')
      .eq('id', agendamento.tenant_id)
      .single();

    if (tenantError) {
      console.error('Error fetching tenant config:', tenantError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao buscar configuração do tenant' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tenant Google Meet mode:', tenantConfig.google_meet_mode);

    // Decidir qual credencial usar baseado no modo do tenant
    let calendarToken = null;
    let calendarRefreshToken = null;
    let calendarScope = null;
    let calendarEmail = null;

    if (tenantConfig.google_meet_mode === 'tenant') {
      // Usar credenciais do tenant
      console.log('Using tenant-level Google Calendar credentials');
      calendarToken = tenantConfig.google_calendar_token;
      calendarRefreshToken = tenantConfig.google_calendar_refresh_token;
      calendarScope = tenantConfig.google_calendar_scope;
      calendarEmail = tenantConfig.google_calendar_email;
      
      if (!calendarToken || !calendarRefreshToken) {
        console.warn('⚠️ Tenant mode selected but no tenant credentials found');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Google Calendar do tenant não está conectado. Por favor, conecte nas configurações.',
            message: 'Google Calendar do tenant não configurado'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Usar credenciais do profissional (comportamento original)
      console.log('Using professional-level Google Calendar credentials');
      
      // Só buscar credenciais do profissional se tiver profile_id
      let professionalProfile = null;
      let profileError = null;
      
      if (professionalData.profile_id) {
        const result = await supabase
          .from('profiles')
          .select('google_calendar_token, google_calendar_refresh_token, google_calendar_scope')
          .eq('id', professionalData.profile_id)
          .maybeSingle();
        professionalProfile = result.data;
        profileError = result.error;
      } else {
        console.log('⚠️ No profile_id available (test format), skipping professional credential lookup');
      }
        
      if (profileError || !professionalProfile?.google_calendar_token) {
        console.error('Error fetching professional profile:', profileError);
        
        // FALLBACK: Tentar usar credenciais do tenant
        console.log('⚠️ Professional credentials not found, attempting tenant fallback...');
        
        if (tenantConfig.google_calendar_token && tenantConfig.google_calendar_refresh_token) {
          console.log('✅ Using tenant credentials as fallback');
          calendarToken = tenantConfig.google_calendar_token;
          calendarRefreshToken = tenantConfig.google_calendar_refresh_token;
          calendarScope = tenantConfig.google_calendar_scope;
          calendarEmail = tenantConfig.google_calendar_email;
        } else {
          console.error('❌ No credentials available (neither professional nor tenant)');
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Profissional não possui Google Calendar conectado e tenant também não possui credenciais configuradas.',
              message: 'Google Calendar não configurado'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        calendarToken = professionalProfile.google_calendar_token;
        calendarRefreshToken = professionalProfile.google_calendar_refresh_token;
        calendarScope = professionalProfile.google_calendar_scope;
      }
    }

    console.log('Final credentials selected:', {
      hasToken: !!calendarToken,
      hasRefreshToken: !!calendarRefreshToken,
      scope: calendarScope,
      email: calendarEmail
    });

    // Create event data
    const dataConsulta = new Date(agendamento.data_consulta);
    const [hours, minutes] = agendamento.horario.split(':');
    const startDateTime = new Date(dataConsulta);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + (professionalData.tempo_consulta || 50));

    const eventData = {
      summary: `Consulta - ${agendamento.nome_paciente}`,
      description: `Consulta online com ${professionalData.display_name}

📋 Informações da Consulta:
• Paciente: ${agendamento.nome_paciente}
• Email: ${agendamento.email_paciente}
${agendamento.telefone_paciente ? `• Telefone: ${agendamento.telefone_paciente}\n` : ''}${agendamento.valor ? `• Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valor)}\n` : ''}
${agendamento.observacoes ? `📝 Observações do Paciente:\n${agendamento.observacoes}\n\n` : ''}🎥 Link do Google Meet será gerado automaticamente para esta reunião.

📞 Para dúvidas ou reagendamento, entre em contato:
• Email: ${professionalData.user_email}
${professionalData.telefone ? `• Telefone: ${professionalData.telefone}` : ''}

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
          email: professionalData.user_email,
          displayName: professionalData.display_name,
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
    console.log('Creating Google Calendar event...');
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${calendarToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.text();
      console.error('Google Calendar API error:', errorData);
      
      // Try to refresh token if unauthorized
      if (calendarResponse.status === 401 && calendarRefreshToken) {
        console.log('Attempting to refresh Google Calendar token...');
        
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') ?? '',
            client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') ?? '',
            refresh_token: calendarRefreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          
          // Update the token in database (tenant or profile depending on mode)
          if (tenantConfig.google_meet_mode === 'tenant') {
            await supabase
              .from('tenants')
              .update({ google_calendar_token: tokenData.access_token })
              .eq('id', agendamento.tenant_id);
          } else if (professionalData.profile_id) {
            await supabase
              .from('profiles')
              .update({ google_calendar_token: tokenData.access_token })
              .eq('id', professionalData.profile_id);
          } else {
            console.warn('⚠️ No profile_id available for token update (test format)');
          }

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
            
            const meetLink = eventResult.hangoutLink || eventResult.conferenceData?.entryPoints?.[0]?.uri;
            
            return new Response(JSON.stringify({ 
              success: true, 
              eventId: eventResult.id,
              meetLink: meetLink,
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
