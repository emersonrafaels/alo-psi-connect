/**
 * Modelos de domínio da Jornada de Autorregulação.
 * Contratos estáveis: a UI, o motor de recomendação e a persistência dependem daqui.
 */

export type JourneyMode = "regulate" | "understand" | "library";

export type Intensity = 1 | 2 | 3 | 4 | 5;

export interface EmotionNode {
  id: string;
  label: string;
  level: 1 | 2 | 3;
  children?: EmotionNode[];
}

export interface EmotionFamily extends EmotionNode {
  level: 1;
  color: string;
  children: EmotionNode[];
}

/** Coordenadas de valência/ativação — definidas exclusivamente pela curadoria. */
export interface LandscapeCoordinate {
  emotionId: string;
  valence: number;
  activation: number;
}

export type PracticeCategory = "breathwork" | "grounding" | "awareness" | "positive";
export type PlayerType = "breathing" | "grounding" | "awareness";
export type PracticeStatus = "active" | "review" | "disabled";

export interface Practice {
  id: string;
  version: string;
  slug: string;
  title: string;
  category: PracticeCategory;
  playerType: PlayerType;
  status: PracticeStatus;
  description: string;
  /** Durações em minutos. */
  durations: number[];
  protocolId?: string;
  audioAvailable: boolean;
  silentModeAvailable: boolean;
  curatorId: string;
  safetyInstructions?: string[];
  icon?: string;
  categoryLabel?: string;
  benefits?: string[];
}

export interface BreathingPhase {
  key: "inhale" | "hold" | "exhale" | "hold_after_exhale" | "step";
  label: string;
  /** Segundos reais definidos pela curadoria. */
  seconds: number;
  hint?: string;
}

export interface PracticeProtocol {
  id: string;
  version: string;
  playerType: PlayerType;
  /** Ciclos/etapas do protocolo. */
  phases: BreathingPhase[];
  /** Número de repetições do ciclo por minuto de prática (breathing). */
  cyclesPerRun?: number;
  steps?: { title: string; instruction: string; seconds: number }[];
  silentModeAvailable: boolean;
}

export interface RecommendationRule {
  id: string;
  version: string;
  /** IDs de família, nível 2 ou nível 3 (override do nó específico). */
  emotionIds: string[];
  intensityMin?: number;
  intensityMax?: number;
  contextAnswerIds?: string[];
  primaryPracticeId: string;
  alternativePracticeIds: string[];
  priority: number;
  active: boolean;
  curatorApproved: boolean;
}

export interface RecommendationDecision {
  sessionId: string;
  ruleId: string;
  ruleVersion: string;
  primaryPracticeId: string;
  alternativePracticeIds: string[];
  matchedOn: string[];
}

export interface ContextQuestion {
  id: string;
  familyId: string;
  question: string;
  options: { id: string; label: string }[];
}

export interface OptionItem {
  id: string;
  label: string;
}

export type JourneyStatus =
  | "started"
  | "recommended"
  | "practice_started"
  | "practice_completed"
  | "checkout_completed"
  | "completed"
  | "abandoned";

export interface EmotionSession {
  id: string;
  userId: string;

  journeyMode: JourneyMode;
  entryPoint: string;

  taxonomyVersion: string;

  selectedEmotionId: string;
  intensityBefore: Intensity;

  contextAnswerId?: string;

  recommendationRuleId?: string;
  recommendationRuleVersion?: string;
  recommendedPracticeIds: string[];

  selectedPracticeId?: string;
  practiceVersion?: string;

  practiceStartedAt?: string;
  practiceCompletedAt?: string;

  emotionAfterId?: string;
  intensityAfter?: Intensity;

  perceivedChangeIds?: string[];
  usefulness?: Intensity;

  stressMapId?: string;
  actionReflectionId?: string;

  currentStage: string;

  status: JourneyStatus;

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  abandonedAt?: string;
}

export interface StressMapRecord {
  id: string;
  sessionId: string;
  sourceIds: string[];
  sourceNote?: string;
  emotionId: string;
  bodyIds: string[];
  behaviorIds: string[];
  innerDialogue?: string;
  createdAt: string;
}

export interface ActionReflectionRecord {
  id: string;
  sessionId: string;
  insight?: string;
  withinReach?: string;
  possibleAction?: string;
  smallestStep?: string;
  createdAt: string;
}
