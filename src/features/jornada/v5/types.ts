/**
 * Contratos da Jornada Emocional V5.
 * Cinco fases: perceber, compreender, regular, agir, registro.
 */
import type { Intensity } from "../domain/types";

export type V5Phase = "perceive" | "comprehend" | "regulate" | "act" | "record";

export type FocusMode = "single" | "whole" | null;

export interface PickedEmotion {
  emotionId: string;
  familyId: string | null;
  level: 1 | 2 | 3;
  intensityBefore: Intensity;
  intensityAfter: Intensity | null;
}

export interface RegulationState {
  /** A pausa foi oferecida nesta sessão. */
  offered: boolean;
  accepted: boolean;
  practiceId: string | null;
  playing: boolean;
  completed: boolean;
  declined: boolean;
  /** Reavaliação da mesma ocorrência — não cria novo registro. */
  reassessEmotionId: string | null;
  intensityAfter: Intensity | null;
}

export interface ComprehensionState {
  situation: string;
  body: string;
  behavior: string;
  thoughts: string;
  /** "Ainda não consigo identificar" por dimensão. */
  unclear: string[];
  skipped: boolean;
}

export interface LearningState {
  practiceId: string | null;
  reason: string;
  selectionBasis: string;
  durationMinutes: number | null;
  silentMode: boolean;
  playing: boolean;
  completed: boolean;
  skipped: boolean;
  utility: Intensity | null;
  /** Recursos já dispensados nesta sessão (para "conhecer outro"). */
  rejectedIds: string[];
}

export type ActionWhen = "now" | "today" | "tomorrow" | "this_week" | "no_deadline" | null;
export type ActionStatus = "defined" | "dont_know" | "not_now" | "need_help" | null;

export interface ActionState {
  direct: string;
  influence: string;
  none: string;
  next: string;
  when: ActionWhen;
  status: ActionStatus;
}

export interface V5State {
  sessionId: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  phase: V5Phase;

  /** Navegação da roda. */
  familyId: string | null;
  level2Id: string | null;
  level3Id: string | null;

  /** Emoção clicada aguardando intensidade. */
  pendingEmotionId: string | null;

  emotions: PickedEmotion[];
  regulation: RegulationState;
  focus: { mode: FocusMode; emotionId: string | null };
  comprehension: ComprehensionState;
  learning: LearningState;
  action: ActionState;
  savedRemoteId: string | null;
}

export const MAX_EMOTIONS = 3;
