import type { Item, Mult, PermModel, PermUnit } from './permanenceModel';

export const MIN_N = 10;
const v = (n: string) => `hsl(var(--rp-${n}))`;
export const C = {
  ink: v('ink'), text: v('text'), muted: v('muted'), deep: v('deep'), brand: v('brand'), mid: v('mid'), lav: v('lav'),
  lilac: v('lilac'), pale: v('pale'), soft: v('soft'), bg: v('bg'), card: v('card'), dot: v('dot'), lil2: v('lil2'),
  heat4: v('heat4'), rose: v('rose'), rose2: v('rose2'), roseBg: v('rose-bg'), roseFg: v('rose-fg'), onDeep: v('on-deep'), onDeepRose: v('on-deep-rose'),
};
export const LK = [C.deep, C.mid, C.pale, C.rose2, C.rose];
export const LK_LEGEND = ['Mais favorável', 'Favorável', 'Intermediária', 'Desfavorável', 'Mais desfavorável'].map((l, i) => ({ l, c: LK[i] }));
const UNIT_COLORS: [string, string][] = [[C.deep, C.onDeep], [C.mid, C.onDeep], [C.lilac, C.ink], [C.lav, C.ink], [C.brand, C.onDeep]];

export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
export const P = (x: number) => `${Math.round(x)}%`;

/** Units below MIN_N respondents never appear, alone or inside totals. */
export const visibleUnits = (m: PermModel): PermUnit[] => m.units.filter((u) => u.n >= MIN_N);

export function tilt(base: number[], dir: Item['dir'], s: number) {
  const out = base.map((p, i) => p * Math.exp(s * ((dir === 'risk' ? i : 4 - i) - 2) * 0.35));
  const t = sum(out);
  return out.map((x) => (x / t) * 100);
}

export function makeEngine(m: PermModel, rec: string) {
  const UN = visibleUnits(m);
  const NT = sum(UN.map((u) => u.n)) || 1;
  const EST = sum(UN.map((u) => u.est)) || 1;
  const CUR = rec === 'all' ? null : UN.find((u) => u.k === rec) ?? null;
  const R = CUR ? CUR.k : 'all';
  const weighted = (f: (k: string) => number) => sum(UN.map((u) => f(u.k) * u.n)) / NT;
  const weightedArr = (f: (k: string) => number[], len: number) => Array.from({ length: len }, (_, i) => weighted((k) => f(k)[i] ?? 0));
  const scal = (o: Record<string, number>, r = R) => (r === 'all' ? weighted((k) => o[k] ?? 0) : o[r] ?? 0);
  const arr = (o: Record<string, number[]>, len: number, r = R) => (r === 'all' ? weightedArr((k) => o[k] ?? [], len) : o[r] ?? []);

  const distU = (it: Item, k: string) => tilt(it.b, it.dir, m.tilt[it.dom]?.[k] ?? 0);
  const dist = (it: Item, r = R) => (r !== 'all' ? distU(it, r) : weightedArr((k) => distU(it, k), 5));
  const ord = (it: Item, d: number[]) => {
    const idx = it.dir === 'risk' ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
    return { p: idx.map((i) => d[i]), lab: idx.map((i) => it.lab[i]) };
  };
  const fav = (it: Item, r = R) => { const o = ord(it, dist(it, r)); return o.p[0] + o.p[1]; };
  const unf = (it: Item, r = R) => { const o = ord(it, dist(it, r)); return o.p[3] + o.p[4]; };
  const risk3 = (it: Item, r = R) => { const o = ord(it, dist(it, r)); return o.p[2] + o.p[3] + o.p[4]; };
  const multiU = (base: Record<string, number>, mult: Mult, k: string) => {
    const mm = mult[k] || {}; const o: Record<string, number> = {};
    Object.keys(base).forEach((l) => { o[l] = base[l] * (mm[l] || 1); });
    return o;
  };
  const multi = (base: Record<string, number>, mult: Mult, norm = false, r = R) => {
    const fin = (o: Record<string, number>) => {
      if (!norm) return o; const t = sum(Object.values(o)); const x: Record<string, number> = {};
      Object.keys(o).forEach((l) => { x[l] = (o[l] / t) * 100; }); return x;
    };
    if (r !== 'all') return fin(multiU(base, mult, r));
    const acc: Record<string, number> = {}; Object.keys(base).forEach((l) => { acc[l] = 0; });
    UN.forEach((u) => { const o = fin(multiU(base, mult, u.k)); Object.keys(o).forEach((l) => { acc[l] += o[l] * u.n; }); });
    Object.keys(acc).forEach((l) => { acc[l] /= NT; });
    return acc;
  };
  const unitStyle = (k: string) => { const i = m.units.findIndex((u) => u.k === k); return UNIT_COLORS[i % UNIT_COLORS.length]; };
  return { UN, NT, EST, CUR, R, dist, ord, fav, unf, risk3, multi, scal, arr, unitStyle };
}
export type Engine = ReturnType<typeof makeEngine>;

