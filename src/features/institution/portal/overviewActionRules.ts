export type ActionLevel = 'urgent' | 'important' | 'suggestion';
export type ActionTarget = 'triage_risk' | 'triage_in_progress' | 'supports' | 'buddy_brief';

export interface OverviewAction {
  id: string;
  level: ActionLevel;
  title: string;
  reason: string;
  cta: string;
  target: ActionTarget;
}

export interface OverviewActionsInput {
  criticalOpen: number;
  totalTriage: number;
  resolvedTriage: number;
  engagementRate: number; // 0..1
  activeStudentsWeek: number;
  activeStudentsPrevWeek: number;
  lastBriefAt: string | null;
  now?: Date;
}

export const RESOLUTION_TARGET = 0.8;
export const ENGAGEMENT_TARGET = 0.4;
export const BRIEF_MAX_AGE_DAYS = 7;
export const MAX_ACTIONS = 5;

const ORDER: Record<ActionLevel, number> = { urgent: 0, important: 1, suggestion: 2 };
const fmt = (n: number) => n.toLocaleString('pt-BR');

export function buildOverviewActions(i: OverviewActionsInput): OverviewAction[] {
  const out: OverviewAction[] = [];
  const now = i.now ?? new Date();

  if (i.criticalOpen > 0) {
    out.push({
      id: 'triage_risk', level: 'urgent', target: 'triage_risk', cta: 'Abrir fila',
      title: 'Triar alunos Sinal elevado',
      reason: `${fmt(i.criticalOpen)} ${i.criticalOpen === 1 ? 'aluno Sinal elevado aguardando' : 'alunos Sinal elevado aguardando'} triagem.`,
    });
  }

  const open = i.totalTriage - i.resolvedTriage;
  const resolution = i.totalTriage > 0 ? i.resolvedTriage / i.totalTriage : 1;
  if (open > 0 && resolution < RESOLUTION_TARGET) {
    out.push({
      id: 'triage_in_progress', level: 'important', target: 'triage_in_progress', cta: 'Ver em andamento',
      title: 'Concluir triagens em andamento',
      reason: `${fmt(open)} triagens abertas · resolução em ${Math.round(resolution * 100)}% (meta ${RESOLUTION_TARGET * 100}%).`,
    });
  }

  const dropped = i.activeStudentsWeek < i.activeStudentsPrevWeek;
  if (i.engagementRate < ENGAGEMENT_TARGET || dropped) {
    out.push({
      id: 'engagement', level: 'important', target: 'supports', cta: 'Divulgar um apoio',
      title: 'Reengajar alunos',
      reason: dropped
        ? `Alunos ativos caíram de ${fmt(i.activeStudentsPrevWeek)} para ${fmt(i.activeStudentsWeek)} nesta semana.`
        : `Engajamento em ${Math.round(i.engagementRate * 100)}% nos últimos 7 dias (meta ${ENGAGEMENT_TARGET * 100}%).`,
    });
  }

  const ageDays = i.lastBriefAt ? (now.getTime() - new Date(i.lastBriefAt).getTime()) / 86400000 : Infinity;
  if (ageDays > BRIEF_MAX_AGE_DAYS) {
    out.push({
      id: 'buddy_brief', level: 'suggestion', target: 'buddy_brief', cta: 'Atualizar resumo',
      title: 'Atualizar o resumo do Buddy',
      reason: i.lastBriefAt ? `O último resumo tem ${Math.floor(ageDays)} dias.` : 'Ainda não há resumo executivo gerado.',
    });
  }

  return out.sort((a, b) => ORDER[a.level] - ORDER[b.level]).slice(0, MAX_ACTIONS);
}
