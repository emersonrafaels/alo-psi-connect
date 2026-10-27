import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { Resend } from 'npm:resend@2.0.0';
import { canSend, emailableRecipients, expandUnits, type Audience } from './audience.ts';

const uuid = z.string().uuid();
const audienceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.literal('institutions'), institutionIds: z.array(uuid).max(500).optional() }),
  z.object({ kind: z.literal('users'), userIds: z.array(uuid).min(1).max(1000) }),
  z.object({ kind: z.literal('students'), institutionId: uuid }),
  z.object({ kind: z.literal('units'), institutionId: uuid, unitIds: z.array(uuid).min(1).max(500) }),
  z.object({ kind: z.literal('student_ids'), institutionId: uuid, patientIds: z.array(uuid).min(1).max(5000) }),
]);
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('preview'), audience: audienceSchema }),
  z.object({
    action: z.literal('send'), audience: audienceSchema,
    subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(5000),
    sendEmail: z.boolean().default(false),
  }),
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

type Recipient = { userId: string; patientId: string | null };

async function pageAll<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q(from, from + 999);
    if (error) throw new Error('Falha ao buscar destinatários.');
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

async function chunked<T, R>(ids: string[], fn: (part: string[]) => Promise<R[]>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < ids.length; i += 300) out.push(...(await fn(ids.slice(i, i + 300))));
  return out;
}

async function patientsToRecipients(db: any, patientIds: string[]): Promise<Recipient[]> {
  const pac = await chunked(patientIds, async (p) => (await db.from('pacientes').select('id, profile_id').in('id', p)).data ?? []);
  const profileIds = pac.map((r: any) => r.profile_id).filter(Boolean);
  const profs = await chunked(profileIds, async (p) => (await db.from('profiles').select('id, user_id').in('id', p)).data ?? []);
  const userByProfile = new Map(profs.map((p: any) => [p.id, p.user_id]));
  return pac.map((r: any) => ({ userId: userByProfile.get(r.profile_id), patientId: r.id })).filter((r: any) => r.userId);
}

