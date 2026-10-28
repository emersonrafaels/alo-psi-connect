/** Pure helpers for the Comparador "Visão geral". All inputs are aggregates. */
import { bandOf } from '../scaleBands';

export type InstLike = { code: string; label: string; short: string; higherIsBetter: boolean };
export type Stat = { n: number; avg: number | null };

/** Distance of a group to the institution, in %, oriented so that positive is always better. */
export const relDistance = (higherIsBetter: boolean, group: number | null, inst: number | null): number | null => {
  if (group == null || inst == null || inst === 0) return null;
  const raw = ((group - inst) / Math.abs(inst)) * 100;
  return higherIsBetter ? raw : -raw;
};

/** Mean of available distances; null when none is available. */
export const meanDistance = (values: (number | null)[]) => {
  const ok = values.filter((v): v is number => v != null);
  return ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : null;
};

const num = (v: number, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (v: number, d = 1) => `${v >= 0 ? '+' : '−'}${num(Math.abs(v), d)}`;

export type ChangeItem = { strong: string; rest: string; tone: 'good' | 'bad' | 'flat' };

/** Up to three plain-language "what changed" sentences built only from aggregates. */
export const buildChanges = (p: {
  previous: string | null;
  who: Stat; whoPrev: Stat;
  population: number; whoPrevN: number;
  unitDistances: { unit: string; values: (number | null)[] }[];
}): ChangeItem[] => {
  const out: ChangeItem[] = [];
  if (p.who.avg != null) {
    const band = bandOf('WHO5', p.who.avg);
    const range = band ? ` (${band.from}–${band.to})` : '';
    if (p.whoPrev.avg != null) {
      const d = p.who.avg - p.whoPrev.avg;
      const verb = Math.abs(d) < 0.5 ? 'ficou estável em' : d > 0 ? 'subiu para' : 'caiu para';
      out.push({
        strong: `Bem-estar mental ${verb} ${num(p.who.avg)}`,
        rest: ` (${signed(d)} pt)${band ? `, na faixa ${band.label} do WHO-5${range}` : ''}.`,
        tone: Math.abs(d) < 0.5 ? 'flat' : d > 0 ? 'good' : 'bad',
      });
    } else {
      out.push({ strong: `Bem-estar mental em ${num(p.who.avg)}`, rest: band ? `, na faixa ${band.label} do WHO-5${range}.` : '.', tone: 'flat' });
    }
  }
  const above = p.unitDistances.filter((u) => u.values.some((v) => v != null) && u.values.every((v) => v == null || v > 0)).map((u) => u.unit);
  const below = p.unitDistances.filter((u) => u.values.some((v) => v != null) && u.values.every((v) => v == null || v < 0)).map((u) => u.unit);
  if (above.length || below.length) {
    const a = above.length ? `${above.join(', ')} fica acima da média em todas as escalas` : '';
    const b = below.length ? `${below.join(', ')}, abaixo em todas` : '';
    out.push({ strong: a || `${below.join(', ')} fica abaixo da média em todas as escalas`, rest: a && b ? `; ${b}.` : '.', tone: above.length ? 'good' : 'bad' });
  }
  if (p.population > 0 && p.who.n > 0) {
    const cov = Math.round((p.who.n / p.population) * 100);
    const prev = Math.round((p.whoPrevN / p.population) * 100);
    const dp = p.previous && p.whoPrevN ? ` (${cov - prev >= 0 ? '+' : '−'}${Math.abs(cov - prev)} p.p.)` : '';
    out.push({
      strong: `Cobertura do WHO-5 em ${cov}%`,
      rest: `${dp}: ${p.who.n.toLocaleString('pt-BR')} de ${p.population.toLocaleString('pt-BR')} estudantes.`,
      tone: !dp ? 'flat' : cov >= prev ? 'good' : 'bad',
    });
  }
  return out.slice(0, 3);
};

/** Distance bucket used by the matrix view. */
export const distanceTone = (pct: number | null): 'worse2' | 'worse1' | 'near' | 'better1' | 'better2' | 'none' => {
  if (pct == null) return 'none';
  if (pct <= -8) return 'worse2';
  if (pct <= -3) return 'worse1';
  if (pct < 3) return 'near';
  if (pct < 8) return 'better1';
  return 'better2';
};

/** Radar point for axis i of n at radius r around (cx, cy), starting at the top. */
export const radarPoint = (i: number, n: number, r: number, cx: number, cy: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};
