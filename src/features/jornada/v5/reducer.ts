/**
 * Máquina de estados da Jornada Emocional V5.
 * Toda navegação passa por aqui — evita estados impossíveis.
 */
import { getEmotionNode } from "../config/emotion-taxonomy";
import type { Intensity } from "../domain/types";
import {
  MAX_EMOTIONS,
  type ActionStatus,
  type ActionWhen,
  type V5Phase,
  type V5State,
} from "./types";

const now = () => new Date().toISOString();

export const createSessionKey = () =>
  `journey_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createV5State = (): V5State => ({
  sessionId: createSessionKey(),
  startedAt: now(),
  updatedAt: now(),
  completedAt: null,
  phase: "perceive",
  familyId: null,
  level2Id: null,
  level3Id: null,
  pendingEmotionId: null,
  postRegisterPrompt: false,
  perceiveReview: false,
  emotions: [],
  regulation: {
    offered: false,
    accepted: false,
    practiceId: null,
    playing: false,
    completed: false,
    declined: false,
    reassessEmotionId: null,
    intensityAfter: null,
  },
  focus: { mode: null, emotionId: null },
  comprehension: { situation: "", body: "", behavior: "", thoughts: "", unclear: [], skipped: false },
  learning: {
    practiceId: null,
    reason: "",
    selectionBasis: "learning_progression_intensity_and_user_history",
    durationMinutes: null,
    silentMode: false,
    playing: false,
    completed: false,
    skipped: false,
    utility: null,
    rejectedIds: [],
  },
  action: { direct: "", influence: "", none: "", next: "", when: null, status: null },
  savedRemoteId: null,
});

export type V5Action =
  | { type: "HYDRATE"; state: V5State }
  | { type: "RESET" }
  | { type: "SELECT_FAMILY"; familyId: string }
  | { type: "SELECT_LEVEL2"; emotionId: string }
  | { type: "SELECT_LEVEL3"; emotionId: string }
  | { type: "BACK_LEVEL" }
  | { type: "PICK_EMOTION"; emotionId: string }
  | { type: "CANCEL_PENDING" }
  | { type: "CONFIRM_EMOTION"; intensity: Intensity }
  | { type: "POST_REGISTER_ANOTHER" }
  | { type: "GO_TO_REVIEW" }
  | { type: "BACK_TO_WHEEL" }
  | { type: "REMOVE_EMOTION"; emotionId: string }
  | { type: "CLEAR_EMOTIONS" }
  | { type: "OFFER_PAUSE"; practiceId: string }
  | { type: "ACCEPT_PAUSE" }
  | { type: "DECLINE_PAUSE" }
  | { type: "START_PAUSE_PRACTICE" }
  | { type: "COMPLETE_PAUSE_PRACTICE" }
  | { type: "ABANDON_PAUSE_PRACTICE" }
  | { type: "SET_REASSESS"; intensity: Intensity }
  | { type: "SET_FOCUS"; mode: "single" | "whole"; emotionId?: string | null }
  | { type: "SET_COMPREHENSION"; key: "situation" | "body" | "behavior" | "thoughts"; value: string }
  | { type: "TOGGLE_UNCLEAR"; key: string }
  | { type: "SKIP_COMPREHENSION" }
  | { type: "CLEAR_COMPREHENSION" }
  | { type: "SET_LEARNING"; practiceId: string; reason: string }
  | { type: "SET_LEARNING_DURATION"; minutes: number }
  | { type: "TOGGLE_LEARNING_SILENT" }
  | { type: "START_LEARNING" }
  | { type: "COMPLETE_LEARNING" }
  | { type: "ABANDON_LEARNING" }
  | { type: "SKIP_LEARNING" }
  | { type: "REJECT_LEARNING" }
  | { type: "SET_LEARNING_UTILITY"; utility: Intensity }
  | { type: "SET_ACTION"; key: "direct" | "influence" | "none" | "next"; value: string }
  | { type: "SET_ACTION_WHEN"; when: ActionWhen }
  | { type: "SET_ACTION_STATUS"; status: ActionStatus }
  | { type: "GO_TO"; phase: V5Phase }
  | { type: "FINISH" }
  | { type: "MARK_SAVED"; remoteId: string };

const PHASE_ORDER: V5Phase[] = ["perceive", "comprehend", "regulate", "act", "record"];

export const phaseIndex = (phase: V5Phase) => PHASE_ORDER.indexOf(phase);

export const v5Reducer = (state: V5State, action: V5Action): V5State => {
  const touch = (next: Partial<V5State>): V5State => ({ ...state, ...next, updatedAt: now() });

  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "RESET":
      return createV5State();

    case "SELECT_FAMILY":
      return touch({ familyId: action.familyId, level2Id: null, level3Id: null });

    case "SELECT_LEVEL2":
      return touch({ level2Id: action.emotionId, level3Id: null, pendingEmotionId: action.emotionId });

    case "SELECT_LEVEL3":
      return touch({ level3Id: action.emotionId, pendingEmotionId: action.emotionId });

    case "BACK_LEVEL":
      if (state.level2Id) return touch({ level2Id: null, level3Id: null, pendingEmotionId: null });
      return touch({ familyId: null, level2Id: null, level3Id: null, pendingEmotionId: null });

    case "PICK_EMOTION":
      return touch({ pendingEmotionId: action.emotionId });

    case "CANCEL_PENDING":
      return touch({ pendingEmotionId: null });

    case "CONFIRM_EMOTION": {
      if (!state.pendingEmotionId) return state;
      const node = getEmotionNode(state.pendingEmotionId);
      if (!node) return state;
      if (state.emotions.some((item) => item.emotionId === node.id)) {
        return touch({ pendingEmotionId: null });
      }
      if (state.emotions.length >= MAX_EMOTIONS) return touch({ pendingEmotionId: null });
      return touch({
        pendingEmotionId: null,
        postRegisterPrompt: true,
        perceiveReview: false,
        emotions: [
          ...state.emotions,
          {
            emotionId: node.id,
            familyId: node.familyId ?? null,
            level: node.level,
            intensityBefore: action.intensity,
            intensityAfter: null,
          },
        ],
      });
    }

    case "POST_REGISTER_ANOTHER":
      return touch({ postRegisterPrompt: false, perceiveReview: false });

    case "GO_TO_REVIEW":
      return touch({ postRegisterPrompt: false, perceiveReview: true });

    case "BACK_TO_WHEEL":
      return touch({ perceiveReview: false });

    case "REMOVE_EMOTION":
      return touch({
        emotions: state.emotions.filter((item) => item.emotionId !== action.emotionId),
        focus:
          state.focus.emotionId === action.emotionId ? { mode: null, emotionId: null } : state.focus,
      });

    case "CLEAR_EMOTIONS":
      return touch({
        emotions: [],
        pendingEmotionId: null,
        postRegisterPrompt: false,
        perceiveReview: false,
        focus: { mode: null, emotionId: null },
        regulation: createV5State().regulation,
      });

    case "OFFER_PAUSE":
      return touch({
        regulation: { ...state.regulation, offered: true, practiceId: action.practiceId },
      });

    case "ACCEPT_PAUSE":
      return touch({ regulation: { ...state.regulation, accepted: true, declined: false } });

    case "DECLINE_PAUSE":
      return touch({
        regulation: { ...state.regulation, declined: true, accepted: false, playing: false },
      });

    case "START_PAUSE_PRACTICE":
      return touch({ regulation: { ...state.regulation, accepted: true, playing: true } });

    case "COMPLETE_PAUSE_PRACTICE": {
      const strongest = [...state.emotions].sort(
        (a, b) => b.intensityBefore - a.intensityBefore
      )[0];
      return touch({
        regulation: {
          ...state.regulation,
          playing: false,
          completed: true,
          reassessEmotionId: strongest?.emotionId ?? null,
        },
      });
    }

    case "ABANDON_PAUSE_PRACTICE":
      return touch({ regulation: { ...state.regulation, playing: false } });

    case "SET_REASSESS": {
      const targetId = state.regulation.reassessEmotionId;
      return touch({
        regulation: { ...state.regulation, intensityAfter: action.intensity },
        emotions: state.emotions.map((item) =>
          item.emotionId === targetId ? { ...item, intensityAfter: action.intensity } : item
        ),
      });
    }

    case "SET_FOCUS":
      return touch({
        focus: {
          mode: action.mode,
          emotionId: action.mode === "whole" ? null : (action.emotionId ?? null),
        },
      });

    case "SET_COMPREHENSION":
      return touch({
        comprehension: { ...state.comprehension, [action.key]: action.value, skipped: false },
      });

    case "TOGGLE_UNCLEAR": {
      const has = state.comprehension.unclear.includes(action.key);
      return touch({
        comprehension: {
          ...state.comprehension,
          unclear: has
            ? state.comprehension.unclear.filter((key) => key !== action.key)
            : [...state.comprehension.unclear, action.key],
        },
      });
    }

    case "SKIP_COMPREHENSION":
      return touch({
        comprehension: { ...createV5State().comprehension, skipped: true },
        phase: "regulate",
      });

    case "CLEAR_COMPREHENSION":
      return touch({ comprehension: createV5State().comprehension });

    case "SET_LEARNING":
      return touch({
        learning: {
          ...state.learning,
          practiceId: action.practiceId,
          reason: action.reason,
          completed: false,
          playing: false,
          skipped: false,
          utility: null,
        },
      });

    case "SET_LEARNING_DURATION":
      return touch({ learning: { ...state.learning, durationMinutes: action.minutes } });

    case "TOGGLE_LEARNING_SILENT":
      return touch({ learning: { ...state.learning, silentMode: !state.learning.silentMode } });

    case "START_LEARNING":
      if (!state.learning.practiceId) return state;
      return touch({ learning: { ...state.learning, playing: true, skipped: false } });

    case "COMPLETE_LEARNING":
      return touch({ learning: { ...state.learning, playing: false, completed: true } });

    case "ABANDON_LEARNING":
      return touch({ learning: { ...state.learning, playing: false } });

    case "SKIP_LEARNING":
      return touch({ learning: { ...state.learning, skipped: true, playing: false }, phase: "act" });

    case "REJECT_LEARNING":
      return touch({
        learning: {
          ...state.learning,
          rejectedIds: state.learning.practiceId
            ? [...state.learning.rejectedIds, state.learning.practiceId]
            : state.learning.rejectedIds,
          practiceId: null,
          reason: "",
          playing: false,
          completed: false,
          utility: null,
        },
      });

    case "SET_LEARNING_UTILITY":
      return touch({ learning: { ...state.learning, utility: action.utility } });

    case "SET_ACTION":
      return touch({ action: { ...state.action, [action.key]: action.value } });

    case "SET_ACTION_WHEN":
      return touch({ action: { ...state.action, when: action.when } });

    case "SET_ACTION_STATUS":
      return touch({ action: { ...state.action, status: action.status } });

    case "GO_TO":
      return touch({ phase: action.phase });

    case "FINISH":
      return touch({ phase: "record", completedAt: now() });

    case "MARK_SAVED":
      return touch({ savedRemoteId: action.remoteId });

    default:
      return state;
  }
};

/** A pausa de regulação é oferecida quando alguma emoção foi registrada com intensidade alta. */
export const shouldOfferPause = (state: V5State) =>
  state.emotions.some((item) => item.intensityBefore >= 4);

/** A fase "Perceber" está concluída quando existe pelo menos uma emoção e um foco. */
export const perceiveDone = (state: V5State) => state.emotions.length > 0 && !!state.focus.mode;
