export const MIN_GROUP = 10;

export type ClinicalInstitution = {
  id: string; name: string; logo_url: string | null; students: number; elevated: number;
  triage_open: number; triage_urgent: number; followups_overdue: number; care_stalled: number; radar_answered: number;
};
type Avg = { mood: number | null; anx: number | null; sleep: number | null; energy: number | null } | null;
export type ClinicalSummary = {
  students: number; levels: Record<string, number> | null; elevated_untriaged: number; triage_open: number;
  triage_urgent: number; followups_overdue: number; care_stalled: number; elevated_7d: number;
  averages: { cur: Avg; prev: Avg } | null; engaged_7d: number;
  flow: { hours_to_triage: number | null; days_to_consult: number | null; resolved_30d: number; outcomes: Record<string, number> };
  radar_semester: string; radar_answered: number; appointments_week: number;
  sessions_week: { id: string; title: string; date: string; time: string; free_spots: number }[];
  by_institution: ClinicalInstitution[];
};

/** Percentage hidden (null) for groups under the minimum size. */
export const safePct = (part: number, total: number) => (total < MIN_GROUP || total === 0 ? null : Math.round((part / total) * 100));

/** Weighted priority: urgent work weighs most, then overdue returns, stalled requests, open triage and elevated share. */
export function priorityScore(i: ClinicalInstitution): number {
  const elevatedPct = safePct(i.elevated, i.students) ?? 0;
  return i.triage_urgent * 5 + i.followups_overdue * 3 + i.care_stalled * 3 + i.triage_open + elevatedPct / 5;
}

export type Status = 'critical' | 'warning' | 'ok';
export function institutionStatus(i: ClinicalInstitution): Status {
  if (i.triage_urgent > 0 || i.followups_overdue > 0) return 'critical';
  if (i.triage_open > 0 || i.care_stalled > 0 || (safePct(i.elevated, i.students) ?? 0) >= 15) return 'warning';
  return 'ok';
}

export const rankInstitutions = (list: ClinicalInstitution[]) => [...list].sort((a, b) => priorityScore(b) - priorityScore(a));

/** Trend of a metric; for anxiety a rise is worse. */
export function trend(cur: number | null | undefined, prev: number | null | undefined, inverted = false): 'up' | 'down' | 'flat' | null {
  if (cur == null || prev == null) return null;
  const d = cur - prev;
  if (Math.abs(d) < 0.05) return 'flat';
  return d > 0 ? 'up' : 'down';
}
export function trendIsGood(dir: 'up' | 'down' | 'flat' | null, inverted = false): boolean | null {
  if (!dir || dir === 'flat') return null;
  return inverted ? dir === 'down' : dir === 'up';
}

export const LEVELS = [
  { key: 'critical', label: 'Sinal elevado', tone: 'bg-destructive' },
  { key: 'alert', label: 'Alerta', tone: 'bg-destructive/60' },
  { key: 'attention', label: 'Atenção', tone: 'bg-destructive/30' },
  { key: 'healthy', label: 'Sem sinais prioritários', tone: 'bg-success' },
  { key: 'none', label: 'Dados insuficientes', tone: 'bg-muted-foreground/40' },
] as const;

/** Plain-language explanations shown in the Coordenação clínica tooltips. */
export const HELP: Record<string, string> = {
  'Sinal elevado sem triagem': 'Alunos com registro classificado como Sinal elevado nos últimos 30 dias e nenhuma triagem no período. Ação: abrir uma triagem.',
  'Prioridade alta em aberto': 'Triagens pendentes ou em andamento marcadas como prioridade urgente ou alta. Ação: priorizar contato e encaminhamento.',
  'Retornos vencidos': 'Triagens em aberto cuja data de retorno já passou. Ação: reavaliar, renovar o plano ou encerrar o caso.',
  'Pedidos parados > 3 dias': 'Pedidos de apoio feitos pelos alunos há mais de 3 dias sem triagem ou desfecho. Ação: dar a primeira resposta.',
  'Triagens em aberto': 'Total de triagens pendentes ou em andamento na rede, de qualquer prioridade.',
  'Sinal elevado em 7 dias': 'Registros analisados como Sinal elevado nos últimos 7 dias. Mostra se há novos casos surgindo.',
  critical: 'Último registro analisado com o maior nível de sinal. Pede triagem rápida. Não é diagnóstico.',
  alert: 'Sinais relevantes no último registro; vale acompanhar de perto.',
  attention: 'Sinais leves; acompanhamento preventivo.',
  healthy: 'Último registro sem sinais que peçam prioridade.',
  none: 'Alunos sem registro analisado nos últimos 30 dias, por isso sem nível calculado.',
  Humor: 'Média do humor registrado no diário (1 a 5). Seta verde para cima = melhora frente aos 30 dias anteriores.',
  Ansiedade: 'Média da ansiedade (1 a 5). Aqui, seta para baixo em verde = melhora (menos ansiedade).',
  Sono: 'Média da qualidade de sono percebida (1 a 5), comparada com os 30 dias anteriores.',
  Energia: 'Média da disposição (1 a 5), comparada com os 30 dias anteriores.',
  engaged: 'Percentual dos alunos vinculados que fizeram ao menos um registro no diário nos últimos 7 dias.',
  hours_to_triage: 'Tempo médio entre o pedido de apoio e a triagem, nos últimos 90 dias.',
  days_to_consult: 'Tempo médio entre o pedido e a primeira consulta, nos últimos 90 dias.',
  radar: 'Percentual de alunos que responderam o Radar de Permanência neste semestre.',
  col_elevated: 'Percentual de alunos da instituição com Sinal elevado no último registro (oculto em grupos com menos de 10).',
  col_triage: 'Triagens pendentes ou em andamento.',
  col_urgent: 'Triagens em aberto com prioridade urgente ou alta.',
  col_overdue: 'Triagens em aberto com data de retorno vencida.',
  col_care: 'Pedidos de apoio há mais de 3 dias sem resposta.',
};
