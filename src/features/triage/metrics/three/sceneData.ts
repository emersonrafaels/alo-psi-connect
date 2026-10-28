import type { Risk } from '../../priorities';
import type { TriagePriority } from '../../triagePlan';
import { PRIORITIES, type WeekBucket } from '../teamMetrics';

/** Same hues as the priority and risk dots used across the triage pages (Tailwind 500 steps). */
export const PRIORITY_HEX: Record<TriagePriority, string> = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
/** Keep scene overlays under the page's dialogs (z-50) so a modal opened from the scene covers them. */
export const OVERLAY_Z: [number, number] = [20, 0];

export const RISK_HEX: Record<Risk, string> = { critical: '#ef4444', alert: '#f97316', attention: '#eab308', healthy: '#22c55e', no_data: '#94a3b8' };
export const RISK_LABEL: Record<Risk, string> = { critical: 'Sinal elevado', alert: 'Alerta', attention: 'Atenção', healthy: 'Sem sinais prioritários', no_data: 'Dados insuficientes' };

/** Which 3D scene is shown and which risk levels light up on campus; the page toolbar owns this state. */
export type Scene3D = 'volume' | 'campus';
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

/** Warm light for windows of triages already resolved; open triages keep dark glass. */
export const VOLUME_LIT = '#fff7d6';

/** Facade grid of a volume building: about one row per 0.36 units of height, three windows per row. */
export function volumeWindows(c: Pick<VolumeColumn, 'created' | 'resolved' | 'resolvedHeight' | 'openHeight'>) {
  const cols = 3;
  const rows = Math.max(1, Math.round((c.resolvedHeight + c.openHeight) / 0.36));
  const total = rows * cols;
  let lit = c.created > 0 ? Math.round((total * c.resolved) / c.created) : 0;
  if (c.resolved > 0) lit = Math.max(1, lit);
  if (c.created > c.resolved) lit = Math.min(total - 1, lit);
  lit = Math.max(0, Math.min(total, lit));
  return { rows, cols, windows: Array.from({ length: total }, (_, i) => (i < lit ? VOLUME_LIT : null)) };
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

// ---------- shared ----------

/** Deterministic offset in [-amp, amp], so decorative items (trees) keep their place between renders. */
export function jitter(id: string, salt: number, amp = 0.12): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (((h >>> 0) % 2001) / 1000 - 1) * amp;
}
