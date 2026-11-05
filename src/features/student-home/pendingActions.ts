// Pure rules for the student's "O que fazer agora" list.
export type ActionPriority = 1 | 2 | 3;
export interface PendingAction {
  id: string;
  title: string;
  description: string;
  path: string;
  cta: string;
  priority: ActionPriority; // 1 = most urgent
  external?: boolean; // path is an external URL (e.g. meeting room)
}

export interface NextSession { id: string; title: string; startsAt: string; type?: string | null; meetingUrl?: string | null; otherCount?: number }

const TYPE_LABEL: Record<string, string> = { workshop: 'Workshop', roda_conversa: 'Roda de conversa', palestra: 'Palestra' };
const pad = (n: number) => String(n).padStart(2, '0');
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "Hoje, 19h00 · começa em 3 h" — uses local wall-clock of startsAt (no timezone suffix). */
export function describeSession(s: NextSession, now: Date): string {
  const at = new Date(s.startsAt);
  const time = `${pad(at.getHours())}h${pad(at.getMinutes())}`;
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const tomorrow = new Date(now.getTime() + DAY);
  const day = dayKey(at) === dayKey(now) ? 'Hoje' : dayKey(at) === dayKey(tomorrow) ? 'Amanhã' : `${WD[at.getDay()]}, ${at.getDate()} ${MO[at.getMonth()]}`;
  const mins = Math.round((at.getTime() - now.getTime()) / 60_000);
  const rel = mins <= 0 ? 'acontecendo agora' : mins < 60 ? `começa em ${mins} min` : `começa em ${Math.round(mins / 60)} h`;
  const type = s.type ? TYPE_LABEL[s.type] ?? null : null;
  const extra = s.otherCount ? ` · +${s.otherCount} outro${s.otherCount > 1 ? 's' : ''} encontro${s.otherCount > 1 ? 's' : ''}` : '';
  return [type, `${day}, ${time}`, rel].filter(Boolean).join(' · ') + extra;
}

export interface ScaleInfo { code: string; name: string; frequencyDays: number; lastTakenAt: string | null }
export interface PendingInput {
  now: Date;
  lastDiaryDate: string | null; // yyyy-mm-dd
  scales: ScaleInfo[];
  currentSemester: string;
  radarSemesters: string[];
  unreadMessages: number;
  nextSessionAt: string | null; // ISO of next registered encontro
  nextSession?: NextSession | null;
  pendingPaymentAppointments: number;
}

const DAY = 86_400_000;
const toDay = (d: Date) => d.toISOString().slice(0, 10);

export function daysSince(dateStr: string | null, now: Date): number | null {
  if (!dateStr) return null;
  const a = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00Z` : dateStr);
  const b = new Date(`${toDay(now)}T00:00:00Z`);
  return Math.max(0, Math.floor((b.getTime() - new Date(`${toDay(a)}T00:00:00Z`).getTime()) / DAY));
}

export function buildPendingActions(input: PendingInput, max = 5): PendingAction[] {
  const out: PendingAction[] = [];
  const { now } = input;

  const diaryGap = daysSince(input.lastDiaryDate, now);
  if (diaryGap === null || diaryGap >= 1) {
    out.push({
      id: 'diary',
      title: 'Registrar o diário de hoje',
      description: diaryGap === null ? 'Você ainda não fez nenhum registro.' : diaryGap === 1 ? 'Seu último registro foi ontem.' : `Seu último registro foi há ${diaryGap} dias.`,
      path: '/diario-emocional/nova-entrada', cta: 'Registrar',
      priority: diaryGap !== null && diaryGap >= 3 ? 1 : 2,
    });
  }

  if (input.nextSessionAt) {
    const diff = new Date(input.nextSessionAt).getTime() - now.getTime();
    if (diff >= -60 * 60_000 && diff <= DAY) {
      const ns = input.nextSession;
      if (ns) {
        const canJoin = diff <= 15 * 60_000 && !!ns.meetingUrl;
        out.push({ id: 'session', title: ns.title, description: describeSession(ns, now), path: canJoin ? ns.meetingUrl! : `/encontros/${ns.id}`, cta: canJoin ? 'Entrar agora' : 'Ver encontro', priority: 1, external: canJoin });
      } else {
        out.push({ id: 'session', title: 'Encontro em breve', description: 'Você tem um encontro nas próximas 24 horas.', path: '/meus-encontros', cta: 'Ver encontro', priority: 1 });
      }
    }
  }

  if (input.unreadMessages > 0) {
    out.push({ id: 'messages', title: input.unreadMessages === 1 ? '1 mensagem não lida' : `${input.unreadMessages} mensagens não lidas`, description: 'Sua instituição ou a Rede Bem-Estar enviou novidades.', path: '/mensagens', cta: 'Ler', priority: 2 });
  }

  if (!input.radarSemesters.includes(input.currentSemester)) {
    out.push({ id: 'radar', title: 'Responder o Radar de Permanência', description: `Conte como está o semestre ${input.currentSemester}.`, path: '/radar-permanencia', cta: 'Responder', priority: 2 });
  }

  for (const s of input.scales) {
    const gap = daysSince(s.lastTakenAt, now);
    if (gap === null || gap >= s.frequencyDays) {
      out.push({ id: `scale-${s.code}`, title: `Responder ${s.name}`, description: gap === null ? 'Ainda não respondida.' : `Última resposta há ${gap} dias.`, path: `/escalas/${s.code}`, cta: 'Responder', priority: 3 });
    }
  }

  if (input.pendingPaymentAppointments > 0) {
    out.push({ id: 'payment', title: 'Agendamento aguardando pagamento', description: 'Conclua o pagamento para confirmar sua consulta.', path: '/agendamentos', cta: 'Ver', priority: 1 });
  }

  return out.map((a, i) => ({ a, i })).sort((x, y) => x.a.priority - y.a.priority || x.i - y.i).slice(0, max).map(x => x.a);
}
