import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import type { Risk } from '../priorities';
import type { TriagePriority } from '../triagePlan';

/** The fields of a `student_triage` row the metrics read. */
export interface MetricsRecord {
  id: string;
  patient_id: string;
  triaged_by_name?: string;
  status: string;
  risk_level: string;
  priority: string;
  recommended_action: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at?: string;
  resolved_at: string | null;
  resolution_type?: string | null;
  reopened_at?: string | null;
}

export interface MetricsStudent {
  patientId: string;
  riskLevel: Risk;
  lastTriageStatus: string | null;
}

export interface Window { start: Date; end: Date }

/** Filter coming from the 3D volume scene: one week, one priority, or both. */
export interface MetricsSelection { weekStart?: string; priority?: TriagePriority }

export const PRIORITIES: TriagePriority[] = ['urgent', 'high', 'medium', 'low'];
export const WEEKS = 12;
const STALE_DAYS = 30;
const DAY_MS = 86_400_000;

// ---------- small helpers ----------

const time = (iso: string) => new Date(iso).getTime();
const inWindow = (iso: string | null | undefined, w: Window) => !!iso && time(iso) >= w.start.getTime() && time(iso) <= w.end.getTime();
const daysBetween = (fromIso: string, to: Date | string) => ((typeof to === 'string' ? time(to) : to.getTime()) - time(fromIso)) / DAY_MS;

/** Resolution moment; legacy rows marked resolved without a date fall back to their last update. */
export const resolvedAt = (r: MetricsRecord): string | null =>
  r.resolved_at ?? (r.status === 'resolved' ? r.updated_at ?? null : null);

const isOpenNow = (r: MetricsRecord) => r.status === 'triaged' || r.status === 'in_progress';

/** Open at instant `t`: already created and not yet resolved (reopening clears `resolved_at`). */
const isOpenAt = (r: MetricsRecord, t: Date) => {
  if (time(r.created_at) > t.getTime()) return false;
  const res = resolvedAt(r);
  return !res || time(res) > t.getTime();
};

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Nearest-rank percentile. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))];
}

const round1 = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10);

/** Current period ends now and starts `periodDays` ago at midnight; the previous one is the same length right before it. */
export function periodWindows(periodDays: number, now: Date): { current: Window; previous: Window } {
  const start = startOfDay(subDays(now, periodDays));
  const prevStart = subDays(start, periodDays);
  return { current: { start, end: now }, previous: { start: prevStart, end: new Date(start.getTime() - 1) } };
}

// ---------- headline indicators ----------

export interface Comparison { current: number; previous: number }

export interface Headline {
  triaged: Comparison;
  resolved: Comparison;
  resolutionDays: { median: number | null; p90: number | null; previousMedian: number | null; count: number };
  coverage: Record<'critical' | 'alert', { triaged: number; total: number }>;
  backlog: { open: number; previousOpen: number; medianAgeDays: number | null; stale: number };
  followUps: { withDate: number; onTime: number; overdue: number };
  reopen: { reopened: number; resolved: number };
}

function resolutionDays(records: MetricsRecord[], w: Window) {
  return records
    .filter((r) => inWindow(resolvedAt(r), w))
    .map((r) => Math.max(0, daysBetween(r.created_at, resolvedAt(r)!)));
}

export function computeHeadline(records: MetricsRecord[], students: MetricsStudent[], periodDays: number, now: Date): Headline {
  const { current, previous } = periodWindows(periodDays, now);
  const today = startOfDay(now);
  const cur = resolutionDays(records, current);
  const prev = resolutionDays(records, previous);
  const open = records.filter(isOpenNow);
  const withDate = open.filter((r) => r.follow_up_date);
  const overdue = withDate.filter((r) => startOfDay(new Date(`${r.follow_up_date}T12:00:00`)) < today).length;

  const coverageOf = (level: 'critical' | 'alert') => {
    const group = students.filter((s) => s.riskLevel === level);
    // Same rule as the "Para triar" queue: no triage yet, or a pending one, means not covered.
    const triaged = group.filter((s) => s.lastTriageStatus && s.lastTriageStatus !== 'pending').length;
    return { triaged, total: group.length };
  };

  return {
    triaged: {
      current: records.filter((r) => inWindow(r.created_at, current)).length,
      previous: records.filter((r) => inWindow(r.created_at, previous)).length,
    },
    resolved: { current: cur.length, previous: prev.length },
    resolutionDays: { median: round1(median(cur)), p90: round1(percentile(cur, 90)), previousMedian: round1(median(prev)), count: cur.length },
    coverage: { critical: coverageOf('critical'), alert: coverageOf('alert') },
    backlog: {
      open: open.length,
      previousOpen: records.filter((r) => isOpenAt(r, previous.end)).length,
      medianAgeDays: round1(median(open.map((r) => daysBetween(r.created_at, now)))),
      stale: open.filter((r) => daysBetween(r.created_at, now) > STALE_DAYS).length,
    },
    followUps: { withDate: withDate.length, onTime: withDate.length - overdue, overdue },
    reopen: { reopened: records.filter((r) => inWindow(r.reopened_at, current)).length, resolved: cur.length },
  };
}

// ---------- weekly flow (2D charts and the 3D volume scene) ----------

