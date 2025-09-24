import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const notificationData: NotificationRequest = await req.json();
    console.log('📊 Notification data received:', JSON.stringify(notificationData, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get webhook URL from system configuration
    const { data: config } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('category', 'n8n')
      .eq('key', 'booking_webhook_url')
      .single();

    // Use configured URL or fallback to default
    const n8nUrl = config?.value || 'https://n8n.alopsi.com.br/webhook/alopsi-agendamento-mensagem-whatsapp';
    console.log('🔗 Using webhook URL from config:', n8nUrl);
    
    console.log('🚀 Sending to n8n webhook:', n8nUrl);
    
    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    const responseText = await n8nResponse.text();
    console.log('📨 n8n response status:', n8nResponse.status);
    console.log('📨 n8n response body:', responseText);

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status} - ${responseText}`);
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
    console.error('❌ Error in notify-booking-status function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
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