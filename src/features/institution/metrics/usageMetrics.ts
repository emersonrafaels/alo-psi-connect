export type FeatureKey = 'diario' | 'jornada' | 'praticas' | 'escalas' | 'encontros' | 'apoios' | 'buddy';

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  diario: 'Diário emocional',
  jornada: 'Jornada emocional',
  praticas: 'Práticas',
  escalas: 'Escalas',
  encontros: 'Encontros',
  apoios: 'Apoios',
  buddy: 'Buddy',
};

export interface UsageMetrics {
  total_students: number;
  kpis: {
    active: number; active_prev: number; wau: number; mau: number;
    diary: number; diary_prev: number; practices: number; practices_prev: number;
    scales: number; scales_prev: number; appointments: number; appointments_prev: number;
  };
  by_feature: Partial<Record<FeatureKey, number>>;
  funnel: { linked: number; accessed: number; one_feature: number; three_features: number; recurring: number };
  weekly: { week: string; active: number }[];
  heatmap: { dow: number; slot: number; n: number }[];
  retention: { w1?: number | null; w2?: number | null; w4?: number | null };
  courses: { course: string; unit: string | null; students: number; active_pct: number; prev_pct: number; top_feature: FeatureKey | null }[];
  hidden_courses: number;
  appointments: { total: number; done: number; cancelled: number; avg_lead_days: number | null };
  encounters: { registrations: number; attended: number };
  messages: { sent: number; read: number; replied: number };
}

/** Percentual inteiro; null quando não há base. */
export function pct(part: number, total: number): number | null {
  if (!total || total <= 0) return null;
  return Math.round((part / total) * 100);
}

/** Variação % vs. período anterior; null quando o anterior é zero. */
export function deltaPct(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface FunnelStep { label: string; value: number; pctOfLinked: number | null }

export function funnelSteps(f: UsageMetrics['funnel']): FunnelStep[] {
  const rows: [string, number][] = [
    ['Vinculados', f.linked],
    ['Primeiro acesso', f.accessed],
    ['Usaram 1+ recurso no período', f.one_feature],
    ['Usaram 3+ recursos', f.three_features],
    ['Ativos recorrentes (2+ semanas no mês)', f.recurring],
  ];
  return rows.map(([label, value]) => ({ label, value, pctOfLinked: pct(value, f.linked) }));
}

export const HEATMAP_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const HEATMAP_SLOTS = ['0–4h', '4–8h', '8–12h', '12–16h', '16–20h', '20–24h'];

/** Matriz [dia][faixa] com contagens e o máximo para escala de cor. */
export function heatmapMatrix(cells: UsageMetrics['heatmap']) {
  const m = Array.from({ length: 7 }, () => Array(6).fill(0) as number[]);
  let max = 0;
  for (const c of cells) {
    if (c.dow < 0 || c.dow > 6 || c.slot < 0 || c.slot > 5) continue;
    m[c.dow][c.slot] += c.n;
    max = Math.max(max, m[c.dow][c.slot]);
  }
  return { matrix: m, max };
}

/** Recursos ordenados por alunos, com percentual da base. */
export function featureRanking(byFeature: UsageMetrics['by_feature'], total: number) {
  return (Object.keys(FEATURE_LABELS) as FeatureKey[])
    .map((k) => ({ key: k, label: FEATURE_LABELS[k], students: byFeature[k] ?? 0, pct: pct(byFeature[k] ?? 0, total) ?? 0 }))
    .sort((a, b) => b.students - a.students);
}

export function toCsv(d: UsageMetrics): string {
  const lines = [
    'secao;indicador;valor',
    `geral;alunos vinculados;${d.total_students}`,
    ...Object.entries(d.kpis).map(([k, v]) => `destaques;${k};${v}`),
    ...featureRanking(d.by_feature, d.total_students).map((f) => `recursos;${f.label};${f.students}`),
    ...funnelSteps(d.funnel).map((s) => `funil;${s.label};${s.value}`),
    ...Object.entries(d.retention).map(([k, v]) => `retencao;${k};${v ?? ''}`),
    ...d.courses.map((c) => `curso;${c.unit ?? ''} - ${c.course};${c.active_pct}%`),
  ];
  return lines.join('\n');
}
