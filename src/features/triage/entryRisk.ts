export type EntryRisk = 'critical' | 'alert' | 'attention' | 'healthy';

const ORDER: Record<EntryRisk, number> = { healthy: 0, attention: 1, alert: 2, critical: 3 };

/** Risk level implied by a single diary entry's scores (mood 1–5, anxiety 1–5, higher = worse). */
export function riskFromScores(mood: number | null, anxiety: number | null): EntryRisk | null {
  if (mood == null && anxiety == null) return null;
  const m = mood ?? 3, a = anxiety ?? 3;
  if (m <= 1.5 && a >= 4.5) return 'critical';
  if (m <= 2 || a >= 4) return 'alert';
  if (m <= 3 || a >= 3.5) return 'attention';
  return 'healthy';
}

/** Keep the AI label unless it is 2+ levels milder than what the scores show. */
export function reconcileRisk(ai: EntryRisk | null | undefined, mood: number | null, anxiety: number | null): EntryRisk | null {
  const fromScores = riskFromScores(mood, anxiety);
  if (!ai) return fromScores;
  if (fromScores && ORDER[fromScores] - ORDER[ai] >= 2) return fromScores;
  return ai;
}
