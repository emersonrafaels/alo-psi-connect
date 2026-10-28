import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mapPaymentStatus, shouldApply, parseNotification } from "../_shared/mercadopagoStatus.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ok = (payload: unknown) =>
  new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    console.log('Webhook received:', JSON.stringify({ query: Object.fromEntries(url.searchParams), body }));

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      console.error('Mercado Pago access token not configured');
      return ok({ received: true, error: 'token_missing' });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notification = parseNotification(body, url.searchParams);
    let paymentId: string | null = null;

    if (notification.kind === 'payment') {
      paymentId = notification.id;
    } else if (notification.kind === 'merchant_order') {
      const moRes = await fetch(`https://api.mercadopago.com/merchant_orders/${notification.id}`, {
        headers: { 'Authorization': `Bearer ${mercadoPagoToken}` },
      });
      if (moRes.ok) {
        const mo = await moRes.json();
        const pays = (mo.payments ?? []) as any[];
        paymentId = String((pays.find((p) => p.status === 'approved') ?? pays[0])?.id ?? '') || null;
      } else {
        console.error(`Merchant order fetch failed [${moRes.status}]: ${await moRes.text()}`);
      }
    }

    if (!paymentId) {
      console.log('Notification ignored (no payment id)');
      return ok({ received: true, ignored: true });
    }

    {
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mercadoPagoToken}` },
      });

      if (!paymentResponse.ok) {
        console.error(`Failed to fetch payment ${paymentId} [${paymentResponse.status}]: ${await paymentResponse.text()}`);
        return ok({ received: true, error: 'payment_fetch_failed' });
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', JSON.stringify({ id: payment.id, status: payment.status, external_reference: payment.external_reference }));

      const agendamentoId = payment.external_reference;
      const update = mapPaymentStatus(payment.status);
      if (!agendamentoId || !update) {
        console.log('Payment without appointment reference or unknown status');
        return ok({ received: true, ignored: true });
      }

      const { data: current } = await supabase
        .from('agendamentos').select('payment_status').eq('id', agendamentoId).maybeSingle();
      if (!current) {
        console.log(`Agendamento ${agendamentoId} not found`);
        return ok({ received: true, ignored: true });
      }
      const wasPaid = current.payment_status === 'paid';
      if (!shouldApply(current.payment_status, update)) {
        console.log(`Agendamento ${agendamentoId} already paid; ignoring ${payment.status}`);
        return ok({ received: true, already_paid: true });
      }

      const { error: updateError } = await supabase
        .from('agendamentos')
        .update(update)
        .eq('id', agendamentoId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log(`Updated agendamento ${agendamentoId} to`, update);

      // Only on the first approval: create calendar event and send emails
      if (update.payment_status === 'paid' && !wasPaid) {
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
                telefone,
                tempo_consulta,
                profile_id
              )
            `)
            .eq('id', agendamentoId)
            .single();

          if (fetchError) {
            console.error('Error fetching agendamento:', fetchError);
          } else {
            let meetLink = null;
            
            // Try to create Google Calendar event
            try {
              const calendarResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-calendar-event`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  agendamento: agendamento
                }),
              });

              if (calendarResponse.ok) {
                const calendarResult = await calendarResponse.json();
                if (calendarResult.success && calendarResult.meetLink) {
                  meetLink = calendarResult.meetLink;
                  console.log('Google Calendar event created with Meet link:', meetLink);
                  
                  // 🆕 SALVAR O LINK NO BANCO DE DADOS
                  const { error: updateLinkError } = await supabase
                    .from('agendamentos')
                    .update({ meeting_link: meetLink })
                    .eq('id', agendamentoId);
                  
                  if (updateLinkError) {
                    console.error('Error saving meeting link:', updateLinkError);
                  } else {
                    console.log('Meeting link saved successfully to database');
                  }
                } else {
                  console.log('Calendar event creation skipped:', calendarResult.message);
                }
              } else {
                console.error('Failed to create calendar event:', await calendarResponse.text());
              }
            } catch (calendarError) {
              console.error('Error creating calendar event:', calendarError);
            }

            // Call email notification function (always send emails regardless of calendar creation)
            const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-appointment-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                agendamento: agendamento,
                paymentId: paymentId,
                meetLink: meetLink
              }),
            });

            if (!emailResponse.ok) {
              console.error('Failed to send email notification:', await emailResponse.text());
            } else {
              console.log('Email notifications sent successfully');
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