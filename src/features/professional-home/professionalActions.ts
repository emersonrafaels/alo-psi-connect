// Pure rules for the professional "Meu espaço".
export interface ProAction { id: string; title: string; description: string; path: string; cta: string; priority: 1 | 2 | 3 }
export interface ProProfile {
  foto_perfil_url?: string | null; resumo?: string | null; resumo_profissional?: string | null;
  preco_consulta?: number | null; tempo_consulta?: number | null; formacao_raw?: string | null; formacao_normalizada?: unknown;
  crp_crm?: string | null; pix?: string | null; conta?: string | null;
}
export interface Appt { data_consulta: string; horario: string | null; payment_status: string | null; status?: string | null; valor?: number | null; meeting_link?: string | null }
export interface ProInput { now: Date; profile: ProProfile; hasSchedule: boolean; appts: Appt[]; nextSessionAt: string | null; unreadMessages: number }

const DAY = 86_400_000;
export const apptAt = (a: Appt) => new Date(`${a.data_consulta}T${(a.horario ?? '00:00').slice(0, 5)}:00`);
const filled = (v: unknown) => v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === '') && !(Array.isArray(v) && v.length === 0);

export const PROFILE_FIELDS: { key: string; label: string; ok: (p: ProProfile) => boolean }[] = [
  { key: 'foto', label: 'foto', ok: p => filled(p.foto_perfil_url) },
  { key: 'resumo', label: 'resumo', ok: p => filled(p.resumo_profissional) || filled(p.resumo) },
  { key: 'preco', label: 'preço', ok: p => Number(p.preco_consulta) > 0 },
  { key: 'tempo', label: 'tempo de consulta', ok: p => Number(p.tempo_consulta) > 0 },
  { key: 'formacao', label: 'formação', ok: p => filled(p.formacao_normalizada) || filled(p.formacao_raw) },
  { key: 'registro', label: 'registro (CRP/CRM)', ok: p => filled(p.crp_crm) },
];

export function profileCompleteness(p: ProProfile) {
  const missing = PROFILE_FIELDS.filter(f => !f.ok(p)).map(f => f.label);
  return { pct: Math.round(((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length) * 100), missing };
}

export function buildProActions(i: ProInput, max = 5): ProAction[] {
  const out: ProAction[] = [];
  const t = i.now.getTime();
  const active = i.appts.filter(a => a.status !== 'cancelled' && a.status !== 'cancelado');
  const soon = active.filter(a => { const d = apptAt(a).getTime() - t; return d >= -3_600_000 && d <= DAY; });
  if (soon.length) out.push({ id: 'appt-soon', title: soon.length === 1 ? 'Consulta nas próximas 24 h' : `${soon.length} consultas nas próximas 24 h`, description: 'Confira horários e links das chamadas.', path: '/professional-profile', cta: 'Ver agenda', priority: 1 });
  if (i.nextSessionAt) { const d = new Date(i.nextSessionAt).getTime() - t; if (d >= -3_600_000 && d <= DAY) out.push({ id: 'session-soon', title: 'Você conduz um encontro em breve', description: 'O encontro começa nas próximas 24 horas.', path: '/meus-encontros', cta: 'Ver encontro', priority: 1 }); }
  const pending = active.filter(a => a.payment_status === 'pending_payment' && apptAt(a).getTime() >= t).length;
  if (pending) out.push({ id: 'payment', title: pending === 1 ? '1 consulta com pagamento pendente' : `${pending} consultas com pagamento pendente`, description: 'O paciente ainda não concluiu o pagamento.', path: '/professional-profile', cta: 'Ver', priority: 2 });
  const { missing } = profileCompleteness(i.profile);
  if (missing.length) out.push({ id: 'profile', title: 'Complete seu perfil público', description: `Falta: ${missing.join(', ')}.`, path: '/professional-profile', cta: 'Completar', priority: 2 });
  if (!filled(i.profile.pix) && !filled(i.profile.conta)) out.push({ id: 'bank', title: 'Cadastre seus dados de recebimento', description: 'Informe PIX ou conta bancária para receber pelas consultas.', path: '/professional-profile', cta: 'Cadastrar', priority: 2 });
  if (!i.hasSchedule) out.push({ id: 'schedule', title: 'Cadastre seus horários de atendimento', description: 'Sem horários, pacientes não conseguem agendar com você.', path: '/professional-profile', cta: 'Cadastrar', priority: 1 });
  if (i.unreadMessages > 0) out.push({ id: 'messages', title: i.unreadMessages === 1 ? '1 mensagem não lida' : `${i.unreadMessages} mensagens não lidas`, description: 'Você recebeu novidades.', path: '/mensagens', cta: 'Ler', priority: 3 });
  return out.map((a, k) => ({ a, k })).sort((x, y) => x.a.priority - y.a.priority || x.k - y.k).slice(0, max).map(x => x.a);
}

export function proKpis(appts: Appt[], now: Date) {
  const t = now.getTime();
  const ok = appts.filter(a => a.status !== 'cancelled' && a.status !== 'cancelado');
  const inRange = (a: Appt, from: number, to: number) => { const x = apptAt(a).getTime(); return x >= from && x < to; };
  const next7 = ok.filter(a => inRange(a, t, t + 7 * DAY)).length;
  const last30 = ok.filter(a => inRange(a, t - 30 * DAY, t) && a.payment_status === 'paid').length;
  const prev30 = ok.filter(a => inRange(a, t - 60 * DAY, t - 30 * DAY) && a.payment_status === 'paid').length;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const revenue = ok.filter(a => inRange(a, monthStart, nextMonth) && a.payment_status === 'paid').reduce((s, a) => s + Number(a.valor ?? 0), 0);
  return { next7, last30, prev30, revenue };
}
