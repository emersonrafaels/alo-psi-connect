export type TriageRisk = 'critical' | 'alert' | 'attention' | 'healthy' | 'no_data';
export type CriticalSeverity = 'grave' | 'moderate';

const ORDER: TriageRisk[] = ['healthy', 'attention', 'alert', 'critical'];

/** Raise triage risk based on critical keywords found in the student's diary. */
export function escalateRisk(base: TriageRisk, severity: CriticalSeverity | null | undefined): TriageRisk {
  if (!severity) return base;
  if (severity === 'grave') return 'critical';
  if (base === 'no_data') return 'attention';
  const idx = ORDER.indexOf(base);
  return ORDER[Math.min(idx + 1, ORDER.length - 1)];
}
