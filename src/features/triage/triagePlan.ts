import { addDays, format } from 'date-fns';
import type { Risk } from './priorities';

export type TriagePriority = 'urgent' | 'high' | 'medium' | 'low';
export type TriageAction = 'refer_professional' | 'schedule_talk' | 'monitor' | 'contact_family';

/** Response time per priority, matching the guidance shown in the triage summary banner. */
export const PRIORITY_META: Record<TriagePriority, { label: string; hint: string; followUpDays: number; dot: string }> = {
  urgent: { label: 'Urgente', hint: 'Contato em até 24h', followUpDays: 1, dot: 'bg-red-500' },
  high: { label: 'Alta', hint: 'Acolhimento em até 7 dias', followUpDays: 7, dot: 'bg-orange-500' },
  medium: { label: 'Média', hint: 'Acompanhar em até 14 dias', followUpDays: 14, dot: 'bg-yellow-500' },
  low: { label: 'Baixa', hint: 'Monitorar próximos check-ins', followUpDays: 30, dot: 'bg-green-500' },
};

export const ACTION_META: Record<TriageAction, { label: string; hint: string }> = {
  refer_professional: { label: 'Encaminhar para profissional', hint: 'Atendimento psicológico ou psiquiátrico' },
  schedule_talk: { label: 'Agendar conversa', hint: 'Escuta individual com a equipe' },
  monitor: { label: 'Monitorar', hint: 'Acompanhar os próximos registros' },
  contact_family: { label: 'Contato com família', hint: 'Acionar a rede de apoio do aluno' },
};

export interface TriagePlan { priority: TriagePriority; action: TriageAction; followUpDays: number }

/** Starting point for the triage form; the team can change every field. */
export function suggestPlan(risk: Risk, keywordSeverity?: 'grave' | 'moderate' | null): TriagePlan {
  if (risk === 'critical' || keywordSeverity === 'grave') return plan('urgent', 'refer_professional');
  if (risk === 'alert') return plan('high', 'schedule_talk');
  if (risk === 'attention') return plan('medium', 'monitor');
  if (risk === 'no_data') return { priority: 'low', action: 'monitor', followUpDays: 7 };
  return plan('low', 'monitor');
}

const plan = (priority: TriagePriority, action: TriageAction): TriagePlan =>
  ({ priority, action, followUpDays: PRIORITY_META[priority].followUpDays });

/** `yyyy-MM-dd`, the value format of `<input type="date">`. */
export function followUpDate(days: number, today = new Date()): string {
  return format(addDays(today, days), 'yyyy-MM-dd');
}
