import { requireServiceOrAdmin, authErrorResponse } from '../_shared/guards.ts';
import { managedResend } from '../_shared/managed-email.ts';
// Daily opt-in reminder emails for students (profiles.email_reminders = true).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { renderReminderEmail } from './emailTemplate.ts';
import { buildReminderItems, isDueNow, normalizePrefs, semesterOf } from './rules.ts';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const __guardDb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let __svc: unknown;
  try { __svc = (await requireServiceOrAdmin(req, __guardDb)) === null; } catch (e) {
    const r = authErrorResponse(e, corsHeaders); if (r) return r; throw e;
  }
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json({ error: 'email not configured' }, 500);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date();
  const cutoff = new Date(now.getTime() - 20 * 3_600_000).toISOString();
  // Admin-only test mode: { test_email } sends that student's current reminders now, without touching schedule.
  let testEmail: string | null = null;
  try { const b = await req.clone().json(); testEmail = typeof b?.test_email === 'string' ? b.test_email.trim().toLowerCase() : null; } catch { /* cron call */ }
  if (testEmail) {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: u } = await db.auth.getUser(token);
    const { data: roles } = u?.user ? await db.from('user_roles').select('role').eq('user_id', u.user.id) : { data: [] };
    if (!(roles ?? []).some((r: any) => r.role === 'admin')) return json({ error: 'forbidden' }, 403);
  }
  const base = db.from('profiles').select('user_id, email, nome, preferred_language, last_reminder_at, reminder_prefs');
  const { data: profs } = testEmail ? await base.ilike('email', testEmail).limit(1)
    : await base.eq('email_reminders', true).eq('tipo_usuario', 'paciente').or(`last_reminder_at.is.null,last_reminder_at.lt.${cutoff}`).limit(1000);
  const { data: blocked } = await db.from('synthetic_student_cases').select('user_id').eq('notifications_blocked', true);
  const skip = new Set((blocked ?? []).map((b: any) => b.user_id));
  const resend = managedResend('reminders', key);
  const today = new Date(now.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
  const sem = semesterOf(now);
  let sent = 0;
  for (const p of profs ?? []) {
    const prefs = normalizePrefs(p.reminder_prefs);
    if (!testEmail && !isDueNow(prefs, now, p.last_reminder_at)) continue;
    if (!p.email || skip.has(p.user_id) || /demo|sintetic|example\./i.test(p.email)) continue;
    const [diary, radar, regs] = await Promise.all([
      db.from('mood_entries').select('date').eq('user_id', p.user_id).order('date', { ascending: false }).limit(1),
      db.from('permanence_responses').select('semester').eq('user_id', p.user_id),
      db.from('group_session_registrations').select('group_sessions(title, session_date)').eq('user_id', p.user_id).neq('status', 'cancelled'),
    ]);
    const sessionsToday = (regs.data ?? []).map((r: any) => r.group_sessions).filter((s: any) => s?.session_date === today).map((s: any) => s.title);
    const items = buildReminderItems({ now, lastDiary: diary.data?.[0]?.date ?? null, radarSemesters: (radar.data ?? []).map((r: any) => r.semester), semester: sem, sessionsToday }, p.preferred_language, prefs);
    if (!items.length) { if (testEmail) return json({ ok: true, sent: 0, reason: 'no pending reminders' }); continue; }
    const mail = renderReminderEmail({ lang: p.preferred_language, name: p.nome, items });
    const { error } = await resend.emails.send({ from: 'Rede Bem-Estar <noreply@redebemestar.com.br>', to: [p.email], subject: mail.subject, html: mail.html, text: mail.text });
    if (error) { console.error('reminder failed', error); continue; }
    if (testEmail) return json({ ok: true, sent: 1, items: items.map((i) => i.text) });
    await db.from('profiles').update({ last_reminder_at: now.toISOString() }).eq('user_id', p.user_id);
    sent++;
  }
  return json({ ok: true, sent });
});
