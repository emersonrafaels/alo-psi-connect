import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RescheduleAppointmentRequest {
  appointmentId: string;
  newProfessionalId: number;
  newDate: string;
  newTime: string;
  originalValue: number;
  newValue: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      appointmentId, 
      newProfessionalId, 
      newDate, 
      newTime, 
      originalValue, 
      newValue 
    }: RescheduleAppointmentRequest = await req.json();
    
    if (!appointmentId || !newProfessionalId || !newDate || !newTime) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar o agendamento original
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

    // Verificar se pode reagendar (24h de antecedência)
    const appointmentDateTime = new Date(`${appointment.data_consulta}T${appointment.horario}`);
    const now = new Date();
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return new Response(
        JSON.stringify({ error: 'Reagendamento só é permitido até 24h antes da consulta' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar o novo profissional
    const { data: newProfessional, error: professionalError } = await supabase
      .from('profissionais')
      .select('profile_id')
      .eq('id', newProfessionalId)
      .single();

    if (professionalError || !newProfessional) {
      return new Response(
        JSON.stringify({ error: 'Profissional não encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calcular diferença de valor
    const priceDifference = newValue - originalValue;
    let paymentResult = null;

    // Se há diferença positiva, criar novo pagamento
    if (priceDifference > 0) {
      try {
        // Criar preferência de pagamento para a diferença
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          'create-mercadopago-payment',
          {
            body: {
              agendamentoId: appointmentId,
              professionalId: newProfessionalId,
              professionalName: 'Profissional',
              customerName: appointment.nome_paciente,
              customerEmail: appointment.email_paciente,
              customerPhone: appointment.telefone_paciente,
              date: newDate,
              time: newTime,
              price: priceDifference,
              notes: `Diferença de reagendamento - Valor adicional: R$ ${(priceDifference / 100).toFixed(2)}`
            }
          }
        );

        if (paymentError) {
          console.error('Erro ao criar pagamento:', paymentError);
          return new Response(
            JSON.stringify({ error: 'Erro ao processar pagamento da diferença' }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        paymentResult = paymentData;
      } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar pagamento da diferença' }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Se há diferença negativa, processar reembolso parcial
    if (priceDifference < 0 && appointment.mercado_pago_preference_id) {
      try {
        // Buscar o pagamento original
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
              // Criar reembolso parcial
              const refundAmount = Math.abs(priceDifference);
              const refundResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${payment.id}/refunds`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${mercadoPagoAccessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    amount: refundAmount
                  })
                }
              );

              if (!refundResponse.ok) {
                console.error('Erro ao processar reembolso:', await refundResponse.text());
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar reembolso:', error);
      }
    }

    // Atualizar o agendamento com os novos dados
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ 
        professional_id: newProfessional.profile_id,
        data_consulta: newDate,
        horario: newTime,
        valor: newValue,
        status: priceDifference > 0 ? 'pendente' : 'confirmado',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Erro ao atualizar agendamento:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao reagendar consulta' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Agendamento reagendado com sucesso:', appointmentId);

    const response: any = { 
      success: true,
      message: 'Agendamento reagendado com sucesso',
      priceDifference
    };

    // Se há pagamento adicional, incluir dados do pagamento
    if (paymentResult && priceDifference > 0) {
      response.paymentUrl = paymentResult.initPoint;
      response.requiresPayment = true;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in reschedule-appointment function:", error);
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