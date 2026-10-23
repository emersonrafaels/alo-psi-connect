import { EMOTION_FAMILIES } from '@/features/jornada/config/emotion-taxonomy';
import type { EmotionNode } from '@/features/jornada/domain/types';

export type SentimentBand = 'bad' | 'medium' | 'good';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/**
 * Sentimentos em que nota alta significa estar pior (ansiedade, estresse...).
 * Para todos os outros (humor, energia, sono, calma...) nota alta significa estar melhor.
 */
const HIGHER_IS_WORSE = new Set([
  'ansiedade', 'ansioso', 'estresse', 'stress', 'tensao', 'tenso', 'tensa', 'irritacao', 'irritado', 'irritabilidade',
  'raiva', 'frustracao', 'frustrado', 'impaciente', 'magoado', 'ressentido', 'provocado',
  'tristeza', 'triste', 'desanimo', 'desanimado', 'solidao', 'solitario', 'desesperanca', 'desesperancoso',
  'medo', 'assustado', 'preocupacao', 'preocupado', 'sobrecarga', 'sobrecarregado', 'inseguranca', 'inseguro',
  'impotente', 'sensivel', 'inadequado', 'angustia', 'panico', 'nervosismo',
  'cansaco', 'cansado', 'exaustao', 'esgotamento', 'burnout', 'apatia', 'apatico', 'desmotivacao', 'desmotivado',
  'culpa', 'culpado', 'vergonha', 'pressao', 'cobranca', 'tristeza profunda',
]);

/** Valência de cada rótulo da Roda das Emoções (família, ramo e folha). */
const taxonomyValence = new Map<string, 'pleasant' | 'unpleasant'>();
for (const family of EMOTION_FAMILIES) {
  const visit = (node: EmotionNode) => {
    taxonomyValence.set(normalize(node.label), family.valence);
    for (const child of node.children ?? []) visit(child);
  };
  visit(family);
}

/** Verdadeiro quando nota alta significa que o aluno está pior. */
export function isHigherIsWorse(label: string): boolean {
  const key = normalize(label);
  if (HIGHER_IS_WORSE.has(key)) return true;
  return taxonomyValence.get(key) === 'unpleasant';
}

/** Nota convertida para a lógica "quanto maior, melhor" (1 a 5). */
export function wellbeingValue(label: string, average: number): number {
  return isHigherIsWorse(label) ? 6 - average : average;
}

/** Faixa de cuidado de um sentimento: vermelho (ruim), amarelo (mediano), verde (bom). */
export function sentimentBand(label: string, average: number): SentimentBand {
  const value = wellbeingValue(label, average);
  if (value >= 4) return 'good';
  if (value >= 2.5) return 'medium';
  return 'bad';
}

export const SENTIMENT_BAND_STYLES: Record<SentimentBand, string> = {
  good: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  bad: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const SENTIMENT_BAND_DOTS: Record<SentimentBand, string> = {
  good: 'bg-green-500',
  medium: 'bg-yellow-500',
  bad: 'bg-red-500',
};

export const SENTIMENT_BAND_LEGEND: Record<SentimentBand, string> = {
  good: 'bom',
  medium: 'atenção',
  bad: 'precisa de cuidado',
};

export const SENTIMENT_BAND_HINT: Record<SentimentBand, string> = {
  good: 'Sentimento favorável',
  medium: 'Sentimento que pede atenção',
  bad: 'Sentimento que precisa de cuidado',
};
