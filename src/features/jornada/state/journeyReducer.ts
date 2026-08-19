/**
 * Máquina de estados central da jornada. Toda a navegação passa por aqui,
 * evitando estados impossíveis e estado espalhado pelos componentes.
 */
import { TAXONOMY_VERSION, getEmotionNode } from "../config/emotion-taxonomy";
import { recommend } from "../engine/recommend";
import type {
  EmotionSession,
  Intensity,
  JourneyMode,
  JourneyStatus,
  RecommendationDecision,
} from "../domain/types";

export type JourneyStage =
  | "entry"
  | "wheel"
  | "intensity"
  | "context"
  | "recommendation"
  | "practice"
  | "checkout"
  | "understand"
  | "act"
  | "completed";

export interface JourneyState {
  sessionId: string;
  stage: JourneyStage;
  journeyMode: JourneyMode | null;
  entryPoint: string;
  taxonomyVersion: string;

  familyId: string | null;
  level2Id: string | null;
  level3Id: string | null;
  selectedEmotionId: string | null;
  intensity: Intensity | null;
  contextAnswerId: string | null;

  decision: RecommendationDecision | null;
  showAlternatives: boolean;
  selectedPracticeId: string | null;
  selectedDuration: number | null;
  silentMode: boolean;

  practiceStartedAt: string | null;
  practiceCompletedAt: string | null;

  emotionAfterId: string | null;
  intensityAfter: Intensity | null;
  perceivedChangeIds: string[];
  usefulness: Intensity | null;

  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
}

export type JourneyAction =
  | { type: "SELECT_MODE"; mode: JourneyMode; entryPoint: string }
  | { type: "OPEN_WHEEL" }
  | { type: "SELECT_FAMILY"; familyId: string }
  | { type: "SELECT_LEVEL2"; emotionId: string }
  | { type: "SELECT_LEVEL3"; emotionId: string }
  | { type: "CONFIRM_EMOTION"; emotionId: string }
  | { type: "SELECT_INTENSITY"; intensity: Intensity }
  | { type: "ANSWER_CONTEXT"; contextAnswerId: string }
  | { type: "SKIP_CONTEXT" }
  | { type: "REQUEST_ALTERNATIVES" }
  | { type: "SELECT_PRACTICE"; practiceId: string }
  | { type: "SELECT_DURATION"; minutes: number }
  | { type: "TOGGLE_SILENT_MODE" }
  | { type: "START_PRACTICE" }
  | { type: "COMPLETE_PRACTICE" }
  | { type: "ABANDON_PRACTICE" }
  | { type: "GO_TO"; stage: JourneyStage }
  | { type: "SET_EMOTION_AFTER"; emotionId: string }
  | { type: "SET_INTENSITY_AFTER"; intensity: Intensity }
  | { type: "TOGGLE_PERCEIVED_CHANGE"; optionId: string }
  | { type: "SET_USEFULNESS"; usefulness: Intensity }
  | { type: "COMPLETE_CHECKOUT" }
  | { type: "FINISH" }
  | { type: "BACK" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: JourneyState };

const now = () => new Date().toISOString();

