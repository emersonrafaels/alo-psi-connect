import type { Risk } from '../../priorities';
import type { TriagePriority } from '../../triagePlan';
import { PRIORITIES, type WeekBucket } from '../teamMetrics';

/** Same hues as the priority and risk dots used across the triage pages (Tailwind 500 steps). */
export const PRIORITY_HEX: Record<TriagePriority, string> = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
/** Keep scene overlays under the page's dialogs (z-50) so a modal opened from the scene covers them. */
export const OVERLAY_Z: [number, number] = [20, 0];

export const RISK_HEX: Record<Risk, string> = { critical: '#ef4444', alert: '#f97316', attention: '#eab308', healthy: '#22c55e', no_data: '#94a3b8' };
export const RISK_LABEL: Record<Risk, string> = { critical: 'Em Risco', alert: 'Alerta', attention: 'Atenção', healthy: 'Saudável', no_data: 'Sem dados' };

/** Which 3D scene is shown, and the filters of the wellbeing scene; the page toolbar owns this state. */
export type Scene3D = 'volume' | 'wellbeing';
export type TriageStatusFilter = 'all' | 'pending' | 'triaged';
export const SCENE_RISKS: Risk[] = ['critical', 'alert', 'attention', 'healthy'];

// ---------- volume scene: weeks (x) × priority (z), height = triages ----------

export const VOLUME = { spacingX: 1.1, spacingZ: 1.5, maxHeight: 5, size: 0.72 } as const;

export interface VolumeColumn {
  id: string;
  weekKey: string;
  weekIndex: number;
  priority: TriagePriority;
  x: number;
  z: number;
  created: number;
  resolved: number;
  open: number;
  /** Heights in scene units: resolved part at the bottom, still-open part stacked on top. */
  resolvedHeight: number;
  openHeight: number;
}

export function volumeColumns(weeks: WeekBucket[]): { columns: VolumeColumn[]; max: number; width: number; depth: number } {
  const max = Math.max(1, ...weeks.flatMap((w) => PRIORITIES.map((p) => w.byPriority[p].created)));
  const scale = VOLUME.maxHeight / max;
  const columns = weeks.flatMap((w, i) => PRIORITIES.map((p, j) => {
    const { created, resolvedSoFar } = w.byPriority[p];
    return {
      id: `${w.key}:${p}`,
      weekKey: w.key,
      weekIndex: i,
      priority: p,
      x: (i - (weeks.length - 1) / 2) * VOLUME.spacingX,
      z: (j - (PRIORITIES.length - 1) / 2) * VOLUME.spacingZ,
      created,
      resolved: resolvedSoFar,
      open: created - resolvedSoFar,
      resolvedHeight: resolvedSoFar * scale,
      openHeight: (created - resolvedSoFar) * scale,
    };
  }));
  return { columns, max, width: weeks.length * VOLUME.spacingX, depth: PRIORITIES.length * VOLUME.spacingZ };
}

// ---------- wellbeing scene: humor (x) × ansiedade (y) × sono (z) ----------

/** Scene cube edge; the 1–5 scale maps onto [-AXIS/2, AXIS/2]. */
export const AXIS = 6;
export const toAxis = (v: number) => ((v - 1) / 4) * AXIS - AXIS / 2;

export interface WellbeingInput {
  patientId: string;
  riskLevel: Risk;
  lastTriageStatus: string | null;
  avgMood: number | null;
  avgAnxiety: number | null;
  avgEnergy: number | null;
  avgSleep: number | null;
  entryCount: number;
}

export interface WellbeingPoint {
  patientId: string;
  label: string;
  risk: Risk;
  triaged: boolean;
  position: [number, number, number];
  radius: number;
  mood: number;
  anxiety: number;
  sleep: number;
  energy: number | null;
  entryCount: number;
}

/** Deterministic offset in [-amp, amp] so students with identical averages do not hide behind each other. */
export function jitter(id: string, salt: number, amp = 0.12): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (((h >>> 0) % 2001) / 1000 - 1) * amp;
}

/** Students without mood, anxiety or sleep averages cannot be placed and are left out (counted by the caller). */
export function wellbeingPoints(students: WellbeingInput[], nameOf: (patientId: string) => string, periodDays: number): WellbeingPoint[] {
  return students
    .filter((s) => s.avgMood != null && s.avgAnxiety != null && s.avgSleep != null)
    .map((s) => {
      const engagement = periodDays > 0 ? Math.min(1, s.entryCount / periodDays) : 0;
      return {
        patientId: s.patientId,
        label: nameOf(s.patientId),
        risk: s.riskLevel,
        triaged: !!s.lastTriageStatus && s.lastTriageStatus !== 'pending',
        position: [
          toAxis(s.avgMood!) + jitter(s.patientId, 1),
          toAxis(s.avgAnxiety!) + jitter(s.patientId, 2),
          toAxis(s.avgSleep!) + jitter(s.patientId, 3),
        ],
        radius: 0.07 + 0.09 * engagement,
        mood: s.avgMood!,
        anxiety: s.avgAnxiety!,
        sleep: s.avgSleep!,
        energy: s.avgEnergy,
        entryCount: s.entryCount,
      };
    });
}
