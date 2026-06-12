import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Payload {
  scale_code: string;
  answers: number[];
  force?: boolean;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return jsonResponse({ error: 'Unauthorized' }, 401);
  const user = userData.user;

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!payload?.scale_code || !Array.isArray(payload.answers)) {
    return jsonResponse({ error: 'scale_code e answers são obrigatórios' }, 400);
  }
  if (payload.answers.some((a) => typeof a !== 'number' || !Number.isFinite(a))) {
    return jsonResponse({ error: 'answers deve conter apenas números' }, 400);
  }

  // Fetch scale + items
  const { data: scale, error: scaleErr } = await admin
    .from('emotional_scales')
    .select('*')
    .eq('code', payload.scale_code)
    .eq('active', true)
    .maybeSingle();
  if (scaleErr || !scale) return jsonResponse({ error: 'Escala não encontrada' }, 404);

  const { data: items } = await admin
    .from('emotional_scale_items')
    .select('position')
    .eq('scale_id', scale.id)
    .order('position');
  const expected = items?.length ?? 0;
  if (payload.answers.length !== expected) {
    return jsonResponse({ error: `Esperado ${expected} respostas, recebeu ${payload.answers.length}` }, 400);
  }
  for (const v of payload.answers) {
    if (v < scale.item_min || v > scale.item_max) {
      return jsonResponse({ error: `Valor fora da faixa (${scale.item_min}..${scale.item_max})` }, 400);
    }
  }

  // Frequency check (180 days) unless force + admin
  let isAdmin = false;
  if (payload.force) {
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    isAdmin = !!roles?.some((r) => r.role === 'admin' || r.role === 'super_admin');
  }
  if (!(payload.force && isAdmin)) {
    const since = new Date(Date.now() - scale.frequency_days * 86400_000).toISOString();
    const { data: recent } = await admin
      .from('emotional_scale_responses')
      .select('id, taken_at')
      .eq('user_id', user.id)
      .eq('scale_id', scale.id)
      .gte('taken_at', since)
      .order('taken_at', { ascending: false })
      .limit(1);
    if (recent && recent.length > 0) {
      return jsonResponse(
        {
          error: 'frequency_blocked',
          message: `Você só pode responder esta escala a cada ${scale.frequency_days} dias.`,
          last_taken_at: recent[0].taken_at,
        },
        409,
      );
    }
  }

  // Scoring
  const reverseSet = new Set<number>(scale.reverse_items ?? []);
  let rawScore = 0;
  for (let i = 0; i < payload.answers.length; i++) {
    const pos = i + 1;
    const v = payload.answers[i];
    rawScore += reverseSet.has(pos) ? scale.item_max - v + scale.item_min : v;
  }

  const maxRaw = scale.item_max * payload.answers.length;
  const minRaw = scale.item_min * payload.answers.length;
  const range = maxRaw - minRaw || 1;
  const rawPct = ((rawScore - minRaw) / range) * 100;
  // normalized_score = health-oriented (higher = better)
  const normalized = scale.iseu_direction === 'positive' ? rawPct : 100 - rawPct;

  // Severity by scale
  let severity = 'desconhecido';
  switch (scale.code) {
    case 'WHO5': {
      const who5Raw = rawScore * 4; // 0..100 (sum*4)
      if (who5Raw >= 70) severity = 'ótimo';
      else if (who5Raw >= 50) severity = 'bom';
      else if (who5Raw >= 28) severity = 'baixo';
      else severity = 'muito baixo';
      break;
    }
    case 'PHQ9':
      if (rawScore <= 4) severity = 'mínimo';
      else if (rawScore <= 9) severity = 'leve';
      else if (rawScore <= 14) severity = 'moderado';
      else if (rawScore <= 19) severity = 'moderadamente grave';
      else severity = 'grave';
      break;
    case 'GAD7':
      if (rawScore <= 4) severity = 'mínimo';
      else if (rawScore <= 9) severity = 'leve';
      else if (rawScore <= 14) severity = 'moderado';
      else severity = 'grave';
      break;
    case 'PSS10':
      if (rawScore <= 13) severity = 'baixo';
      else if (rawScore <= 26) severity = 'moderado';
      else severity = 'alto';
      break;
    case 'ISI':
      if (rawScore <= 7) severity = 'sem insônia';
      else if (rawScore <= 14) severity = 'subliminar';
      else if (rawScore <= 21) severity = 'moderada';
      else severity = 'grave';
      break;
  }

  // Insert response as the user (preserves RLS audit)
  const { data: inserted, error: insErr } = await userClient
    .from('emotional_scale_responses')
    .insert({
      user_id: user.id,
      scale_id: scale.id,
      scale_code: scale.code,
      answers: payload.answers,
      raw_score: rawScore,
      normalized_score: Number(normalized.toFixed(2)),
      severity,
    })
    .select()
    .single();

  if (insErr) return jsonResponse({ error: insErr.message }, 500);

  // Recompute ISEU
  const { data: iseu } = await admin.rpc('compute_iseu_score', { _user_id: user.id });

  return jsonResponse({
    response: inserted,
    iseu: iseu ?? null,
  });
});
