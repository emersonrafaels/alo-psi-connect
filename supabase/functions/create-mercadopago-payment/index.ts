import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  agendamentoId: string;
  valor: number;
  title: string;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agendamentoId, valor, title, description }: PaymentRequest = await req.json();
    
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    // Create payment preference
    const preferenceData = {
      items: [
        {
          id: agendamentoId,
          title: title,
          description: description,
          quantity: 1,
          currency_id: "BRL",
          unit_price: valor
        }
      ],
      payment_methods: {
        excluded_payment_types: [
          {
            id: "debit_card"
          },
          {
            id: "ticket"
          }
        ],
        installments: 12
      },
      back_urls: {
        success: `${Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br'}/pagamento-sucesso?agendamento=${agendamentoId}`,
        failure: `${Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br'}/pagamento-cancelado?agendamento=${agendamentoId}`,
        pending: `${Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br'}/pagamento-sucesso?agendamento=${agendamentoId}`
      },
      auto_return: "approved",
      external_reference: agendamentoId,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('MercadoPago API Error:', errorData);
      throw new Error(`MercadoPago API error: ${response.status}`);
    }

    const preference = await response.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update agendamento with mercadopago preference_id
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ 
        mercado_pago_preference_id: preference.id,
        status: 'pendente' 
      })
      .eq('id', agendamentoId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Payment preference created:', preference.id);

    return new Response(JSON.stringify({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in create-mercadopago-payment function:', error);
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