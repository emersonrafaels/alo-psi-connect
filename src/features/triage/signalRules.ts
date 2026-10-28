// Triage phase 1 signal rules (Orientações Triagem Fase 1).
// Thresholds document the existing configuration; they are not clinical cut-offs.

export type SignalLevel = 'critical' | 'alert' | 'attention' | 'healthy' | 'no_data';

export const SIGNAL_LABELS: Record<SignalLevel, string> = {
  critical: 'Sinal elevado',
  alert: 'Alerta',
  attention: 'Atenção',
  healthy: 'Sem sinais prioritários',
  no_data: 'Dados insuficientes',
};

export const SIGNAL_RULE_TEXT: Record<SignalLevel, string> = {
  critical: 'Humor médio ≤ 1,5 ou ansiedade ≥ 4,5. São indicadores que merecem avaliação prioritária.',
  alert: 'Humor médio ≤ 2,5, ansiedade ≥ 3,5 ou energia ≤ 1,5. Indicam necessidade de atenção e possível acompanhamento.',
  attention: 'Humor médio ≤ 3,0, ansiedade ≥ 3,0 ou sono ≤ 2,0. Sugerem observação da evolução emocional.',
  healthy: 'Nenhum critério configurado de alerta foi identificado nos registros disponíveis.',
  no_data: 'Não há informação válida suficiente para classificar os indicadores no período selecionado.',
};

export const RULES_VERSION = 'fase1-2026-10';
/** Mood drop (%) shown only as a complementary reason; never raises the level. */
export const MOOD_DROP_REASON_PCT = -40;

export interface SignalInput {
  avgMood: number | null;
  avgAnxiety: number | null;
  avgEnergy: number | null;
  avgSleep: number | null;
  moodTrend?: number | null;
  validCount?: number;
}

export interface SignalResult {
  level: SignalLevel;
  reasons: string[];
}

const rank: Record<SignalLevel, number> = { no_data: -1, healthy: 0, attention: 1, alert: 2, critical: 3 };

/** Highest level among the numeric conditions met; missing values never count as zero. */
export function classifySignals(i: SignalInput): SignalResult {
  const { avgMood: m, avgAnxiety: a, avgEnergy: e, avgSleep: s } = i;
  const reasons: string[] = [];
  if (m == null && a == null && e == null && s == null) {
    return { level: 'no_data', reasons: ['Dados insuficientes'] };
  }
  let level: SignalLevel = 'healthy';
  const hit = (l: SignalLevel) => { if (rank[l] > rank[level]) level = l; };

  if (m != null && m <= 3.0) { reasons.push('Humor médio baixo'); hit(m <= 1.5 ? 'critical' : m <= 2.5 ? 'alert' : 'attention'); }
  if (a != null && a >= 3.0) { reasons.push('Ansiedade elevada'); hit(a >= 4.5 ? 'critical' : a >= 3.5 ? 'alert' : 'attention'); }
  if (e != null && e <= 1.5) { reasons.push('Energia muito baixa'); hit('alert'); }
  if (s != null && s <= 2.0) { reasons.push('Sono baixo'); hit('attention'); }

  if (i.moodTrend != null && i.moodTrend <= MOOD_DROP_REASON_PCT) reasons.push('Queda relevante de humor');
  if (i.validCount === 1) reasons.push('Registro isolado');
  else if (i.validCount != null && i.validCount > 0 && i.moodTrend == null) reasons.push('Registros insuficientes para tendência');
  return { level, reasons };
}

/** Percentage change between halves; null when there is no comparable base. */
export function moodTrendPct(moods: Array<number | null | undefined>): number | null {
  const v = moods.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  if (v.length < 4) return null;
  const half = Math.floor(v.length / 2);
  const a = v.slice(0, half).reduce((x, y) => x + y, 0) / half;
  const b = v.slice(half).reduce((x, y) => x + y, 0) / (v.length - half);
  if (!(a > 0)) return null;
  return Math.round(((b - a) / a) * 100);
}

export type CareStatus = 'not_triaged' | 'in_follow_up' | 'overdue' | 'concluded';
export const CARE_LABELS: Record<CareStatus, string> = {
  not_triaged: 'Ainda não triado',
  in_follow_up: 'Em acompanhamento',
  overdue: 'Retorno vencido',
  concluded: 'Triagem concluída',
};

/** Care situation is shown apart from the level color and never changes it. */
export function careStatus(lastStatus: string | null, overdueFollowUp = false): CareStatus {
  if (overdueFollowUp) return 'overdue';
  if (!lastStatus || lastStatus === 'pending') return 'not_triaged';
  if (lastStatus === 'resolved') return 'concluded';
  return 'in_follow_up';
}

/** "Triar" for never-triaged students, "Revisar" when a previous triage exists. */
export function triageActionLabel(lastTriageId: string | null | undefined): 'Triar' | 'Revisar' {
  return lastTriageId ? 'Revisar' : 'Triar';
}

export const TEXT_SIGNAL_LABEL = 'Sinal textual sensível: revisão pendente';
