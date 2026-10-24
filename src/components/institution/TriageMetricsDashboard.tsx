import type { StudentRiskData, TriageRecord } from '@/hooks/useStudentTriage';
import { TeamMetricsDashboard, type MetricsNavTarget } from '@/features/triage/metrics/TeamMetricsDashboard';

export type { MetricsNavTarget };

interface TriageMetricsDashboardProps {
  triageRecords: TriageRecord[];
  students: StudentRiskData[];
  periodDays?: number;
  onPeriodChange?: (days: number) => void;
  variant?: 'full' | 'compact';
  nameOf: (patientId: string) => string;
  onOpenStudent?: (patientId: string) => void;
  onNavigate?: (target: MetricsNavTarget) => void;
}

/** Team metrics for the triage portal; the implementation lives in `src/features/triage/metrics/`. */
export function TriageMetricsDashboard({ triageRecords, periodDays = 15, ...rest }: TriageMetricsDashboardProps) {
  return <TeamMetricsDashboard records={triageRecords} periodDays={periodDays} {...rest} />;
}
