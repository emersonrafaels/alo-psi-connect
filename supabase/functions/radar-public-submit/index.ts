import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { answers, institution } = body ?? {};
    if (!answers || !institution?.name || !answers?.respondent?.email || !answers?.respondent?.name) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios ausentes (instituição, nome e e-mail do respondente).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!answers.consent) {
      return new Response(
        JSON.stringify({ error: 'Consentimento LGPD é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Rate-limit leve por IP (últimas 24h, máx 3)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    if (ip !== 'unknown') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('institution_radar_diagnostics')
        .select('id', { count: 'exact', head: true })
        .eq('submission_source', 'public')
        .gte('created_at', since)
        .contains('institution_snapshot', { _ip: ip });
      if ((count ?? 0) >= 3) {
        return new Response(
          JSON.stringify({ error: 'Limite de submissões atingido. Tente novamente em 24h.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // computeOverallScore inline
    const maturityVals = Object.values(answers.maturity ?? {}) as number[];
    const overall_score = maturityVals.length
      ? Math.round(maturityVals.reduce((a, b) => a + b, 0) / maturityVals.length)
      : 0;

    const token = crypto.randomUUID();

    const row = {
      institution_id: null,
      submission_source: 'public',
      public_access_token: token,
      submitted_institution_name: institution.name,
      submitted_institution_type: institution.type ?? null,
      submitted_institution_city: institution.city ?? null,
      submitted_institution_state: institution.state ?? null,
      submitted_institution_website: institution.website ?? null,
      respondent_name: answers.respondent.name ?? null,
      respondent_role: answers.respondent.role ?? null,
      respondent_area: answers.respondent.area ?? null,
      respondent_email: answers.respondent.email ?? null,
      respondent_phone: answers.respondent.phone ?? null,
      institution_snapshot: { name: institution.name, ...answers.institution, _ip: ip },
      structures: answers.structures ?? {},
      pains: answers.pains ?? [],
      adaptive_answers: answers.adaptive ?? {},
      maturity: answers.maturity ?? {},
      priorities: answers.priorities ?? {},
      consent_given: !!answers.consent,
      overall_score,
      status: 'draft',
      version: 1,
    };

    const { data: inserted, error: insErr } = await supabase
      .from('institution_radar_diagnostics')
      .insert(row)
      .select('id, public_access_token')
      .single();
    if (insErr) throw insErr;

    // Dispara análise (não bloqueia se falhar — o resultado ainda pode ser visto como rascunho)
    try {
      await supabase.functions.invoke('radar-institutional-analyze', {
        body: { diagnostic_id: inserted.id },
      });
    } catch (e) {
      console.error('[radar-public-submit] analyze failed:', e);
    }

    return new Response(
      JSON.stringify({ ok: true, id: inserted.id, token: inserted.public_access_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('[radar-public-submit]', e);
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
