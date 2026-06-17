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

  // Frequency check (180 days) unless force + admin, or email is whitelisted
  let isAdmin = false;
  if (payload.force) {
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    isAdmin = !!roles?.some((r) => r.role === 'admin' || r.role === 'super_admin');
  }

  // Check email whitelist (bypass frequency block)
  let emailBypass = false;
  if (user.email) {
    const { data: cfg } = await admin
      .from('system_configurations')
      .select('value')
      .eq('category', 'emotional_scales')
      .eq('key', 'frequency_bypass_emails')
      .is('tenant_id', null)
      .maybeSingle();
    if (cfg?.value) {
      try {
        const raw = typeof cfg.value === 'string' ? JSON.parse(cfg.value) : cfg.value;
        const list: string[] = Array.isArray(raw) ? raw : [];
        emailBypass = list.map((e) => e.toLowerCase()).includes(user.email.toLowerCase());
      } catch {
        emailBypass = false;
      }
    }
  }

  if (!(payload.force && isAdmin) && !emailBypass) {
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
  const scored: number[] = payload.answers.map((v, i) =>
    reverseSet.has(i + 1) ? scale.item_max - v + scale.item_min : v,
  );
  const rawScore = scored.reduce((a, b) => a + b, 0);

  const maxRaw = scale.item_max * payload.answers.length;
  const minRaw = scale.item_min * payload.answers.length;
  const range = maxRaw - minRaw || 1;
  const rawPct = ((rawScore - minRaw) / range) * 100;
  // normalized_score = health-oriented (higher = better)
  const normalized = scale.iseu_direction === 'positive' ? rawPct : 100 - rawPct;

  // Subscales (when declared in the scale)
  let subscaleScores: Record<string, { label: string; raw: number; normalized: number }> | null = null;
  if (scale.subscales && typeof scale.subscales === 'object') {
    subscaleScores = {};
    for (const [key, def] of Object.entries(scale.subscales as Record<string, { label: string; items: number[] }>)) {
      const positions = def.items ?? [];
      if (positions.length === 0) continue;
      const sub = positions.reduce((acc, p) => acc + (scored[p - 1] ?? 0), 0);
      const subMax = scale.item_max * positions.length;
      const subMin = scale.item_min * positions.length;
      const subRange = subMax - subMin || 1;
      const subPct = ((sub - subMin) / subRange) * 100;
      const subNorm = scale.iseu_direction === 'positive' ? subPct : 100 - subPct;
      subscaleScores[key] = {
        label: def.label,
        raw: sub,
        normalized: Number(subNorm.toFixed(2)),
      };
    }
  }

  // Severity by scale
  let severity = 'desconhecido';
  switch (scale.code) {
    case 'WHO5': {
      // Raw 0..25 — cutoffs ~ <13 (baixo bem-estar) e <50/100 (muito baixo)
      if (rawScore >= 18) severity = 'adequado';
      else if (rawScore >= 13) severity = 'baixo';
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
      if (rawScore <= 4) severity = 'mínima';
      else if (rawScore <= 9) severity = 'leve';
      else if (rawScore <= 14) severity = 'moderada';
      else severity = 'severa';
      break;
    case 'PSS10':
      if (rawScore <= 13) severity = 'baixo';
      else if (rawScore <= 26) severity = 'moderado';
      else severity = 'alto';
      break;
    case 'ISI':
      if (rawScore <= 7) severity = 'sem insônia significativa';
      else if (rawScore <= 14) severity = 'subliminar';
      else if (rawScore <= 21) severity = 'moderada';
      else severity = 'severa';
      break;
    case 'MHCSF': {
      // Keyes classification: counts of "high" (4-5) and "low" (0-1) frequency answers
      const emoPositions = [1, 2, 3];
      const socPsyPositions = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      const highEmo = emoPositions.filter((p) => scored[p - 1] >= 4).length;
      const lowEmo = emoPositions.filter((p) => scored[p - 1] <= 1).length;
      const highSocPsy = socPsyPositions.filter((p) => scored[p - 1] >= 4).length;
      const lowSocPsy = socPsyPositions.filter((p) => scored[p - 1] <= 1).length;
      if (highEmo >= 1 && highSocPsy >= 6) severity = 'florescimento';
      else if (lowEmo >= 1 && lowSocPsy >= 6) severity = 'definhamento';
      else severity = 'moderado';
      break;
    }
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
      subscale_scores: subscaleScores,
    })
    .select()
    .single();

  if (insErr) return jsonResponse({ error: insErr.message }, 500);

  // Recompute ISEU (returns null when user hasn't answered all required scales yet)
  const { data: iseu } = await admin.rpc('compute_iseu_score', { _user_id: user.id });

  // Compute missing scales for UI feedback when ISEU isn't ready yet
  let missingScales: string[] = [];
  if (!iseu) {
    const { data: activeScales } = await admin
      .from('emotional_scales')
      .select('code')
      .eq('active', true)
      .gt('iseu_weight', 0);
    const since = new Date(Date.now() - 180 * 86400_000).toISOString();
    const { data: answered } = await admin
      .from('emotional_scale_responses')
      .select('scale_code')
      .eq('user_id', user.id)
      .gte('taken_at', since);
    const answeredSet = new Set((answered ?? []).map((r: any) => r.scale_code));
    missingScales = (activeScales ?? [])
      .map((s: any) => s.code)
      .filter((code: string) => !answeredSet.has(code));
  }

  return jsonResponse({
    response: inserted,
    iseu: iseu ?? null,
    missing_scales: missingScales,
  });
});
