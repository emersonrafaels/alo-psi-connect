import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PAIN_LABELS: Record<string, string> = {
  mental_health: 'Saúde mental dos alunos',
  evasion: 'Evasão e permanência',
  faculty: 'Formação e escuta docente',
  data: 'Falta de dados sobre bem-estar',
  engagement: 'Baixa adesão a iniciativas',
  crisis: 'Gestão de crises e risco',
  diversity: 'Inclusão e diversidade',
  reputation: 'Reputação institucional',
};

const MATURITY_LABELS: Record<string, string> = {
  listening: 'Escuta ativa',
  prevention: 'Prevenção',
  care: 'Cuidado direto',
  faculty: 'Rede docente',
  data: 'Dados e decisão',
  culture: 'Cultura institucional',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { diagnostic_id } = await req.json();
    if (!diagnostic_id) {
      return new Response(JSON.stringify({ error: 'diagnostic_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: diag, error: fErr } = await supabase
      .from('institution_radar_diagnostics')
      .select('*, educational_institutions(name, type)')
      .eq('id', diagnostic_id)
      .single();
    if (fErr || !diag) throw new Error(fErr?.message ?? 'Diagnostic not found');

    const overall = Number(diag.overall_score ?? 0);
    const pains = (diag.pains ?? []) as string[];
    const priorities = (diag.priorities ?? {}) as Record<string, string>;
    const maturity = (diag.maturity ?? {}) as Record<string, number>;
    const structures = (diag.structures ?? {}) as Record<string, string>;
    const institutionName =
      (diag as any).educational_institutions?.name ??
      (diag as any).submitted_institution_name ??
      diag.institution_snapshot?.name ??
      'sua instituição';

    const painsBlock = pains.map(p => `- ${PAIN_LABELS[p] ?? p} (urgência: ${priorities[p] ?? 'não definida'})`).join('\n');
    const maturityBlock = Object.entries(maturity).map(([k, v]) => `- ${MATURITY_LABELS[k] ?? k}: ${v}/100`).join('\n');
    const structuresBlock = Object.entries(structures).map(([k, v]) => `- ${k}: ${v}`).join('\n');

    const prompt = `Você é um consultor sênior da Rede Bem-Estar especializado em bem-estar estudantil e maturidade institucional em IES brasileiras. Analise o diagnóstico abaixo e produza uma devolutiva consultiva, humana e acionável em português do Brasil.

INSTITUIÇÃO: ${institutionName}
Score geral de maturidade: ${overall}/100

DESAFIOS PRIORITÁRIOS:
${painsBlock}

MATURIDADE POR DIMENSÃO:
${maturityBlock}

ESTRUTURAS EXISTENTES:
${structuresBlock}

Retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem \`\`\`) com este formato:
{
  "headline": "frase única, poderosa, começando com o nome ou algo específico da IES, resumindo em 1 linha onde ela está (ex.: 'Sua instituição possui boas iniciativas, mas ainda atua de forma reativa.').",
  "strategic_reading": {
    "summary": "parágrafo de 2-3 frases posicionando a IES no radar de maturidade e apontando a tensão principal.",
    "insights": [
      {"title": "titulo curto", "description": "insight específico ligado aos dados"},
      {"title": "...", "description": "..."},
      {"title": "...", "description": "..."}
    ]
  },
  "recommendations": [
    {"title": "ação curta e específica", "description": "descrição prática de 1-2 frases", "horizon": "30 dias"},
    {"title": "...", "description": "...", "horizon": "90 dias"},
    {"title": "...", "description": "...", "horizon": "6 meses"}
  ]
}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um consultor educacional sênior. Sempre responde apenas JSON válido, sem markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`AI Gateway ${aiRes.status}: ${txt}`);
    }
    const aiData = await aiRes.json();
    let content: string = aiData.choices?.[0]?.message?.content ?? '{}';
    content = content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch {
      parsed = {
        headline: 'Diagnóstico registrado com sucesso.',
        strategic_reading: { summary: content, insights: [] },
        recommendations: [],
      };
    }

    const { data: updated, error: uErr } = await supabase
      .from('institution_radar_diagnostics')
      .update({
        headline: parsed.headline ?? null,
        strategic_reading: parsed.strategic_reading ?? null,
        recommendations: parsed.recommendations ?? [],
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', diagnostic_id)
      .select('*')
      .single();
    if (uErr) throw uErr;

    // Notifica administradores (fire-and-forget)
    try {
      await supabase.functions.invoke('notify-radar-submitted', {
        body: { diagnostic_id },
      });
    } catch (e) {
      console.error('[radar-institutional-analyze] notify failed:', e);
    }

    return new Response(JSON.stringify({ ok: true, diagnostic: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[radar-institutional-analyze]', e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
