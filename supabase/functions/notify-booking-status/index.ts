import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isStudyNotificationBlocked } from '../_shared/study-notifications.ts';
import { getCaller, isServiceCall, canAccessAppointment, authErrorResponse } from '../_shared/guards.ts';

const ALLOWED_EVENTS = ['agendamento_sucesso', 'agendamento_erro', 'pagamento_sucesso', 'pagamento_erro'];
const ALLOWED_RECIPIENTS = ['admin', 'dev', 'paciente', 'profissional'];
const clip = (v: unknown, n = 200) => (v == null ? '' : String(v).slice(0, n));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  tipo_evento: 'agendamento_sucesso' | 'agendamento_erro' | 'pagamento_sucesso' | 'pagamento_erro';
  paciente: {
    nome: string;
    email: string;
    telefone: string;
    esta_logado: boolean;
    user_id: string;
  };
  profissional?: {
    nome: string;
    especialidade: string;
    email?: string;
  };
  agendamento: {
    data: string;
    horario: string;
    valor: number;
    status: string;
    id?: string;
  };
  erro?: {
    codigo: string;
    mensagem: string;
    contexto: string;
  };
  notificacao_para: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log('📞 Notify booking status function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw: NotificationRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (!ALLOWED_EVENTS.includes(raw?.tipo_evento)) {
      return new Response(JSON.stringify({ success: false, error: 'Evento inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const recipients = (Array.isArray(raw.notificacao_para) ? raw.notificacao_para : []).filter((r) => ALLOWED_RECIPIENTS.includes(r));

    // The webhook payload is rebuilt from the database: callers can only report on their own bookings.
    let notificationData: NotificationRequest;
    const internal = await isServiceCall(req, supabase);
    const caller = internal ? null : await getCaller(req, supabase);
    const apptId = raw.agendamento?.id;
    if (apptId) {
      if (caller && !(await canAccessAppointment(supabase, caller, apptId))) {
        return new Response(JSON.stringify({ success: false, error: 'Sem permissão' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: a } = await supabase.from('agendamentos')
        .select('id, user_id, nome_paciente, email_paciente, telefone_paciente, data_consulta, horario, valor, status, profissionais:professional_id (display_name, profissao)')
        .eq('id', apptId).maybeSingle();
      if (!a) {
        return new Response(JSON.stringify({ success: false, error: 'Agendamento não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // deno-lint-ignore no-explicit-any
      const prof: any = Array.isArray(a.profissionais) ? a.profissionais[0] : a.profissionais;
      notificationData = {
        tipo_evento: raw.tipo_evento,
        paciente: { nome: a.nome_paciente, email: a.email_paciente, telefone: a.telefone_paciente || 'N/A', esta_logado: !!caller, user_id: a.user_id || 'guest' },
        profissional: { nome: prof?.display_name ?? '', especialidade: prof?.profissao ?? '' },
        agendamento: { id: a.id, data: a.data_consulta, horario: a.horario, valor: Number(a.valor), status: a.status },
        erro: raw.erro ? { codigo: clip(raw.erro.codigo, 50), mensagem: clip(raw.erro.mensagem, 500), contexto: clip(raw.erro.contexto, 200) } : undefined,
        notificacao_para: recipients,
      };
    } else {
      // Failures before a booking exists: the patient is always the signed-in caller.
      if (!raw.tipo_evento.endsWith('_erro')) {
        return new Response(JSON.stringify({ success: false, error: 'agendamento.id é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      let paciente = { nome: '', email: '', telefone: '', esta_logado: false, user_id: 'guest' };
      if (caller) {
        const { data: au } = await supabase.auth.admin.getUserById(caller.userId);
        const { data: pr } = await supabase.from('profiles').select('nome').eq('user_id', caller.userId).maybeSingle();
        paciente = { nome: pr?.nome ?? '', email: au?.user?.email ?? '', telefone: clip(raw.paciente?.telefone, 30), esta_logado: true, user_id: caller.userId };
      }
      notificationData = {
        tipo_evento: raw.tipo_evento,
        paciente,
        profissional: { nome: clip(raw.profissional?.nome, 120), especialidade: clip(raw.profissional?.especialidade, 120) },
        agendamento: { data: clip(raw.agendamento?.data, 20), horario: clip(raw.agendamento?.horario, 10), valor: Number(raw.agendamento?.valor) || 0, status: clip(raw.agendamento?.status, 30) },
        erro: raw.erro ? { codigo: clip(raw.erro.codigo, 50), mensagem: clip(raw.erro.mensagem, 500), contexto: clip(raw.erro.contexto, 200) } : undefined,
        // Without a booking only the internal team is notified.
        notificacao_para: recipients.filter((r) => r === 'admin' || r === 'dev'),
      };
    }

    if (await isStudyNotificationBlocked(supabase, { appointmentId: notificationData.agendamento?.id, email: notificationData.paciente?.email })) {
      return Response.json({ success: true, sent: 0, skipped: 'synthetic_demo' }, { headers: corsHeaders });
    }

    // Get webhook URL from system configuration
    const { data: config } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('category', 'n8n')
      .eq('key', 'booking_webhook_url')
      .single();

    // Use configured URL or fallback to default
    const n8nUrl = config?.value || 'https://n8n.alopsi.com.br/webhook/alopsi-agendamento-mensagem-whatsapp';
    console.log('🚀 Sending booking event to n8n:', notificationData.tipo_evento);
    
    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    const responseText = await n8nResponse.text();
    console.log('📨 n8n response status:', n8nResponse.status);

    if (!n8nResponse.ok) {
      console.error('n8n webhook failed:', n8nResponse.status, responseText.slice(0, 300));
      throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        n8n_status: n8nResponse.status 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const authResp = authErrorResponse(error, corsHeaders);
    if (authResp) return authResp;
    console.error('❌ Error in notify-booking-status function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Não foi possível enviar a notificação',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);