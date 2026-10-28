import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pickBestPayment } from "../_shared/mercadopagoStatus.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Re-checks pending appointments against Mercado Pago and replays the webhook for found payments.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (p: unknown, status = 200) =>
    new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!token) return json({ error: 'MERCADO_PAGO_ACCESS_TOKEN missing' }, 500);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let days = 7;
    try { const b = await req.json(); if (Number(b?.days) > 0 && Number(b.days) <= 60) days = Number(b.days); } catch { /* default */ }
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: pending, error } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('payment_status', 'pending_payment')
      .not('mercado_pago_preference_id', 'is', null)
      .gte('created_at', since)
      .limit(200);
    if (error) throw error;

    const results: any[] = [];
    for (const a of pending ?? []) {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${a.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[sync] search failed ${a.id} [${res.status}]: ${text}`);
        results.push({ id: a.id, error: res.status, details: text.slice(0, 200) });
        continue;
      }
      const best = pickBestPayment(((await res.json()).results ?? []) as any[]);
      if (!best) { results.push({ id: a.id, payment: null }); continue; }
      const hook = await fetch(`${supabaseUrl}/functions/v1/mercadopago-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payment', data: { id: best.id } }),
      });
      await hook.text();
      results.push({ id: a.id, payment: best.id, mp_status: best.status });
    }
    console.log('[sync] results', JSON.stringify(results));
    return json({ checked: pending?.length ?? 0, results });
  } catch (e) {
    console.error('[sync] error', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
