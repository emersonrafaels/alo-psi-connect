export type Risk = 'critical' | 'alert' | 'attention' | 'healthy' | 'no_data';

export interface PriorityInput {
  patientId: string;
  riskLevel: Risk;
  lastTriageStatus: string | null;
  moodTrend: number | null;
  criticalSeverity?: 'grave' | 'moderate' | null;
  overdueFollowUp?: boolean;
}

export interface PriorityItem<T extends PriorityInput = PriorityInput> {
  student: T;
  score: number;
  reasons: string[];
}

const isPending = (s: PriorityInput) => !s.lastTriageStatus || s.lastTriageStatus === 'pending';

/** One definition for the pending queue and every institutional counter. */
export function isAwaitingTriage(s: Pick<PriorityInput, 'riskLevel' | 'lastTriageStatus'>): boolean {
  // Open triages stay in the queue even when the current period no longer shows Sinal elevado.
  return s.lastTriageStatus === 'pending' || (s.riskLevel === 'critical' && !s.lastTriageStatus);
}

/**
 * Order: approved text-signal block, then level groups (Sinal elevado > Alerta > Atenção > others);
 * inside a level, effective pendings (overdue follow-up, not triaged) come first.
 * Overdue follow-ups never change the level itself.
 */
export function priorityScore(s: PriorityInput): number {
  let score = 0;
  if (s.criticalSeverity) score += s.criticalSeverity === 'grave' ? 2000 : 1500;
  score += { critical: 600, alert: 400, attention: 200, healthy: 0, no_data: 0 }[s.riskLevel];
  if (s.overdueFollowUp) score += 120;
  else if (isPending(s) && s.riskLevel !== 'healthy' && s.riskLevel !== 'no_data') score += 60;
  return score;
}

export function priorityReasons(s: PriorityInput, _periodDays: number): string[] {
  const r: string[] = [];
  if (s.criticalSeverity) r.push('Sinal textual sensível: revisão pendente');
  if (s.riskLevel === 'critical') r.push(isPending(s) ? 'Sinal elevado · ainda não triado' : 'Sinal elevado · acompanhamento ativo');
  else if (s.riskLevel === 'alert') r.push(isPending(s) ? 'Alerta · ainda não triado' : 'Alerta');
  else if (s.riskLevel === 'attention') r.push(isPending(s) ? 'Atenção · ainda não triado' : 'Atenção');
  if (s.overdueFollowUp) r.push('Retorno vencido');
  if (s.moodTrend != null && s.moodTrend <= -40) r.push('Queda relevante de humor');
  return r;
}

export function buildPriorities<T extends PriorityInput>(students: T[], periodDays: number, limit = 10): PriorityItem<T>[] {
  return students
    .map((s) => ({ student: s, score: priorityScore(s), reasons: priorityReasons(s, periodDays) }))
    .filter((p) => p.score >= 100)
    // Stable tie-break: never by number of records; patient id only as last resort.
    .sort((a, b) => b.score - a.score || a.student.patientId.localeCompare(b.student.patientId))
    .slice(0, limit);
}

export type ActionKey = 'critical' | 'followups' | 'keywords' | 'no_data';
export interface TriageAction { key: ActionKey; count: number }

export function buildActions(input: { criticalPending: number; overdueFollowUps: number; keywordStudents: number; noData: number }): TriageAction[] {
  const list: TriageAction[] = [
    { key: 'keywords', count: input.keywordStudents },
    { key: 'critical', count: input.criticalPending },
    { key: 'followups', count: input.overdueFollowUps },
    { key: 'no_data', count: input.noData },
  ];
  return list.filter((a) => a.count > 0);
}
