/** Pure rules for the Jornada de cuidado page. Inputs are aggregates only. */
export const STAGES = ['Pedido iniciado', 'Triagem realizada', 'Encaminhamento enviado', 'Contato realizado', '1ª consulta realizada', 'Em acompanhamento'] as const;
export const ORIGINS: Record<string, string> = {
  buddy: 'Conversa com o Buddy', apoio: 'Direto na área de apoio', diario: 'Diário ou check-in', conteudo: 'Conteúdo ou prática', nucleo: 'Indicação do núcleo',
};
export const DESTS: Record<string, string> = {
  psicologia: 'Psicologia', nucleo: 'Núcleo da unidade', psiquiatria: 'Psiquiatria', mentoria: 'Mentoria', externo: 'Serviço externo', none: 'Ainda sem encaminhamento',
};
export const OUTCOMES: Record<string, string> = {
  consulta: '1ª consulta realizada', em_andamento: 'Em andamento', sem_retorno: 'Sem retorno ao contato', outro_recurso: 'Orientadas a outro recurso',
};

export type Flow = { sem: string; unit: string; origin: string; destination: string; outcome: string; stage: number; n: number };
export type Wait = { sem: string; unit: string; w1: number | null; w2: number | null; w3: number | null; w4: number | null; total: number | null };

/** People who reached each of the 6 stages (stage k counts everyone with stage >= k). */
export const stageCounts = (flows: Flow[]) =>
  STAGES.map((_, i) => flows.filter((f) => f.stage >= i + 1).reduce((s, f) => s + f.n, 0));

/** Drops between consecutive stages and the index of the largest drop before the 1st consult (transitions 0..3). */
export const stageLosses = (counts: number[]) => {
  const losses = counts.slice(1).map((c, i) => counts[i] - c);
  let worst = -1, max = -1;
  losses.slice(0, 4).forEach((l, i) => { if (l > max) { max = l; worst = i; } });
  return { losses, worst: max > 0 ? worst : -1 };
};

/** Percent of initial requests at each stage. */
export const curve = (counts: number[]) => counts.map((c) => (counts[0] ? Math.round((c / counts[0]) * 100) : 0));

/** Sum of n grouped by a key. */
export const sumBy = (flows: Flow[], key: (f: Flow) => string) => {
  const m = new Map<string, number>();
  flows.forEach((f) => m.set(key(f), (m.get(key(f)) ?? 0) + f.n));
  return m;
};

/** Ribbons between two columns of the flow diagram. */
export const links = (flows: Flow[], from: (f: Flow) => string, to: (f: Flow) => string) => {
  const m = new Map<string, { from: string; to: string; n: number }>();
  flows.forEach((f) => {
    const k = `${from(f)}→${to(f)}`;
    const cur = m.get(k) ?? { from: from(f), to: to(f), n: 0 };
    cur.n += f.n; m.set(k, cur);
  });
  return [...m.values()].filter((l) => l.n > 0);
};

/** Weighted median approximation: weighted mean of per-unit medians. */
export const pooledWait = (waits: Wait[], key: keyof Omit<Wait, 'sem' | 'unit'>, weights: Record<string, number>) => {
  const ok = waits.filter((w) => w[key] != null && (weights[w.unit] ?? 0) > 0);
  const tot = ok.reduce((s, w) => s + weights[w.unit], 0);
  return tot ? ok.reduce((s, w) => s + (w[key] as number) * weights[w.unit], 0) / tot : null;
};
