import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle payment notification
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Get payment details from MercadoPago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to fetch payment: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', JSON.stringify(payment, null, 2));

      const agendamentoId = payment.external_reference;
      let newStatus = 'pendente';

      // Map MercadoPago status to our status
      switch (payment.status) {
        case 'approved':
          newStatus = 'confirmado';
          break;
        case 'pending':
          newStatus = 'pendente_pagamento';
          break;
        case 'cancelled':
        case 'rejected':
          newStatus = 'cancelado';
          break;
        default:
          newStatus = 'pendente';
      }

      // Update agendamento status
      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({ status: newStatus })
        .eq('id', agendamentoId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log(`Updated agendamento ${agendamentoId} to status: ${newStatus}`);

      // If payment is approved, send notification email
      if (payment.status === 'approved') {
        try {
          // Get appointment details
          const { data: agendamento, error: fetchError } = await supabase
            .from('agendamentos')
            .select(`
              *,
              profissionais:professional_id (
                display_name,
                user_email,
                profissao,
                telefone
              )
            `)
            .eq('id', agendamentoId)
            .single();

          if (fetchError) {
            console.error('Error fetching agendamento:', fetchError);
          } else {
            // Call email notification function
            const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-appointment-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                agendamento: agendamento,
                paymentId: paymentId
              }),
            });

            if (!emailResponse.ok) {
              console.error('Failed to send email notification:', await emailResponse.text());
            } else {
              console.log('Email notification sent successfully');
            }
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in mercadopago-webhook function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);