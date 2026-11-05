import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { Resend } from 'npm:resend@2.0.0';
import { renderMessageEmail } from './emailTemplate.ts';

const RBE_EMAIL = 'redebemestar1@gmail.com';
const schema = z.object({
  origin: z.string().trim().max(40).default('apoio'),
  message: z.string().trim().max(1000).default(''),
  identified: z.boolean().default(false),
});
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);
    const url = Deno.env.get('SUPABASE_URL')!;
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await asUser.auth.getClaims(auth.replace('Bearer ', ''));
    const userId = claims?.claims?.sub;
    if (!userId) return json({ error: 'Não autenticado' }, 401);

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { origin, message, identified } = parsed.data;

    const { data: reqId, error: rErr } = await asUser.rpc('open_care_request', { p_origin: origin, p_message: message, p_identified: identified });
    if (rErr) throw rErr;
    if (!reqId) return json({ ok: true, linked: false });

    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: cr } = await db.from('care_requests').select('id, patient_id, institution_id, thread_id, is_synthetic').eq('id', reqId).single();
    if (cr.thread_id) return json({ ok: true, linked: true, reused: true });

    const [{ data: admins }, { data: inst }, { data: prof }, { data: synth }] = await Promise.all([
      db.from('institution_users').select('user_id').eq('institution_id', cr.institution_id).eq('is_active', true),
      db.from('educational_institutions').select('name, is_demo').eq('id', cr.institution_id).maybeSingle(),
      db.from('profiles').select('nome, email').eq('user_id', userId).maybeSingle(),
      db.from('synthetic_student_cases').select('user_id').eq('user_id', userId).maybeSingle(),
    ]);
    const adminIds = [...new Set((admins ?? []).map((a: any) => a.user_id).filter((u: string) => u && u !== userId))];
    const who = identified && prof?.nome ? prof.nome : 'Um aluno (anônimo)';
    const subject = 'Pedido de apoio';
    const body = `${who} pediu apoio à equipe de cuidado.\n\n${message ? `Mensagem do aluno:\n"${message}"` : 'O aluno não deixou mensagem e prefere conversar diretamente.'}\n\nResponda pela área de Mensagens ou acompanhe no Portal institucional: https://redebemestar.com.br/portal-institucional`;

    let firstThread: string | null = null;
    if (adminIds.length) {
      const { data: msg, error: mErr } = await db.from('messages').insert({
        sender_id: userId, institution_id: cr.institution_id, audience: 'support_request',
        audience_filter: { kind: 'support_request', careRequestId: cr.id }, subject, body, send_email: true, recipient_count: adminIds.length,
      }).select('id').single();
      if (mErr) throw mErr;
      const { data: threads, error: tErr } = await db.from('message_threads').insert(adminIds.map((a) => ({
        message_id: msg.id, sender_id: userId, recipient_id: a, recipient_patient_id: null,
        institution_id: cr.institution_id, sender_read_at: new Date().toISOString(), recipient_identified: identified,
      }))).select('id');
      if (tErr) throw tErr;
      firstThread = threads?.[0]?.id ?? null;
      await db.from('care_requests').update({ thread_id: firstThread }).eq('id', cr.id);
    }

    let emailed = 0;
    const blocked = cr.is_synthetic || inst?.is_demo || !!synth;
    if (!blocked && Deno.env.get('RESEND_API_KEY')) {
      const { data: profs } = adminIds.length ? await db.from('profiles').select('email').in('user_id', adminIds) : { data: [] };
      const emails = [...new Set([...(profs ?? []).map((p: any) => p.email).filter(Boolean), RBE_EMAIL])];
      const { html, text } = renderMessageEmail({ subject: `${subject} · ${inst?.name ?? 'Instituição'}`, body, senderName: inst?.name ?? 'Rede Bem-Estar', fromInstitution: false });
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const { error } = await resend.batch.send(emails.map((to) => ({
        from: 'Rede Bem-Estar <noreply@redebemestar.com.br>', to: [to], subject: `${subject} · ${inst?.name ?? ''}`.trim(), html, text,
      })));
      if (error) console.error('email failed', error); else emailed = emails.length;
    }
    return json({ ok: true, linked: true, notified: adminIds.length, emailed });
  } catch (e) {
    console.error(e);
    return json({ error: 'Não foi possível enviar seu pedido agora.' }, 500);
  }
});
