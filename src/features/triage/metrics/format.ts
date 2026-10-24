import { RESOLUTION_TYPE_LABEL } from '@/components/institution/TriageResolutionDialog';
import { ACTION_META, type TriageAction } from '../triagePlan';
import type { Breakdowns } from './teamMetrics';

export const fmt = (v: number | null | undefined, digits = 1) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: digits });

export const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export const actionRows = (b: Breakdowns) =>
  b.byAction.map((a) => ({ label: ACTION_META[a.key as TriageAction]?.label ?? a.key, value: a.count }));

export const resolutionRows = (b: Breakdowns) =>
  b.byResolution.map((r) => ({ label: RESOLUTION_TYPE_LABEL[r.key] ?? r.key, value: r.count }));
