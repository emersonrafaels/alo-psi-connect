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

/** Urgency order: grave keyword > critical not triaged > overdue follow-up > alert > worsening trend. */
export function priorityScore(s: PriorityInput): number {
  let score = 0;
  if (s.criticalSeverity === 'grave') score += 1000;
  else if (s.criticalSeverity === 'moderate') score += 150;
  if (s.riskLevel === 'critical') score += isPending(s) ? 500 : 250;
  if (s.overdueFollowUp) score += 300;
  if (s.riskLevel === 'alert') score += isPending(s) ? 120 : 60;
  if (s.riskLevel === 'attention') score += 20;
  if (s.moodTrend != null && s.moodTrend < -15) score += Math.min(80, Math.round(-s.moodTrend));
  return score;
}

export function priorityReasons(s: PriorityInput, periodDays: number): string[] {
  const r: string[] = [];
  if (s.criticalSeverity === 'grave') r.push('Termo grave no diário');
  else if (s.criticalSeverity === 'moderate') r.push('Termo de atenção no diário');
  if (s.riskLevel === 'critical') r.push(isPending(s) ? 'Crítico e ainda não triado' : 'Crítico em acompanhamento');
  else if (s.riskLevel === 'alert') r.push(isPending(s) ? 'Em alerta e ainda não triado' : 'Em alerta');
  if (s.overdueFollowUp) r.push('Follow-up vencido');
  if (s.moodTrend != null && s.moodTrend < -15) r.push(`Humor caiu ${Math.round(-s.moodTrend)}% em ${periodDays} dias`);
  return r;
}

export function buildPriorities<T extends PriorityInput>(students: T[], periodDays: number, limit = 10): PriorityItem<T>[] {
  return students
    .map((s) => ({ student: s, score: priorityScore(s), reasons: priorityReasons(s, periodDays) }))
    .filter((p) => p.score >= 100)
    .sort((a, b) => b.score - a.score)
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
