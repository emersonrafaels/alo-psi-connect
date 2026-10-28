export type Kpi = { sem: string; unit: string; marked: number; done: number; noshow: number; people: number; wait: number | null; rating: number | null; rating_n: number; recommend: number | null };
export type Svc = { sem: string; unit: string; service: string; marked: number; done: number };
export type Heat = { sem: string; unit: string; wd: number; per: string; n: number };
export type Reason = { sem: string; unit: string; reason: string; n: number };
export type Cap = { sem: string; unit: string; service: string; per: string; hours: number };
export type Payload = { weeks: Record<string, number>; kpi: Kpi[]; svc: Svc[]; heat: Heat[]; reasons: Reason[]; cap: Cap[] };

export const SERVICES: Record<string, string> = { psicologia: 'Psicologia', psiquiatria: 'Psiquiatria', nucleo: 'Núcleo da unidade', mentoria: 'Mentoria' };
export const PERIODS: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', madrugada: 'Madrugada' };
export const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const REASONS: Record<string, string> = { aula_prova: 'Conflito com aula ou prova', esqueceu: 'Esqueceu o horário', deslocamento: 'Deslocamento', nao_precisava: 'Sentiu que não precisava', outros: 'Outros motivos' };

/** Demand/offer ratio → status (>115% above capacity, ≥80% at limit, else spare). */
export function capacityStatus(demand: number, offer: number): 'over' | 'limit' | 'spare' {
  if (offer <= 0) return demand > 0 ? 'over' : 'spare';
  const r = demand / offer;
  return r > 1.15 ? 'over' : r >= 0.8 ? 'limit' : 'spare';
}
export const STATUS_LABEL = { over: 'Acima da capacidade', limit: 'No limite', spare: 'Sobra agenda' } as const;

/** Percentage-point gap between demand share and agenda share. Positive = agenda missing. */
export const periodGap = (demandPct: number, agendaPct: number) => Math.round(demandPct - agendaPct);
export const gapLabel = (g: number) => (g > 0 ? `faltam ${g} p.p. de agenda` : 'agenda acima da procura');

export const shares = (m: Record<string, number>) => {
  const t = Object.values(m).reduce((s, v) => s + v, 0);
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, t ? Math.round((v / t) * 100) : 0]));
};

export type MetricKey = 'ocup' | 'espera' | 'compar' | 'noite' | 'horas';
/** Whether a unit value deserves a warning colour for the chosen metric. */
export function warn(metric: MetricKey, v: number | null): boolean {
  if (v == null) return false;
  if (metric === 'ocup') return v >= 95;
  if (metric === 'espera') return v > 7;
  if (metric === 'compar') return v < 84;
  return false;
}
/** Best unit = lowest wait, ties broken by attendance. */
export function bestUnit<T extends { espera: number | null; compar: number | null }>(rows: T[]): T | null {
  const ok = rows.filter((r) => r.espera != null);
  if (ok.length < 2) return null;
  return [...ok].sort((a, b) => a.espera! - b.espera! || (b.compar ?? 0) - (a.compar ?? 0))[0];
}

export function serviceSentence(rows: { nome: string; oferta: number; procura: number }[]): string {
  if (!rows.length) return '';
  const r = rows.map((s) => ({ ...s, ratio: s.oferta ? s.procura / s.oferta : 0 }));
  const top = [...r].sort((a, b) => b.ratio - a.ratio)[0];
  const low = [...r].sort((a, b) => a.ratio - b.ratio)[0];
  const parts: string[] = [];
  if (top.ratio > 1) parts.push(`${top.nome} tem procura ${Math.round((top.ratio - 1) * 100)}% acima da agenda`);
  if (low.ratio < 0.8 && low !== top) parts.push(`${low.nome.toLowerCase()} usa ${Math.round(low.ratio * 100)}% das horas`);
  if (!parts.length) return 'A oferta acompanha a procura em todos os serviços.';
  return parts.join('; ') + (top.ratio > 1 && low.ratio < 0.8 ? '. Há espaço para remanejar.' : '.');
}