export function bars(o: Record<string, number>, opts: { skip?: string[]; hl?: number; keepOrder?: boolean; top?: number } = {}) {
  let keys = Object.keys(o).filter((l) => !(opts.skip || []).includes(l));
  if (!opts.keepOrder) keys.sort((a, b) => o[b] - o[a]);
  if (opts.top) keys = keys.slice(0, opts.top);
  const max = Math.max(...keys.map((l) => o[l]), 1);
  return keys.map((l, i) => ({ l, v: P(o[l]), w: `${(o[l] / max) * 100}%`, c: opts.hl && i < opts.hl ? C.brand : C.mid, rank: String(i + 1).padStart(2, '0'), fw: i === 0 ? 600 : 400 }));
}

export interface LkRow { label: string; p: number[]; lab: string[]; fav: number; unf: number; L: number; fw?: number; segs?: { left: string; w: string; c: string; tip: string; r: string }[]; favT?: string; unfT?: string }
export function lkRow(e: Engine, label: string, it: Item, r?: string, extra: Partial<LkRow> = {}): LkRow {
  const o = e.ord(it, e.dist(it, r ?? e.R));
  return { label, p: o.p, lab: o.lab, fav: o.p[0] + o.p[1], unf: o.p[3] + o.p[4], L: o.p[0] + o.p[1] + o.p[2] / 2, ...extra };
}
/** Diverging bars: the neutral midpoint of every row lines up on the same centre. */
export function layout(rows: LkRow[]) {
  const M = Math.max(...rows.map((r) => Math.max(r.L, 100 - r.L)));
  rows.forEach((r) => {
    let x = ((M - r.L) / (2 * M)) * 100;
    r.segs = r.p.map((val, i) => {
      const w = (val / (2 * M)) * 100;
      const s = { left: `${x}%`, w: `${w}%`, c: LK[i], tip: `${r.lab[i]}: ${P(val)}`, r: i === 0 ? '6px 0 0 6px' : i === 4 ? '0 6px 6px 0' : '0' };
      x += w; return s;
    });
    r.favT = P(r.fav); r.unfT = P(r.unf);
  });
  return rows;
}

/** 100-dot grid: profile flags consistent with the context counts. */
export function contextFlags(c: { w: number; c: number; t: number; a: number }) {
  const flags = Array.from({ length: 100 }, () => ({ w: false, c: false, t: false }));
  let idx = 0;
  for (let k = 0; k < c.a && idx < 100; k++, idx++) Object.assign(flags[idx], { w: true, c: true, t: true });
  const wExtra = c.w - c.a, tWithW = Math.round((c.t - c.a) * 0.3);
  for (let k = 0; k < wExtra && idx < 100; k++, idx++) { flags[idx].w = true; if (k < tWithW) flags[idx].t = true; }
  for (let k = 0; k < c.c - c.a && idx < 100; k++, idx++) flags[idx].c = true;
  for (let k = 0; k < c.t - c.a - tWithW && idx < 100; k++, idx++) flags[idx].t = true;
  return flags;
}

export function heat(x: number): [string, string] {
  if (x >= 70) return [C.deep, C.onDeep];
  if (x >= 58) return [C.mid, C.onDeep];
  if (x >= 46) return [C.lilac, C.ink];
  if (x >= 36) return [C.heat4, C.ink];
  return [C.roseBg, C.roseFg];
}
