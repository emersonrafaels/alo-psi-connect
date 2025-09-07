import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelAppointmentRequest {
  appointmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId }: CancelAppointmentRequest = await req.json();
    
    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'ID do agendamento é obrigatório' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar o agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Agendamento não encontrado:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se pode cancelar (24h de antecedência)
    const appointmentDateTime = new Date(`${appointment.data_consulta}T${appointment.horario}`);
    const now = new Date();
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return new Response(
        JSON.stringify({ error: 'Cancelamento só é permitido até 24h antes da consulta' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Processar reembolso se há preferenceId do Mercado Pago
    let refundStatus = 'not_needed';
    if (appointment.mercado_pago_preference_id && appointment.status === 'confirmado') {
      try {
        // Buscar o pagamento através da preferência
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/search?preference_id=${appointment.mercado_pago_preference_id}`,
          {
            headers: {
              'Authorization': `Bearer ${mercadoPagoAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          
          if (paymentData.results && paymentData.results.length > 0) {
            const payment = paymentData.results[0];
            
            if (payment.status === 'approved') {
              // Criar reembolso
              const refundResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${payment.id}/refunds`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${mercadoPagoAccessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    amount: payment.transaction_amount
                  })
                }
              );

              if (refundResponse.ok) {
                refundStatus = 'processed';
                console.log('Reembolso processado com sucesso');
              } else {
                refundStatus = 'failed';
                console.error('Erro ao processar reembolso:', await refundResponse.text());
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar reembolso:', error);
        refundStatus = 'failed';
      }
    }

    // Atualizar status do agendamento para cancelado
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ 
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Erro ao atualizar agendamento:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao cancelar agendamento' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Agendamento cancelado com sucesso:', appointmentId);

    return new Response(JSON.stringify({ 
      success: true,
      refundStatus,
      message: refundStatus === 'processed' 
        ? 'Agendamento cancelado e reembolso processado' 
        : 'Agendamento cancelado com sucesso'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in cancel-appointment function:", error);
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