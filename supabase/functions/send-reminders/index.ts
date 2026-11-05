// Daily opt-in reminder emails for students (profiles.email_reminders = true).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';
import { buildReminders, semesterOf, texts } from './rules.ts';
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json({ error: 'email not configured' }, 500);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date();
  const cutoff = new Date(now.getTime() - 20 * 3_600_000).toISOString();
  const { data: profs } = await db.from('profiles').select('user_id, email, nome, preferred_language, last_reminder_at')
    .eq('email_reminders', true).eq('tipo_usuario', 'paciente').or(`last_reminder_at.is.null,last_reminder_at.lt.${cutoff}`).limit(500);
  const { data: blocked } = await db.from('synthetic_student_cases').select('user_id').eq('notifications_blocked', true);
  const skip = new Set((blocked ?? []).map((b: any) => b.user_id));
  const resend = new Resend(key);
  const today = now.toISOString().slice(0, 10);
  const sem = semesterOf(now);
  let sent = 0;
  for (const p of profs ?? []) {
    if (!p.email || skip.has(p.user_id) || /demo|sintetic|example\./i.test(p.email)) continue;
    const [diary, radar, regs] = await Promise.all([
      db.from('mood_entries').select('date').eq('user_id', p.user_id).order('date', { ascending: false }).limit(1),
      db.from('permanence_responses').select('semester').eq('user_id', p.user_id),
      db.from('group_session_registrations').select('group_sessions(title, session_date)').eq('user_id', p.user_id).neq('status', 'cancelled'),
    ]);
    const sessionsToday = (regs.data ?? []).map((r: any) => r.group_sessions).filter((s: any) => s?.session_date === today).map((s: any) => s.title);
    const items = buildReminders({ now, lastDiary: diary.data?.[0]?.date ?? null, radarSemesters: (radar.data ?? []).map((r: any) => r.semester), semester: sem, sessionsToday }, p.preferred_language);
    if (!items.length) continue;
    const t = texts(p.preferred_language);
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1f2937">
      <h2 style="color:#0f766e">Rede Bem-Estar</h2><ul>${items.map((i) => `<li style="margin:8px 0">${escapeHtml(i)}</li>`).join('')}</ul>
      <p><a href="https://redebemestar.com.br/meu-espaco" style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${t.cta}</a></p>
      <p style="font-size:12px;color:#6b7280">${t.off}</p></div>`;
    const { error } = await resend.emails.send({ from: 'Rede Bem-Estar <noreply@redebemestar.com.br>', to: [p.email], subject: t.subject, html, text: `${items.join('\n')}\n\nhttps://redebemestar.com.br/meu-espaco\n${t.off}` });
    if (error) { console.error('reminder failed', error); continue; }
    await db.from('profiles').update({ last_reminder_at: now.toISOString() }).eq('user_id', p.user_id);
    sent++;
  }
  return json({ ok: true, sent });
});
