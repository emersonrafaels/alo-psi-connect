/** Conversion between two ladder steps, in %. */
export const conversion = (from: number, to: number) => (from > 0 ? Math.round((to / from) * 100) : 0);

/**
 * Theme gap: demand share vs. catalogue share. Positive ratio > 1.3 = demand above offer (gap),
 * < 0.7 = offer above demand.
 */
export function themeGap(demandPct: number, offerPct: number): 'gap' | 'over' | 'balanced' {
  if (offerPct <= 0) return demandPct > 0 ? 'gap' : 'balanced';
  const r = demandPct / offerPct;
  return r > 1.3 ? 'gap' : r < 0.7 ? 'over' : 'balanced';
}

/** Index of the peak week (first one on ties). */
export const peakWeek = (a: number[]) => a.reduce((best, v, i) => (v > a[best] ? i : best), 0);

/** Trail trend from last vs previous month. */
export function trailTrend(last: number, prev: number): 'up' | 'down' | 'flat' {
  if (prev <= 0) return last > 0 ? 'up' : 'flat';
  const r = last / prev;
  return r > 1.1 ? 'up' : r < 0.9 ? 'down' : 'flat';
}

export const attendance = (present: number, registered: number) => (registered > 0 ? Math.round((present / registered) * 100) : 0);

/** Normalize a row against its own peak (0..1). */
export const normToPeak = (a: number[]) => { const m = Math.max(...a, 0); return a.map((v) => (m ? v / m : 0)); };
