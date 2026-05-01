/**
 * Helpers para Diário Emocional:
 * - Sanitização de termos em inglês remanescentes em insights de IA
 * - Parsing de insights estruturados (JSON) com fallback para markdown legado
 * - Cálculo de tendências e captions automáticos para gráficos
 * - Score de confiança baseado em quantidade de registros
 */

// -----------------------------
// Sanitização PT-BR
// -----------------------------

const EN_TO_PT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bSleep Hours\b/g, 'Horas de sono'],
  [/\bsleep hours\b/g, 'horas de sono'],
  [/\bSleep Quality\b/g, 'Qualidade do sono'],
  [/\bsleep quality\b/g, 'qualidade do sono'],
  [/\bMood Score\b/g, 'Humor'],
  [/\bmood score\b/g, 'humor'],
  [/\bEnergy Level\b/g, 'Energia'],
  [/\benergy level\b/g, 'energia'],
  [/\bAnxiety Level\b/g, 'Ansiedade'],
  [/\banxiety level\b/g, 'ansiedade'],
  [/\bStress Level\b/g, 'Nível de estresse'],
  [/\bJournal Text\b/g, 'Reflexão'],
];

export function sanitizeInsightText(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [re, replacement] of EN_TO_PT_REPLACEMENTS) {
    out = out.replace(re, replacement);
  }
  return out;
}

// -----------------------------
// Insight estruturado
// -----------------------------

export type InsightConfidence = 'very_low' | 'low' | 'medium' | 'high';
export type InsightRiskLevel = 'healthy' | 'attention' | 'alert' | 'critical';

export interface StructuredInsight {
  summary: string;
  positive_patterns: string[];
  attention_points: string[];
  possible_triggers: string[];
  suggested_actions: string[];
  detected_themes: string[];
  risk_level: InsightRiskLevel;
  confidence: InsightConfidence;
}

export type ParsedInsight =
  | { kind: 'structured'; data: StructuredInsight }
  | { kind: 'markdown'; text: string };

/**
 * Tenta interpretar o conteúdo de um insight como JSON estruturado.
 * Se falhar, retorna como markdown sanitizado (compatibilidade com insights legados).
 */
export function parseInsightContent(content: string | null | undefined): ParsedInsight | null {
  if (!content) return null;

  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && typeof parsed.summary === 'string') {
        const data: StructuredInsight = {
          summary: sanitizeInsightText(String(parsed.summary || '')),
          positive_patterns: Array.isArray(parsed.positive_patterns)
            ? parsed.positive_patterns.map((s: any) => sanitizeInsightText(String(s)))
            : [],
          attention_points: Array.isArray(parsed.attention_points)
            ? parsed.attention_points.map((s: any) => sanitizeInsightText(String(s)))
            : [],
          possible_triggers: Array.isArray(parsed.possible_triggers)
            ? parsed.possible_triggers.map((s: any) => sanitizeInsightText(String(s)))
            : [],
          suggested_actions: Array.isArray(parsed.suggested_actions)
            ? parsed.suggested_actions.map((s: any) => sanitizeInsightText(String(s)))
            : [],
          detected_themes: Array.isArray(parsed.detected_themes)
            ? parsed.detected_themes.map((s: any) => String(s))
            : [],
          risk_level: ['healthy', 'attention', 'alert', 'critical'].includes(parsed.risk_level)
            ? parsed.risk_level
            : 'healthy',
          confidence: ['very_low', 'low', 'medium', 'high'].includes(parsed.confidence)
            ? parsed.confidence
            : 'low',
        };
        return { kind: 'structured', data };
      }
    } catch {
      // cai no fallback
    }
  }

  return { kind: 'markdown', text: sanitizeInsightText(content) };
}

// -----------------------------
// Score de confiança
// -----------------------------

export function confidenceFromEntries(count: number): InsightConfidence {
  if (count <= 2) return 'very_low';
  if (count <= 5) return 'low';
  if (count <= 10) return 'medium';
  return 'high';
}

