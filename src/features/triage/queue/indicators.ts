import { classifySignals } from '../signalRules';
import type { Risk } from '../priorities';

export type MetricKey = 'mood' | 'anxiety' | 'energy' | 'sleep';
export type Band = 'critical' | 'alert' | 'attention' | 'healthy';

export const METRIC_KEYS: MetricKey[] = ['mood', 'anxiety', 'energy', 'sleep'];

export const METRIC_LABEL: Record<MetricKey, string> = {
  mood: 'Humor',
  anxiety: 'Ansiedade',
  energy: 'Energia',
  sleep: 'Sono',
};

/** Anxiety is the only indicator where a higher value is worse. */
export const HIGHER_IS_WORSE: Record<MetricKey, boolean> = { mood: false, anxiety: true, energy: false, sleep: false };

/** Same thresholds used by the risk classification (see riskLegend in StudentTriageTab). */
export function metricBand(value: number, metric: MetricKey): Band {
  switch (metric) {
    case 'mood':
      if (value <= 1.5) return 'critical';
      if (value <= 2.5) return 'alert';
      if (value <= 3.0) return 'attention';
      return 'healthy';
    case 'anxiety':
      if (value >= 4.5) return 'critical';
      if (value >= 3.5) return 'alert';
      if (value >= 3.0) return 'attention';
      return 'healthy';
    case 'energy':
      if (value <= 1.0) return 'critical';
      if (value <= 1.5) return 'alert';
      if (value <= 2.5) return 'attention';
      return 'healthy';
    case 'sleep':
      if (value <= 1.5) return 'critical';
      if (value <= 2.0) return 'alert';
      if (value <= 2.5) return 'attention';
      return 'healthy';
  }
}

const BAND_WEIGHT: Record<Band, number> = { critical: 3, alert: 2, attention: 1, healthy: 0 };

const BAND_WORDING: Record<MetricKey, Record<Exclude<Band, 'healthy'>, string>> = {
  mood: { critical: 'Humor muito baixo', alert: 'Humor baixo', attention: 'Humor abaixo do esperado' },
  anxiety: { critical: 'Ansiedade muito alta', alert: 'Ansiedade alta', attention: 'Ansiedade elevada' },
  energy: { critical: 'Energia muito baixa', alert: 'Energia baixa', attention: 'Energia abaixo do esperado' },
  sleep: { critical: 'Sono muito ruim', alert: 'Sono ruim', attention: 'Sono irregular' },
};

export interface IndicatorInput {
  riskLevel: Risk;
  avgMood: number | null;
  avgAnxiety: number | null;
  avgEnergy: number | null;
  avgSleep: number | null;
  moodTrend: number | null;
  entryCount: number;
  criticalKeywordFlag?: { severity: 'grave' | 'moderate' } | null;
}

export function metricValue(s: IndicatorInput, key: MetricKey): number | null {
  return { mood: s.avgMood, anxiety: s.avgAnxiety, energy: s.avgEnergy, sleep: s.avgSleep }[key];
}

export interface Driver { key: MetricKey; value: number; band: Exclude<Band, 'healthy'> }

/** Indicators outside the healthy range, worst first. */
export function riskDrivers(s: IndicatorInput): Driver[] {
  const list: Driver[] = [];
  for (const key of METRIC_KEYS) {
    const value = metricValue(s, key);
    if (value == null) continue;
    const band = metricBand(value, key);
    if (band !== 'healthy') list.push({ key, value, band });
  }
  return list.sort((a, b) => BAND_WEIGHT[b.band] - BAND_WEIGHT[a.band]);
}

/** Reasons shown under the student's name: only rules that were actually triggered. */
export function riskReasons(s: IndicatorInput, limit = 4): string[] {
  return classifySignals({ ...s, validCount: s.entryCount }).reasons
    .filter((r) => r !== 'Dados insuficientes')
    .slice(0, limit);
}

export type PendingSort = 'urgency' | 'mood' | 'anxiety' | 'engagement';

export const PENDING_SORT_LABEL: Record<PendingSort, string> = {
  urgency: 'Mais urgentes',
  mood: 'Pior humor',
  anxiety: 'Maior ansiedade',
  engagement: 'Menos registros',
};

const RISK_ORDER: Risk[] = ['critical', 'alert', 'attention', 'healthy', 'no_data'];

const keywordWeight = (s: IndicatorInput) =>
  s.criticalKeywordFlag?.severity === 'grave' ? 2 : s.criticalKeywordFlag?.severity === 'moderate' ? 1 : 0;

const severity = (s: IndicatorInput) =>
  riskDrivers(s).reduce((acc, d) => acc + BAND_WEIGHT[d.band], 0);

/** Numeric comparison with missing values always last. */
const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) =>
  a == null ? (b == null ? 0 : 1) : b == null ? -1 : (a - b) * dir;

export function sortPending<T extends IndicatorInput>(list: T[], sort: PendingSort): T[] {
  const byUrgency = (a: T, b: T) =>
    RISK_ORDER.indexOf(a.riskLevel) - RISK_ORDER.indexOf(b.riskLevel)
    || keywordWeight(b) - keywordWeight(a)
    || severity(b) - severity(a)
    || nullsLast(a.avgMood, b.avgMood, 1);
  const compare: Record<PendingSort, (a: T, b: T) => number> = {
    urgency: byUrgency,
    mood: (a, b) => nullsLast(a.avgMood, b.avgMood, 1) || byUrgency(a, b),
    anxiety: (a, b) => nullsLast(a.avgAnxiety, b.avgAnxiety, -1) || byUrgency(a, b),
    engagement: (a, b) => a.entryCount - b.entryCount || byUrgency(a, b),
  };
  return [...list].sort(compare[sort]);
}
