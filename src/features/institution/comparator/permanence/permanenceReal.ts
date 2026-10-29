// Builds the Radar de Permanência model from real aggregated student answers
// (get_institution_permanence RPC: per semester/unit counts, units with n<10 already removed).
import { MODULES } from '@/features/permanence/instrument';
import type { Item, Mult, PermModel, PermUnit } from './permanenceModel';

export interface RealUnitRow { semester: string; unit_id: string; unit_name: string; n: number; est: number; dist: Record<string, Record<string, number>> }

const Q = Object.fromEntries(MODULES.flatMap((m) => m.items).map((q) => [q.id, q]));

/** Panel item key -> instrument question id. */
export const ITEM_MAP: Record<string, string> = {
  remat: '6.1', tranc: '6.2', aband: '6.3', mudar: '6.4', concl: '6.6', escolha: '6.5', altern: '6.7',
  food: '2.1', transport: '2.2', housing: '2.3', digital: '2.4', costs: '2.5', finAtt: '2.6', evSup: '9.3',
  know: '7.1', ease: '7.2', comfort: '7.3', integ: '7.4', clear: '7.6', respect: '8.1', safety: '8.3', whom: '8.4',
};
const EXP_MAP: Record<string, (string | null)[]> = {
  pert: ['5.1', '5.2', '5.3', '5.4', '5.5'],
  curso: ['4.1', '4.2', '4.3', '4.4', '4.5', '3.5'],
  acad: [null, '3.1', '3.3', '3.4', null],
};

const KNOWN: Record<string, string> = { contagem: 'CT', 'itajubá': 'IT', 'montes claros': 'MC' };
const unitKey = (name: string) => {
  const known = KNOWN[name.replace(/^Afya\s+/i, '').toLowerCase()];
  if (known) return known;
  const w = name.replace(/^Afya\s+/i, '').split(/\s+/).filter((x) => x.length > 2 || /^[A-Z]/.test(x));
  return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
};

/** Percent distribution (5 points) of a single-choice question over the unit's respondents. */
export function pctDist(row: RealUnitRow, qid: string): number[] {
  const opts = Q[qid].options.slice(0, 5);
  const c = opts.map((o) => row.dist[qid]?.[o] ?? 0);
  const t = c.reduce((a, b) => a + b, 0);
  return t ? c.map((x) => (x / t) * 100) : opts.map(() => 20);
}
const pctOf = (row: RealUnitRow, qid: string, opts: string[]) => {
  const d = row.dist[qid] ?? {}; const t = Object.values(d).reduce((a, b) => a + b, 0);
  return t ? (opts.reduce((a, o) => a + (d[o] ?? 0), 0) / t) * 100 : 0;
};
/** Multi-choice: % of respondents that ticked each option (excluding exclusive "none" options when asked). */
const multiPct = (row: RealUnitRow, qid: string, keepExclusive = true) => {
  const o: Record<string, number> = {};
  Q[qid].options.forEach((opt) => { if (keepExclusive || !Q[qid].exclusive.includes(opt)) o[opt] = ((row.dist[qid]?.[opt] ?? 0) / row.n) * 100; });
  return o;
};

function multiBlock(rows: RealUnitRow[], units: PermUnit[], qid: string, keepExclusive = true): { base: Record<string, number>; mult: Mult } {
  const per = rows.map((r) => multiPct(r, qid, keepExclusive));
  const N = rows.reduce((a, r) => a + r.n, 0);
  const base: Record<string, number> = {};
  Object.keys(per[0] ?? {}).forEach((l) => { base[l] = per.reduce((a, p, i) => a + p[l] * rows[i].n, 0) / N; });
  const mult: Mult = {};
  units.forEach((u, i) => { mult[u.k] = {}; Object.keys(base).forEach((l) => { mult[u.k][l] = base[l] ? per[i][l] / base[l] : 1; }); });
  return { base, mult };
}

export function semestersOf(rows: RealUnitRow[]): string[] {
  return [...new Set(rows.map((r) => r.semester))].sort();
}

export function buildRealModel(base: PermModel, all: RealUnitRow[], semester: string): PermModel | null {
  const rows = all.filter((r) => r.semester === semester && r.n >= 10);
  if (!rows.length) return null;
  const m: PermModel = JSON.parse(JSON.stringify(base));
  const units: PermUnit[] = rows.map((r) => { const k = unitKey(r.unit_name); return { k, ini: k, nome: r.unit_name.replace(/^Afya\s+/i, ''), n: r.n, est: Math.max(r.est, r.n) }; });
  m.units = units;
  m.tilt = {};
  const perUnit = (qid: string) => Object.fromEntries(units.map((u, i) => [u.k, pctDist(rows[i], qid)]));
  const real = (it: Item, qid: string): Item => ({ ...it, lab: Q[qid].options.slice(0, 5), b: perUnit(qid)[units[0].k], bu: perUnit(qid) });
  Object.entries(ITEM_MAP).forEach(([k, qid]) => { if (m.items[k]) m.items[k] = real(m.items[k], qid); });
  Object.entries(EXP_MAP).forEach(([g, ids]) => {
    if (!m.exp[g]) return;
    m.exp[g].items = m.exp[g].items.map((it, i) => (ids[i] ? real(it, ids[i]!) : null)).filter(Boolean) as Item[];
  });
  const scalar = (f: (r: RealUnitRow) => number) => Object.fromEntries(units.map((u, i) => [u.k, Math.round(f(rows[i]))]));
  m.recov = scalar((r) => pctOf(r, '6.6', ['Grande intenção', 'Intenção total']));
  m.disc = scalar((r) => pctOf(r, '8.2', ['Sim']));
  m.evAny = scalar((r) => 100 - ((r.dist['9.1']?.['Nenhum desses'] ?? 0) / r.n) * 100);
  m.hidden = Object.fromEntries(units.map((u, i) => [u.k, Q['7.5'].options.map((o) => pctOf(rows[i], '7.5', [o]))]));
  m.ctx = Object.fromEntries(units.map((u, i) => {
    const r = rows[i];
    return [u.k, {
      w: Math.round(pctOf(r, '1.1', ['21 a 40 horas', 'Mais de 40 horas'])),
      c: Math.round(100 - ((r.dist['1.2']?.['Nenhuma dessas'] ?? 0) / r.n) * 100),
      t: Math.round(pctOf(r, '1.3', ['61 a 120 minutos', 'Mais de 120 minutos'])),
      a: Math.round(pctOf(r, '1.3', ['Mais de 120 minutos'])),
      night: base.ctx[Object.keys(base.ctx)[0]]?.night ?? 0,
    }];
  }));
  const thr = multiBlock(rows, units, '6.8'); m.thr = thr.base; m.thrm = thr.mult;
  const evs = multiBlock(rows, units, '9.1', false); m.evs = evs.base; m.evm = evs.mult;
  const first = multiBlock(rows, units, '10.1'); m.first = first.base; m.firstm = first.mult;
  const wel = multiBlock(rows, units, '10.2', false); m.wel = wel.base; m.welm = wel.mult;
  const fmt = multiBlock(rows, units, '10.3', false); m.fmt = fmt.base; m.fmtm = fmt.mult;
  const tim = multiBlock(rows, units, '10.4'); m.tim = tim.base;
  return m;
}
