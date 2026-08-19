/**
 * Regras determinísticas de recomendação (curatoriais, versionadas e auditáveis).
 * Nenhuma decisão é tomada por IA generativa.
 * Precedência: override de nó específico > emoção nível 2 > família > intensidade > contexto.
 */
import type { RecommendationRule } from "../domain/types";

export const RULES_VERSION = "rbe-recommendation-rules-1.0.0";

const V = "1.0.0";

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  // --- Medo ---
  {
    id: "rule_medo_tensao_corpo",
    version: V,
    emotionIds: ["medo"],
    contextAnswerIds: ["tensao_corpo"],
    primaryPracticeId: "suspiro_alivio",
    alternativePracticeIds: ["coerencia_cardiaca", "respiracao_lenta_ritmada"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_medo_mente_acelerada",
    version: V,
    emotionIds: ["medo"],
    contextAnswerIds: ["mente_acelerada", "preocupacao_futuro"],
    primaryPracticeId: "respiracao_lenta_ritmada",
    alternativePracticeIds: ["coerencia_cardiaca", "pausa_3_minutos"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_medo_foco",
    version: V,
    emotionIds: ["medo"],
    contextAnswerIds: ["dificuldade_foco"],
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["respiracao_quatro_etapas", "coerencia_cardiaca"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_medo_base",
    version: V,
    emotionIds: ["medo"],
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["respiracao_lenta_ritmada", "coerencia_cardiaca"],
    priority: 20,
    active: true,
    curatorApproved: true,
  },

  // --- Raiva ---
  {
    id: "rule_raiva_entender_alta",
    version: V,
    emotionIds: ["raiva"],
    contextAnswerIds: ["entender"],
    intensityMin: 4,
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["nomear_acolher", "pausa_3_minutos"],
    priority: 65,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_raiva_entender",
    version: V,
    emotionIds: ["raiva"],
    contextAnswerIds: ["entender"],
    intensityMax: 3,
    primaryPracticeId: "nomear_acolher",
    alternativePracticeIds: ["pausa_3_minutos", "respiracao_lenta_ritmada"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_raiva_presente",
    version: V,
    emotionIds: ["raiva"],
    contextAnswerIds: ["voltar_presente"],
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["suspiro_alivio", "respiracao_lenta_ritmada"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_raiva_base",
    version: V,
    emotionIds: ["raiva"],
    primaryPracticeId: "suspiro_alivio",
    alternativePracticeIds: ["respiracao_lenta_ritmada", "grounding_5_4_3_2_1"],
    priority: 20,
    active: true,
    curatorApproved: true,
  },

  // --- Tristeza ---
  {
    id: "rule_tristeza_presente",
    version: V,
    emotionIds: ["tristeza"],
    contextAnswerIds: ["voltar_presente"],
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["nomear_acolher", "pausa_3_minutos"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_tristeza_alta",
    version: V,
    emotionIds: ["tristeza"],
    intensityMin: 4,
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["nomear_acolher", "pausa_3_minutos"],
    priority: 30,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_tristeza_base",
    version: V,
    emotionIds: ["tristeza"],
    intensityMax: 3,
    primaryPracticeId: "nomear_acolher",
    alternativePracticeIds: ["pausa_3_minutos", "grounding_5_4_3_2_1"],
    priority: 25,
    active: true,
    curatorApproved: true,
  },

  // --- Nojo ---
  {
    id: "rule_nojo_acolher",
    version: V,
    emotionIds: ["nojo"],
    contextAnswerIds: ["acolher"],
    intensityMax: 3,
    primaryPracticeId: "nomear_acolher",
    alternativePracticeIds: ["pausa_3_minutos", "grounding_5_4_3_2_1"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_nojo_base",
    version: V,
    emotionIds: ["nojo"],
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["pausa_3_minutos", "nomear_acolher"],
    priority: 20,
    active: true,
    curatorApproved: true,
  },

  // --- Surpresa ---
  {
    id: "rule_surpresa_animado_override",
    version: V,
    emotionIds: ["surpresa_animado", "surpresa_animado_energetico", "surpresa_animado_irado"],
    primaryPracticeId: "saborear_momento",
    alternativePracticeIds: ["respiracao_quatro_etapas", "coerencia_cardiaca"],
    priority: 90,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_surpresa_positiva",
    version: V,
    emotionIds: ["surpresa"],
    contextAnswerIds: ["curiosidade", "positivo"],
    primaryPracticeId: "saborear_momento",
    alternativePracticeIds: ["respiracao_quatro_etapas", "coerencia_cardiaca"],
    priority: 60,
    active: true,
    curatorApproved: true,
  },
  {
    id: "rule_surpresa_base",
    version: V,
    emotionIds: ["surpresa"],
    primaryPracticeId: "grounding_5_4_3_2_1",
    alternativePracticeIds: ["pausa_3_minutos", "suspiro_alivio"],
    priority: 20,
    active: true,
    curatorApproved: true,
  },

  // --- Alegria ---
  {
    id: "rule_alegria_base",
    version: V,
    emotionIds: ["alegria"],
    primaryPracticeId: "saborear_momento",
    alternativePracticeIds: ["coerencia_cardiaca", "respiracao_quatro_etapas"],
    priority: 15,
    active: true,
    curatorApproved: true,
  },

  // --- Fallback global ---
  {
    id: "rule_fallback_global",
    version: V,
    emotionIds: ["*"],
    primaryPracticeId: "pausa_3_minutos",
    alternativePracticeIds: ["grounding_5_4_3_2_1", "respiracao_lenta_ritmada"],
    priority: 0,
    active: true,
    curatorApproved: true,
  },
];
