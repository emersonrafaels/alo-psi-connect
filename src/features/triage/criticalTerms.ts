export type TriageRisk = 'critical' | 'alert' | 'attention' | 'healthy' | 'no_data';
export type CriticalSeverity = 'grave' | 'moderate';

/**
 * Phase 1: diary keywords are a separate text signal ("Sinal textual sensível")
 * and never change the numeric level. Kept for call-site compatibility.
 */
export function escalateRisk(base: TriageRisk, _severity: CriticalSeverity | null | undefined): TriageRisk {
  return base;
}
