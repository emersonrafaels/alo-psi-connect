export const MIN_GROUP = 10;

export type ClinicalInstitution = {
  id: string; name: string; logo_url: string | null; students: number; elevated: number;
  triage_open: number; triage_urgent: number; followups_overdue: number; care_stalled: number; radar_answered: number;
};
type Avg = { mood: number | null; anx: number | null; sleep: number | null; energy: number | null } | null;
export type ClinicalSummary = {
  students: number; levels: Record<string, number> | null; elevated_untriaged: number; triage_open: number;
  triage_urgent: number; followups_overdue: number; care_stalled: number; elevated_7d: number;
  averages: { cur: Avg; prev: Avg } | null; engaged_7d: number;
  flow: { hours_to_triage: number | null; days_to_consult: number | null; resolved_30d: number; outcomes: Record<string, number> };
  radar_semester: string; radar_answered: number; appointments_week: number;
  sessions_week: { id: string; title: string; date: string; time: string; free_spots: number }[];
  by_institution: ClinicalInstitution[];
};

/** Percentage hidden (null) for groups under the minimum size. */
export const safePct = (part: number, total: number) => (total < MIN_GROUP || total === 0 ? null : Math.round((part / total) * 100));

/** Weighted priority: urgent work weighs most, then overdue returns, stalled requests, open triage and elevated share. */
export function priorityScore(i: ClinicalInstitution): number {
  const elevatedPct = safePct(i.elevated, i.students) ?? 0;
  return i.triage_urgent * 5 + i.followups_overdue * 3 + i.care_stalled * 3 + i.triage_open + elevatedPct / 5;
}

export type Status = 'critical' | 'warning' | 'ok';
export function institutionStatus(i: ClinicalInstitution): Status {
  if (i.triage_urgent > 0 || i.followups_overdue > 0) return 'critical';
  if (i.triage_open > 0 || i.care_stalled > 0 || (safePct(i.elevated, i.students) ?? 0) >= 15) return 'warning';
  return 'ok';
}

export const rankInstitutions = (list: ClinicalInstitution[]) => [...list].sort((a, b) => priorityScore(b) - priorityScore(a));

/** Trend of a metric; for anxiety a rise is worse. */
export function trend(cur: number | null | undefined, prev: number | null | undefined, inverted = false): 'up' | 'down' | 'flat' | null {
  if (cur == null || prev == null) return null;
  const d = cur - prev;
  if (Math.abs(d) < 0.05) return 'flat';
  return d > 0 ? 'up' : 'down';
}
export function trendIsGood(dir: 'up' | 'down' | 'flat' | null, inverted = false): boolean | null {
  if (!dir || dir === 'flat') return null;
  return inverted ? dir === 'down' : dir === 'up';
}

export const LEVELS = [
  { key: 'critical', label: 'Sinal elevado', tone: 'bg-destructive' },
  { key: 'alert', label: 'Alerta', tone: 'bg-destructive/60' },
  { key: 'attention', label: 'Atenção', tone: 'bg-destructive/30' },
  { key: 'healthy', label: 'Sem sinais prioritários', tone: 'bg-success' },
  { key: 'none', label: 'Dados insuficientes', tone: 'bg-muted-foreground/40' },
] as const;