export const CONFIDENCE_META: Record<InsightConfidence, { label: string; description: string; badgeClass: string }> = {
  very_low: {
    label: 'Muito baixa',
    description: 'Há poucos registros para uma análise consistente. Continue registrando para insights mais ricos.',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
  low: {
    label: 'Baixa',
    description: 'Ainda há poucos registros para conclusões mais fortes. Use os insights como ponto de partida.',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800',
  },
  medium: {
    label: 'Média',
    description: 'Já há um histórico razoável. Os padrões são mais confiáveis, mas continuam evoluindo.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
  },
  high: {
    label: 'Boa',
    description: 'Você tem registros suficientes para padrões mais consistentes.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
  },
};

// -----------------------------
// Indicadores principais x complementares
// -----------------------------

export const PRIMARY_INDICATORS = new Set(['mood', 'mood_score', 'energy', 'energy_level', 'anxiety', 'anxiety_level']);

export function isPrimaryIndicator(emotionKey: string): boolean {
  return PRIMARY_INDICATORS.has(emotionKey);
}

// -----------------------------
// Tendências e captions de gráficos
// -----------------------------

export type TrendDirection = 'improving' | 'worsening' | 'stable' | 'oscillating' | 'insufficient_data';

export interface TrendResult {
  direction: TrendDirection;
  variation: number;
  current: number;
  previous: number;
}

/**
 * Calcula tendência comparando metade recente vs. metade anterior da série.
 * `higherIsBetter=false` para métricas como ansiedade/estresse.
 */
export function computeTrend(values: Array<number | null | undefined>, higherIsBetter = true): TrendResult {
  const series = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (series.length < 4) {
    return { direction: 'insufficient_data', variation: 0, current: 0, previous: 0 };
  }
  const mid = Math.floor(series.length / 2);
  const previous = avg(series.slice(0, mid));
  const current = avg(series.slice(mid));
  const variation = current - previous;
  const absVar = Math.abs(variation);

  // Detecta oscilação grande (desvio entre extremos > 2x desvio médio)
  const range = Math.max(...series) - Math.min(...series);
  const meanAbsDelta = avg(series.slice(1).map((v, i) => Math.abs(v - series[i])));
  const isOscillating = range >= 2 && meanAbsDelta >= absVar * 1.5 && meanAbsDelta > 0.6;

  if (absVar < 0.3) {
    return { direction: isOscillating ? 'oscillating' : 'stable', variation, current, previous };
  }
  const isUp = variation > 0;
  const direction: TrendDirection = (isUp === higherIsBetter) ? 'improving' : 'worsening';
  return { direction, variation, current, previous };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const METRIC_LABELS: Record<string, { label: string; higherIsBetter: boolean }> = {
  mood: { label: 'humor', higherIsBetter: true },
  energy: { label: 'energia', higherIsBetter: true },
  anxiety: { label: 'ansiedade', higherIsBetter: false },
  stress: { label: 'estresse', higherIsBetter: false },
  sleep: { label: 'sono', higherIsBetter: true },
  sleep_quality: { label: 'qualidade do sono', higherIsBetter: true },
};

/**
 * Gera frase interpretativa curta para um gráfico de série temporal.
 */
export function generateChartCaption(metric: string, values: Array<number | null | undefined>): string {
  const meta = METRIC_LABELS[metric] || { label: metric, higherIsBetter: true };
  const trend = computeTrend(values, meta.higherIsBetter);

  switch (trend.direction) {
    case 'insufficient_data':
      return `Ainda há poucos registros para identificar uma tendência clara de ${meta.label}.`;
    case 'improving':
      return `Sua ${meta.label} apresentou melhora nos registros mais recentes.`;
    case 'worsening':
      return `Sua ${meta.label} merece atenção: aparece em queda nos registros mais recentes.`;
    case 'oscillating':
      return `Sua ${meta.label} tem oscilado bastante no período. Vale observar o que muda entre os dias.`;
    case 'stable':
    default:
      return `Sua ${meta.label} permaneceu estável no período.`;
  }
}

/**
 * Caption para gráfico de distribuição (humor 1-5).
 */
export function generateDistributionCaption(distribution: Record<number, number>): string {
  const entries = Object.entries(distribution).map(([k, v]) => ({ score: Number(k), count: v }));
  const total = entries.reduce((s, e) => s + e.count, 0);
  if (total === 0) return 'Sem dados suficientes para análise da distribuição.';
  const positives = entries.filter((e) => e.score >= 4).reduce((s, e) => s + e.count, 0);
  const neutrals = entries.filter((e) => e.score === 3).reduce((s, e) => s + e.count, 0);
  const negatives = entries.filter((e) => e.score <= 2).reduce((s, e) => s + e.count, 0);
  const pct = (n: number) => Math.round((n / total) * 100);

  if (positives >= negatives && positives >= neutrals) {
    return `A maior parte dos seus registros (${pct(positives + neutrals)}%) ficou em níveis neutros a positivos.`;
  }
  if (negatives > positives) {
    return `Houve mais dias em níveis baixos (${pct(negatives)}%). Vale observar o que tem pesado nesses momentos.`;
  }
  return `Seus registros estão distribuídos de forma equilibrada no período.`;
}
