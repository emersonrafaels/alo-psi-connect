export const MIN_GROUP = 10;

export type ClinicalInstitution = {
  id: string; name: string; logo_url: string | null; students: number; elevated: number;
  triage_open: number; triage_urgent: number; followups_overdue: number; care_stalled: number; radar_answered: number;
  alert?: number; attention?: number; healthy?: number; no_data?: number;
  /** Null when the institution has fewer than MIN_GROUP students. */
  elevated_untriaged?: number | null; elevated_7d?: number | null;
  diary_respondents?: number;
  /** Averages null when fewer than MIN_GROUP diary respondents; flow times null when fewer than MIN_GROUP requests. */
  avg_mood?: number | null; avg_anx?: number | null; avg_sleep?: number | null; avg_energy?: number | null;
  hours_to_triage?: number | null; days_to_consult?: number | null;
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

/** Portuguese labels for triage outcomes (resolution_type); unknown codes become readable text. */
export const OUTCOME_LABELS: Record<string, string> = {
  encaminhado_profissional: 'Encaminhado a profissional',
  acompanhamento_interno: 'Acompanhamento interno',
  melhora_espontanea: 'Melhora espontânea',
  contato_familia: 'Contato com a família',
  sem_necessidade: 'Sem necessidade de intervenção',
  monitoring: 'Em monitoramento',
  monitoring_completed: 'Monitoramento concluído',
  outro: 'Outro desfecho',
};
export const outcomeLabel = (k: string) => {
  if (OUTCOME_LABELS[k]) return OUTCOME_LABELS[k];
  const t = k.replace(/_/g, ' ').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : 'Outro desfecho';
};

/** Detail modal definitions for each clickable indicator. */
export type IndicatorDetail = {
  title: string; help: string; calc: string; interpret: string;
  field?: 'elevated' | 'alert' | 'attention' | 'healthy' | 'no_data' | 'elevated_untriaged' | 'elevated_7d' | 'triage_open' | 'triage_urgent' | 'followups_overdue' | 'care_stalled' | 'radar_answered'
    | 'avg_mood' | 'avg_anx' | 'avg_sleep' | 'avg_energy' | 'hours_to_triage' | 'days_to_consult';
  /** pct = share of students; avg = 1–5 scale; hours/days = time; default = count. */
  kind?: 'pct' | 'avg' | 'hours' | 'days'; to?: string;
};
const T = '/portal-institucional/triagem';
export const INDICATOR_DETAILS: Record<string, IndicatorDetail> = {
  'Sinal elevado sem triagem': { field: 'elevated_untriaged',  title: 'Sinal elevado sem triagem', help: HELP['Sinal elevado sem triagem'], calc: 'Últimos 30 dias: alunos cujo registro mais recente foi classificado como Sinal elevado e que não têm triagem aberta ou concluída no período.', interpret: 'Deve ficar em zero. Qualquer valor acima pede abertura de triagem no mesmo dia.', to: T },
  'Prioridade alta em aberto': { title: 'Prioridade alta em aberto', help: HELP['Prioridade alta em aberto'], calc: 'Triagens com status pendente ou em andamento e prioridade urgente ou alta, sem limite de período.', interpret: 'Mostra a fila mais sensível. Priorize contato e encaminhamento nas instituições com mais casos.', field: 'triage_urgent', to: T },
  'Retornos vencidos': { title: 'Retornos vencidos', help: HELP['Retornos vencidos'], calc: 'Triagens em aberto cuja data de retorno combinada já passou.', interpret: 'Indica acompanhamentos esquecidos. Reavalie, renove o plano ou encerre o caso.', field: 'followups_overdue', to: T },
  'Pedidos parados > 3 dias': { title: 'Pedidos de apoio parados', help: HELP['Pedidos parados > 3 dias'], calc: 'Pedidos de apoio abertos pelos alunos há mais de 3 dias que ainda não tiveram triagem nem desfecho.', interpret: 'Cada pedido parado é um aluno esperando resposta. A meta é responder em até 3 dias.', field: 'care_stalled', to: '/portal-institucional/comparador' },
  'Triagens em aberto': { title: 'Triagens em aberto', help: HELP['Triagens em aberto'], calc: 'Todas as triagens pendentes ou em andamento, de qualquer prioridade.', interpret: 'Mede o volume de trabalho da equipe. Compare com a capacidade de cada instituição.', field: 'triage_open', to: T },
  'Sinal elevado em 7 dias': { field: 'elevated_7d',  title: 'Sinal elevado em 7 dias', help: HELP['Sinal elevado em 7 dias'], calc: 'Registros do diário analisados como Sinal elevado nos últimos 7 dias.', interpret: 'Aumentos indicam novos casos surgindo; confira se viraram triagem.', to: T },
  critical: { title: 'Sinal elevado', help: HELP.critical, calc: 'Último registro analisado de cada aluno nos últimos 30 dias, classificado no nível mais alto.', interpret: 'Apoio à priorização, nunca diagnóstico. Percentuais por instituição só aparecem com 10 ou mais alunos.', field: 'elevated', kind: 'pct', to: T },
  alert: { field: 'alert', kind: 'pct',  title: 'Alerta', help: HELP.alert, calc: 'Último registro analisado nos últimos 30 dias classificado como Alerta.', interpret: 'Acompanhe de perto; pode evoluir para Sinal elevado.', to: T },
  attention: { field: 'attention', kind: 'pct',  title: 'Atenção', help: HELP.attention, calc: 'Último registro analisado nos últimos 30 dias classificado como Atenção.', interpret: 'Bom momento para ações preventivas, como práticas e encontros.' },
  healthy: { field: 'healthy', kind: 'pct',  title: 'Sem sinais prioritários', help: HELP.healthy, calc: 'Último registro analisado nos últimos 30 dias sem sinais que peçam prioridade.', interpret: 'Não significa ausência de dificuldade, apenas que o registro não pediu prioridade.' },
  none: { field: 'no_data', kind: 'pct',  title: 'Dados insuficientes', help: HELP.none, calc: 'Alunos vinculados sem registro analisado nos últimos 30 dias.', interpret: 'Valores altos indicam pouco uso do diário; incentive o engajamento.' },
  Humor: { field: 'avg_mood', kind: 'avg',  title: 'Humor médio', help: HELP.Humor, calc: 'Média dos valores de humor (1 a 5) dos registros dos últimos 30 dias, comparada com os 30 dias anteriores.', interpret: 'Maior é melhor. Quedas sozinhas não elevam o nível de sinal.' },
  Ansiedade: { field: 'avg_anx', kind: 'avg',  title: 'Ansiedade média', help: HELP.Ansiedade, calc: 'Média dos valores de ansiedade (1 a 5) dos últimos 30 dias, comparada com os 30 anteriores.', interpret: 'Menor é melhor. Altas persistentes sugerem ações coletivas de regulação.' },
  Sono: { field: 'avg_sleep', kind: 'avg',  title: 'Sono médio', help: HELP.Sono, calc: 'Média da qualidade de sono (1 a 5) dos últimos 30 dias, comparada com os 30 anteriores.', interpret: 'Maior é melhor. Quedas costumam coincidir com períodos de provas.' },
  Energia: { field: 'avg_energy', kind: 'avg',  title: 'Energia média', help: HELP.Energia, calc: 'Média da disposição (1 a 5) dos últimos 30 dias, comparada com os 30 anteriores.', interpret: 'Maior é melhor.' },
  hours_to_triage: { field: 'hours_to_triage', kind: 'hours',  title: 'Tempo até a triagem', help: HELP.hours_to_triage, calc: 'Média em horas entre a abertura do pedido de apoio e a triagem, nos últimos 90 dias.', interpret: 'Quanto menor, mais rápida a resposta da rede.' },
  days_to_consult: { field: 'days_to_consult', kind: 'days',  title: 'Tempo até a 1ª consulta', help: HELP.days_to_consult, calc: 'Média em dias entre o pedido de apoio e a primeira consulta, nos últimos 90 dias.', interpret: 'Quanto menor, mais rápido o acesso ao cuidado.' },
  radar: { title: 'Participação no Radar', help: HELP.radar, calc: 'Alunos que responderam o Radar de Permanência neste semestre, divididos pelo total de alunos vinculados.', interpret: 'Instituições com baixa participação podem divulgar o Radar por mensagem.', field: 'radar_answered', kind: 'pct', to: '/portal-institucional/comparador' },
};

export type BreakdownRow = { id: string; name: string; value: number | null; label: string };
/** Per-institution rows sorted desc; percentages hidden for groups under MIN_GROUP. */
export function breakdownRows(list: ClinicalInstitution[], d: IndicatorDetail): BreakdownRow[] {
  if (!d.field) return [];
  const f = d.field;
  return list.map((i) => {
    const raw = i[f] as number | null | undefined;
    const small = i.students < MIN_GROUP;
    let value: number | null;
    if (d.kind === 'pct') value = raw == null ? null : safePct(raw, i.students);
    else if (d.kind) value = raw == null ? null : Number(raw); // server already hides small samples
    else value = raw == null || (small && (f === 'elevated_untriaged' || f === 'elevated_7d')) ? null : raw;
    const n = (x: number, dg: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: dg });
    const label = value == null ? 'Dados protegidos'
      : d.kind === 'pct' ? `${value}%` : d.kind === 'avg' ? n(value, 1) : d.kind === 'hours' ? `${n(value, 1)}h` : d.kind === 'days' ? `${n(value, 1)}d` : n(value, 0);
    return { id: i.id, name: i.name, value, label };
  }).sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}
