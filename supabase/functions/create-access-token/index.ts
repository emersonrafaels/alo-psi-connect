import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccessTokenRequest {
  email: string;
  agendamentoId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, agendamentoId }: AccessTokenRequest = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar se o agendamento existe e pertence ao email
    const { data: appointment, error: appointmentError } = await supabase
      .from('agendamentos')
      .select('id, email_paciente')
      .eq('id', agendamentoId)
      .eq('email_paciente', email)
      .single();

    if (appointmentError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado ou e-mail não corresponde' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se já existe um token válido não usado
    const { data: existingToken } = await supabase
      .from('agendamento_tokens')
      .select('token')
      .eq('agendamento_id', agendamentoId)
      .eq('email', email)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingToken) {
      return new Response(JSON.stringify({ 
        token: existingToken.token,
        message: 'Token já existe e é válido' 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Criar novo token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    const { error: tokenError } = await supabase
      .from('agendamento_tokens')
      .insert({
        token,
        agendamento_id: agendamentoId,
        email,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('Erro ao criar token:', tokenError);
      throw new Error('Erro ao gerar token de acesso');
    }

    console.log('Token criado com sucesso:', token);

    return new Response(JSON.stringify({ 
      token,
      expiresAt: expiresAt.toISOString(),
      message: 'Token criado com sucesso'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in create-access-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);