export interface WeekBucket {
  /** `yyyy-MM-dd` of the first day; stable id used by the 3D selection. */
  key: string;
  start: Date;
  end: Date;
  created: number;
  resolved: number;
  /** Open triages at the end of the week. */
  backlog: number;
  byPriority: Record<TriagePriority, { created: number; resolvedSoFar: number }>;
}

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Rolling 7-day weeks ending today, oldest first. */
export function weeklyFlow(records: MetricsRecord[], now: Date, weeks = WEEKS): WeekBucket[] {
  const out: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = endOfDay(subDays(now, i * 7));
    const start = startOfDay(subDays(end, 6));
    const w = { start, end };
    const createdHere = records.filter((r) => inWindow(r.created_at, w));
    const byPriority = Object.fromEntries(PRIORITIES.map((p) => {
      const ofP = createdHere.filter((r) => r.priority === p);
      return [p, { created: ofP.length, resolvedSoFar: ofP.filter((r) => resolvedAt(r)).length }];
    })) as WeekBucket['byPriority'];
    out.push({
      key: isoDay(start),
      start,
      end,
      created: createdHere.length,
      resolved: records.filter((r) => inWindow(resolvedAt(r), w)).length,
      backlog: records.filter((r) => isOpenAt(r, end)).length,
      byPriority,
    });
  }
  return out;
}

// ---------- where the team works (respects the 3D selection) ----------

export interface Breakdowns {
  window: Window;
  byPriority: Record<TriagePriority, { created: number; resolved: number; open: number; medianDays: number | null }>;
  byAction: { key: string; count: number }[];
  byResolution: { key: string; count: number }[];
  team: { name: string; triaged: number; resolved: number; open: number; medianDays: number | null }[];
}

/** Records and window to use for breakdowns: the period, or the week/priority picked in the 3D scene. */
export function scope(records: MetricsRecord[], selection: MetricsSelection | null, period: Window): { records: MetricsRecord[]; window: Window } {
  let list = records;
  if (selection?.priority) list = list.filter((r) => r.priority === selection.priority);
  if (selection?.weekStart) {
    const start = startOfDay(new Date(`${selection.weekStart}T12:00:00`));
    return { records: list, window: { start, end: endOfDay(addDays(start, 6)) } };
  }
  return { records: list, window: period };
}

const countBy = (list: MetricsRecord[], key: (r: MetricsRecord) => string | null | undefined) => {
  const m = new Map<string, number>();
  list.forEach((r) => { const k = key(r); if (k) m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
};

export function computeBreakdowns(records: MetricsRecord[], w: Window): Breakdowns {
  const created = records.filter((r) => inWindow(r.created_at, w));
  const resolved = records.filter((r) => inWindow(resolvedAt(r), w));
  const open = records.filter(isOpenNow);
  const days = (list: MetricsRecord[]) => round1(median(list.map((r) => Math.max(0, daysBetween(r.created_at, resolvedAt(r)!)))));

  const byPriority = Object.fromEntries(PRIORITIES.map((p) => {
    const res = resolved.filter((r) => r.priority === p);
    return [p, {
      created: created.filter((r) => r.priority === p).length,
      resolved: res.length,
      open: open.filter((r) => r.priority === p).length,
      medianDays: days(res),
    }];
  })) as Breakdowns['byPriority'];

  const names = new Set([...created, ...resolved, ...open].map((r) => r.triaged_by_name || 'Sem nome'));
  const team = [...names].map((name) => {
    const mine = (list: MetricsRecord[]) => list.filter((r) => (r.triaged_by_name || 'Sem nome') === name);
    const res = mine(resolved);
    return { name, triaged: mine(created).length, resolved: res.length, open: mine(open).length, medianDays: days(res) };
  }).sort((a, b) => b.triaged - a.triaged || b.resolved - a.resolved);

  return {
    window: w,
    byPriority,
    byAction: countBy(created, (r) => r.recommended_action),
    byResolution: countBy(resolved, (r) => r.resolution_type),
    team,
  };
}

// ---------- outcomes ----------

export interface Outcomes { improved: number; stable: number; worsened: number; noData: number; total: number }

const SEVERITY: Record<string, number> = { critical: 3, alert: 2, attention: 1, healthy: 0 };

/**
 * For each student whose latest triage was resolved in the window, compare the risk level recorded at
 * triage with the level the student shows today.
 */
export function computeOutcomes(records: MetricsRecord[], students: MetricsStudent[], w: Window): Outcomes {
  const currentRisk = new Map(students.map((s) => [s.patientId, s.riskLevel]));
  const latest = new Map<string, MetricsRecord>();
  records.forEach((r) => {
    const prev = latest.get(r.patient_id);
    if (!prev || time(r.created_at) > time(prev.created_at)) latest.set(r.patient_id, r);
  });

  const out: Outcomes = { improved: 0, stable: 0, worsened: 0, noData: 0, total: 0 };
  latest.forEach((r) => {
    if (!inWindow(resolvedAt(r), w)) return;
    out.total++;
    const before = SEVERITY[r.risk_level];
    const now = SEVERITY[currentRisk.get(r.patient_id) ?? 'no_data'];
    if (before == null || now == null) out.noData++;
    else if (now < before) out.improved++;
    else if (now > before) out.worsened++;
    else out.stable++;
  });
  return out;
}
