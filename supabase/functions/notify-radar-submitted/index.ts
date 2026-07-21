import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@4.0.0';

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

const SITE = 'https://redebemestar.com.br';

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

    const { data: diag, error: dErr } = await supabase
      .from('institution_radar_diagnostics')
      .select('*, educational_institutions(name)')
      .eq('id', diagnostic_id)
      .single();
    if (dErr || !diag) throw new Error(dErr?.message ?? 'Diagnóstico não encontrado');

    if (diag.notified_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_notified' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar admins
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    const adminIds = (adminRoles ?? []).map((r: any) => r.user_id);
    if (adminIds.length === 0) {
      console.warn('[notify-radar-submitted] Sem administradores cadastrados');
      return new Response(JSON.stringify({ ok: true, recipients: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, nome')
      .in('user_id', adminIds);

    const recipients = (profiles ?? [])
      .map((p: any) => p.email)
      .filter((e: string | null): e is string => !!e && e.includes('@'));

    if (recipients.length === 0) {
      console.warn('[notify-radar-submitted] Admins sem email');
      return new Response(JSON.stringify({ ok: true, recipients: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isPublic = diag.submission_source === 'public';
    const institutionName =
      (diag as any).educational_institutions?.name ??
      diag.submitted_institution_name ??
      diag.institution_snapshot?.name ??
      'Instituição sem nome';

    const adminLink = `${SITE}/admin/radar-institucional/${diag.id}`;
    const publicLink = diag.public_access_token
      ? `${SITE}/radar-institucional/resultado/${diag.public_access_token}`
      : null;

    const pains = Array.isArray(diag.pains) ? diag.pains.slice(0, 3) : [];
    const priorities = (diag.priorities ?? {}) as Record<string, string>;
    const painsHtml = pains.length
      ? `<ul style="margin:8px 0 0;padding-left:20px;color:#374151;">${pains
          .map((p: string) => `<li>${PAIN_LABELS[p] ?? p}${priorities[p] ? ` <span style="color:#6b7280;">(urgência: ${priorities[p]})</span>` : ''}</li>`)
          .join('')}</ul>`
      : '<p style="color:#6b7280;margin:8px 0 0;">—</p>';

    const score = diag.overall_score ?? '—';
    const headline = diag.headline
      ? `<p style="margin:12px 0 0;padding:12px 16px;background:#f5f3ff;border-left:4px solid #7c3aed;color:#3f3f46;font-style:italic;">"${diag.headline}"</p>`
      : '';

    const respondent = `
      <p style="margin:4px 0;color:#374151;"><strong>${diag.respondent_name ?? '—'}</strong>${diag.respondent_role ? ` · ${diag.respondent_role}` : ''}</p>
      ${diag.respondent_email ? `<p style="margin:2px 0;color:#6b7280;font-size:13px;">${diag.respondent_email}${diag.respondent_phone ? ` · ${diag.respondent_phone}` : ''}</p>` : ''}
    `;

    const badge = isPublic
      ? '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;">Submissão pública</span>'
      : '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:12px;font-weight:600;">Instituição vinculada</span>';

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="margin:0;font-size:22px;color:#111827;">🎯 Novo Radar Institucional preenchido</h1>
          <p style="margin:6px 0 0;color:#6b7280;font-size:14px;">Rede Bem-Estar</p>
        </div>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
            <h2 style="margin:0;font-size:18px;">${institutionName}</h2>
            ${badge}
          </div>
          <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Score geral de maturidade: <strong style="color:#7c3aed;font-size:16px;">${score}/100</strong> · v${diag.version ?? 1}</p>
          ${headline}
        </div>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;">
          <h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Respondente</h3>
          ${respondent}
        </div>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
          <h3 style="margin:0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Principais dores</h3>
          ${painsHtml}
        </div>

        <div style="text-align:center;margin-bottom:16px;">
          <a href="${adminLink}" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Ver diagnóstico completo</a>
        </div>

        ${publicLink ? `<p style="text-align:center;color:#9ca3af;font-size:12px;margin:0;">Link público do respondente: <a href="${publicLink}" style="color:#7c3aed;">${publicLink}</a></p>` : ''}
      </div>
    `;

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const subject = `🎯 Novo Radar Institucional: ${institutionName}`;

    const results = await Promise.allSettled(
      recipients.map((to) =>
        resend.emails.send({
          from: 'Rede Bem-Estar <noreply@redebemestar.com.br>',
          to: [to],
          subject,
          html,
        }),
      ),
    );

    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    if (failed > 0) console.error('[notify-radar-submitted] Falhas:', results.filter(r => r.status === 'rejected'));

    await supabase
      .from('institution_radar_diagnostics')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', diagnostic_id);

    return new Response(JSON.stringify({ ok: true, recipients: ok, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[notify-radar-submitted]', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