async function resolve(db: any, a: Audience, senderId: string): Promise<Recipient[]> {
  let list: Recipient[] = [];
  if (a.kind === 'all') {
    const rows = await pageAll<any>((f, t) => db.from('profiles').select('user_id').not('user_id', 'is', null).range(f, t));
    list = rows.map((r) => ({ userId: r.user_id, patientId: null }));
  } else if (a.kind === 'institutions') {
    const rows = await pageAll<any>((f, t) => {
      let q = db.from('institution_users').select('user_id').eq('is_active', true);
      if (a.institutionIds?.length) q = q.in('institution_id', a.institutionIds);
      return q.range(f, t);
    });
    list = rows.map((r) => ({ userId: r.user_id, patientId: null }));
  } else if (a.kind === 'users') {
    list = a.userIds.map((u) => ({ userId: u, patientId: null }));
  } else {
    let patientIds: string[];
    if (a.kind === 'students') {
      const rows = await pageAll<any>((f, t) => db.from('patient_institutions').select('patient_id').eq('institution_id', a.institutionId).range(f, t));
      patientIds = rows.map((r) => r.patient_id);
    } else if (a.kind === 'units') {
      const units = await pageAll<any>((f, t) => db.from('institution_academic_units').select('id, parent_id').eq('institution_id', a.institutionId).range(f, t));
      const set = expandUnits(a.unitIds, units);
      const pl = await pageAll<any>((f, t) => db.from('patient_institution_placements').select('patient_id, class_unit_id').eq('institution_id', a.institutionId).range(f, t));
      patientIds = pl.filter((p) => set.has(p.class_unit_id)).map((p) => p.patient_id);
    } else {
      // Only students actually linked to this institution.
      const linked = await chunked(a.patientIds, async (p) =>
        (await db.from('patient_institutions').select('patient_id').eq('institution_id', a.institutionId).in('patient_id', p)).data ?? []);
      patientIds = linked.map((r: any) => r.patient_id);
    }
    list = await patientsToRecipients(db, [...new Set(patientIds)]);
  }
  const seen = new Set<string>();
  return list.filter((r) => r.userId && r.userId !== senderId && !seen.has(r.userId) && seen.add(r.userId));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'Não autenticado' }, 401);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: 'Não autenticado' }, 401);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const input = parsed.data;
    const audience = input.audience as Audience;

    const [{ data: roles }, { data: memberships }] = await Promise.all([
      db.from('user_roles').select('role').eq('user_id', user.id),
      db.from('institution_users').select('institution_id').eq('user_id', user.id).eq('is_active', true),
    ]);
    const rights = {
      isPlatformAdmin: (roles ?? []).some((r: any) => r.role === 'admin' || r.role === 'super_admin'),
      institutionIds: (memberships ?? []).map((m: any) => m.institution_id),
    };
    if (!canSend(rights, audience)) return json({ error: 'Você não tem permissão para enviar para este público.' }, 403);

    const recipients = await resolve(db, audience, user.id);
    if (input.action === 'preview') return json({ count: recipients.length });
    if (!recipients.length) return json({ error: 'Nenhum destinatário com conta ativa neste público.' }, 400);

    const institutionId = 'institutionId' in audience ? audience.institutionId : null;
    const { data: msg, error: mErr } = await db.from('messages').insert({
      sender_id: user.id, institution_id: institutionId, audience: audience.kind, audience_filter: audience,
      subject: input.subject, body: input.body, send_email: input.sendEmail, recipient_count: recipients.length,
    }).select('id').single();
    if (mErr) throw mErr;

    for (let i = 0; i < recipients.length; i += 500) {
      const { error } = await db.from('message_threads').insert(recipients.slice(i, i + 500).map((r) => ({
        message_id: msg.id, sender_id: user.id, recipient_id: r.userId, recipient_patient_id: r.patientId,
        institution_id: institutionId, sender_read_at: new Date().toISOString(),
      })));
      if (error) throw error;
    }

    let emailed = 0;
    if (input.sendEmail && Deno.env.get('RESEND_API_KEY')) {
      const { data: synth } = await db.from('synthetic_student_cases').select('user_id, notifications_blocked');
      let isDemo = false;
      if (institutionId) {
        const { data: inst } = await db.from('educational_institutions').select('is_demo').eq('id', institutionId).maybeSingle();
        isDemo = !!inst?.is_demo;
      }
      const targets = emailableRecipients(recipients.map((r) => r.userId), synth ?? [], isDemo);
      const profs = await chunked(targets, async (p) => (await db.from('profiles').select('email').in('user_id', p)).data ?? []);
      const emails = [...new Set(profs.map((p: any) => p.email).filter((e: string) => e && !/demo|sintetic|example\./i.test(e)))];
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const html = `<div style="font-family:sans-serif;max-width:560px">
        <h2 style="color:#5B218E">${esc(input.subject)}</h2>
        <p style="white-space:pre-wrap">${esc(input.body)}</p>
        <p><a href="https://redebemestar.com.br/mensagens" style="background:#5B218E;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Ver e responder no site</a></p>
        <p style="color:#888;font-size:12px">Rede Bem-Estar · Conectando você ao cuidado</p></div>`;
      for (let i = 0; i < emails.length; i += 50) {
        const part = emails.slice(i, i + 50);
        const { error } = await resend.batch.send(part.map((to) => ({
          from: 'Rede Bem-Estar <noreply@redebemestar.com.br>', to: [to], subject: input.subject, html,
        })));
        if (error) console.error('email batch failed', error); else emailed += part.length;
      }
    }
    return json({ ok: true, messageId: msg.id, count: recipients.length, emailed });
  } catch (e) {
    console.error(e);
    return json({ error: 'Não foi possível enviar a mensagem. Tente novamente.' }, 500);
  }
});
