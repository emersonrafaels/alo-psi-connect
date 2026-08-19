/**
 * Motor de recomendação determinístico.
 * Função pura: mesmas entradas produzem sempre a mesma saída. Sem IA generativa.
 */
import { RECOMMENDATION_RULES } from "../config/recommendation-rules";
import { getEmotionPath } from "../config/emotion-taxonomy";
import { getPractice, isRecommendable } from "../config/practices";
import type {
  Intensity,
  Practice,
  RecommendationDecision,
  RecommendationRule,
} from "../domain/types";

export interface RecommendationInput {
  sessionId: string;
  emotionId: string;
  intensity: Intensity;
  contextAnswerId?: string | null;
}

export interface RecommendationResult {
  rule: RecommendationRule;
  primary: Practice;
  alternatives: Practice[];
  decision: RecommendationDecision;
}

/** Especificidade do match emocional: nó nível 3 > nível 2 > família > wildcard. */
const emotionSpecificity = (rule: RecommendationRule, emotionId: string): number | null => {
  const path = getEmotionPath(emotionId); // [família, nível2, nível3?]
  for (let i = path.length - 1; i >= 0; i--) {
    if (rule.emotionIds.includes(path[i].id)) return 100 + i * 10;
  }
  if (rule.emotionIds.includes("*")) return 0;
  return null;
};

const matches = (rule: RecommendationRule, input: RecommendationInput) => {
  if (!rule.active || !rule.curatorApproved) return null;

  const emotionScore = emotionSpecificity(rule, input.emotionId);
  if (emotionScore === null) return null;

  const matchedOn: string[] = [];
  if (emotionScore > 0) matchedOn.push("emotion");
  else matchedOn.push("fallback");

  if (rule.intensityMin !== undefined && input.intensity < rule.intensityMin) return null;
  if (rule.intensityMax !== undefined && input.intensity > rule.intensityMax) return null;
  if (rule.intensityMin !== undefined || rule.intensityMax !== undefined) {
    matchedOn.push("intensity");
  }

  if (rule.contextAnswerIds?.length) {
    if (!input.contextAnswerId || !rule.contextAnswerIds.includes(input.contextAnswerId)) {
      return null;
    }
    matchedOn.push("context");
  }

  return { emotionScore, matchedOn };
};

export const recommend = (input: RecommendationInput): RecommendationResult | null => {
  const candidates = RECOMMENDATION_RULES.map((rule) => {
    const match = matches(rule, input);
    if (!match) return null;
    const primary = getPractice(rule.primaryPracticeId);
    if (!isRecommendable(primary)) return null;
    return { rule, ...match, primary: primary as Practice };
  }).filter(Boolean) as {
    rule: RecommendationRule;
    emotionScore: number;
    matchedOn: string[];
    primary: Practice;
  }[];

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    // 1) especificidade do nó emocional, 2) prioridade curatorial, 3) contexto, 4) id estável
    if (b.emotionScore !== a.emotionScore) return b.emotionScore - a.emotionScore;
    if (b.rule.priority !== a.rule.priority) return b.rule.priority - a.rule.priority;
    const aCtx = a.rule.contextAnswerIds?.length ? 1 : 0;
    const bCtx = b.rule.contextAnswerIds?.length ? 1 : 0;
    if (bCtx !== aCtx) return bCtx - aCtx;
    return a.rule.id.localeCompare(b.rule.id);
  });

  const winner = candidates[0];

  const alternatives = winner.rule.alternativePracticeIds
    .map((id) => getPractice(id))
    .filter((p): p is Practice => isRecommendable(p) && p!.id !== winner.primary.id)
    .slice(0, 2);

  const decision: RecommendationDecision = {
    sessionId: input.sessionId,
    ruleId: winner.rule.id,
    ruleVersion: winner.rule.version,
    primaryPracticeId: winner.primary.id,
    alternativePracticeIds: alternatives.map((p) => p.id),
    matchedOn: winner.matchedOn,
  };

  return { rule: winner.rule, primary: winner.primary, alternatives, decision };
};