export const createSessionId = () =>
  `journey_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createInitialState = (): JourneyState => ({
  sessionId: createSessionId(),
  stage: "entry",
  journeyMode: null,
  entryPoint: "praticas_jornada",
  taxonomyVersion: TAXONOMY_VERSION,
  familyId: null,
  level2Id: null,
  level3Id: null,
  selectedEmotionId: null,
  intensity: null,
  contextAnswerId: null,
  decision: null,
  showAlternatives: false,
  selectedPracticeId: null,
  selectedDuration: null,
  silentMode: false,
  practiceStartedAt: null,
  practiceCompletedAt: null,
  emotionAfterId: null,
  intensityAfter: null,
  perceivedChangeIds: [],
  usefulness: null,
  status: "started",
  createdAt: now(),
  updatedAt: now(),
});

/** Intensidade alta reduz carga cognitiva: pula a pergunta contextual. */
export const skipsContext = (intensity: Intensity | null, mode: JourneyMode | null) =>
  mode !== "understand" && !!intensity && intensity >= 4;

const runRecommendation = (state: JourneyState): JourneyState => {
  if (!state.selectedEmotionId || !state.intensity) return state;
  const result = recommend({
    sessionId: state.sessionId,
    emotionId: state.selectedEmotionId,
    intensity: state.intensity,
    contextAnswerId: state.contextAnswerId,
  });
  if (!result) return { ...state, stage: "recommendation", decision: null };
  return {
    ...state,
    stage: "recommendation",
    decision: result.decision,
    selectedPracticeId: result.primary.id,
    selectedDuration: result.primary.durations[0] ?? null,
    showAlternatives: false,
    status: "recommended",
  };
};

const clearFromEmotion = (state: JourneyState): JourneyState => ({
  ...state,
  decision: null,
  selectedPracticeId: null,
  selectedDuration: null,
  showAlternatives: false,
  practiceStartedAt: null,
  practiceCompletedAt: null,
  emotionAfterId: null,
  intensityAfter: null,
  perceivedChangeIds: [],
  usefulness: null,
  status: "started",
});

const backStage = (state: JourneyState): JourneyStage => {
  switch (state.stage) {
    case "wheel":
      return "entry";
    case "intensity":
      return "wheel";
    case "context":
      return "intensity";
    case "recommendation":
      return skipsContext(state.intensity, state.journeyMode) ? "intensity" : "context";
    case "practice":
      return "recommendation";
    case "checkout":
      return "practice";
    case "understand":
      return "checkout";
    case "act":
      return "understand";
    default:
      return state.stage;
  }
};

export const journeyReducer = (state: JourneyState, action: JourneyAction): JourneyState => {
  const touched = (next: Partial<JourneyState>): JourneyState => ({
    ...state,
    ...next,
    updatedAt: now(),
  });

  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "RESET":
      return createInitialState();

    case "SELECT_MODE":
      return touched({
        journeyMode: action.mode,
        entryPoint: action.entryPoint,
        stage: action.mode === "library" ? "entry" : "wheel",
      });

    case "OPEN_WHEEL":
      return touched({ stage: "wheel" });

    case "SELECT_FAMILY":
      return touched({
        ...clearFromEmotion(state),
        familyId: action.familyId,
        level2Id: null,
        level3Id: null,
        selectedEmotionId: null,
        intensity: null,
        contextAnswerId: null,
        stage: "wheel",
      });

    case "SELECT_LEVEL2":
      return touched({
        ...clearFromEmotion(state),
        level2Id: action.emotionId,
        level3Id: null,
        selectedEmotionId: null,
        stage: "wheel",
      });

    case "SELECT_LEVEL3":
      return touched({ ...clearFromEmotion(state), level3Id: action.emotionId, stage: "wheel" });

    case "CONFIRM_EMOTION": {
      const node = getEmotionNode(action.emotionId);
      if (!node) return state;
      return touched({
        ...clearFromEmotion(state),
        familyId: node.familyId,
        level2Id: node.level === 3 ? node.parentId : node.level === 2 ? node.id : state.level2Id,
        level3Id: node.level === 3 ? node.id : null,
        selectedEmotionId: node.id,
        intensity: null,
        contextAnswerId: null,
        stage: "intensity",
      });
    }

    case "SELECT_INTENSITY": {
      const next = touched({ intensity: action.intensity, contextAnswerId: null });
      if (skipsContext(action.intensity, state.journeyMode)) {
        return runRecommendation({ ...next, stage: "recommendation" });
      }
      return { ...next, stage: "context" };
    }

    case "ANSWER_CONTEXT":
      return runRecommendation(touched({ contextAnswerId: action.contextAnswerId }));

    case "SKIP_CONTEXT":
      return runRecommendation(touched({ contextAnswerId: null }));

    case "REQUEST_ALTERNATIVES":
      return touched({ showAlternatives: true });

    case "SELECT_PRACTICE":
      return touched({ selectedPracticeId: action.practiceId, selectedDuration: null });

    case "SELECT_DURATION":
      return touched({ selectedDuration: action.minutes });

    case "TOGGLE_SILENT_MODE":
      return touched({ silentMode: !state.silentMode });

    case "START_PRACTICE":
      if (!state.selectedPracticeId) return state;
      return touched({
        stage: "practice",
        practiceStartedAt: now(),
        practiceCompletedAt: null,
        status: "practice_started",
      });

    case "COMPLETE_PRACTICE":
      return touched({
        practiceCompletedAt: now(),
        status: "practice_completed",
        stage: "checkout",
      });

    case "ABANDON_PRACTICE":
      return touched({ stage: "recommendation", practiceStartedAt: null, status: "recommended" });

    case "SET_EMOTION_AFTER":
      return touched({ emotionAfterId: action.emotionId });

    case "SET_INTENSITY_AFTER":
      return touched({ intensityAfter: action.intensity });

    case "TOGGLE_PERCEIVED_CHANGE": {
      const has = state.perceivedChangeIds.includes(action.optionId);
      return touched({
        perceivedChangeIds: has
          ? state.perceivedChangeIds.filter((id) => id !== action.optionId)
          : [...state.perceivedChangeIds, action.optionId],
      });
    }

    case "SET_USEFULNESS":
      return touched({ usefulness: action.usefulness });

    case "COMPLETE_CHECKOUT":
      return touched({ status: "checkout_completed", stage: "understand" });

    case "FINISH":
      return touched({ status: "completed", stage: "completed" });

    case "GO_TO":
      return touched({ stage: action.stage });

    case "BACK":
      return touched({ stage: backStage(state) });

    default:
      return state;
  }
};

/** Projeção do estado para o contrato persistível EmotionSession. */
export const toEmotionSession = (
  state: JourneyState,
  userId: string,
  practiceVersion?: string
): EmotionSession | null => {
  if (!state.selectedEmotionId || !state.intensity || !state.journeyMode) return null;
  return {
    id: state.sessionId,
    userId,
    journeyMode: state.journeyMode,
    entryPoint: state.entryPoint,
    taxonomyVersion: state.taxonomyVersion,
    selectedEmotionId: state.selectedEmotionId,
    intensityBefore: state.intensity,
    contextAnswerId: state.contextAnswerId ?? undefined,
    recommendationRuleId: state.decision?.ruleId,
    recommendationRuleVersion: state.decision?.ruleVersion,
    recommendedPracticeIds: state.decision
      ? [state.decision.primaryPracticeId, ...state.decision.alternativePracticeIds]
      : [],
    selectedPracticeId: state.selectedPracticeId ?? undefined,
    practiceVersion,
    practiceStartedAt: state.practiceStartedAt ?? undefined,
    practiceCompletedAt: state.practiceCompletedAt ?? undefined,
    emotionAfterId: state.emotionAfterId ?? undefined,
    intensityAfter: state.intensityAfter ?? undefined,
    perceivedChangeIds: state.perceivedChangeIds,
    usefulness: state.usefulness ?? undefined,
    currentStage: state.stage,
    status: state.status,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
};
