/**
 * Persistência da Jornada V5.
 * Rascunho local (sessionStorage) para retomar de onde parou + gravação no Supabase
 * ao concluir o registro. Visitantes sem conta gravam de forma anônima.
 */
import { supabase } from "@/integrations/supabase/client";
import type { V5State } from "./types";

const KEY = "rbe.jornada.v5.session";

export const loadDraft = (): V5State | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as V5State;
    return parsed?.sessionId ? parsed : null;
  } catch {
    return null;
  }
};

export const saveDraft = (state: V5State) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* protótipo não bloqueia a jornada por falha de storage */
  }
};

export const clearDraft = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};

export interface PersistResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Grava a sessão concluída e cada emoção como uma ocorrência. */
export const persistSession = async (
  state: V5State,
  userId: string | null,
  tenantId?: string | null
): Promise<PersistResult> => {
  const focus =
    state.emotions.find((item) => item.emotionId === state.focus.emotionId) ?? state.emotions[0];

  if (!focus) return { ok: false, error: "Nenhuma emoção registrada." };

  const { data, error } = await supabase
    .from("journey_sessions")
    .insert({
      user_id: userId,
      session_key: state.sessionId,
      tenant_id: tenantId ?? null,
      family_id: focus.familyId,
      emotion_id: focus.emotionId,
      intensity_before: focus.intensityBefore,
      intensity_after: focus.intensityAfter ?? state.regulation.intensityAfter,
      practice_id: state.learning.practiceId,
      duration_minutes: state.learning.durationMinutes,
      perceived_change_ids: [],
      usefulness: state.learning.utility,
      phase: "record",
      status: "completed",
      focus_mode: state.focus.mode,
      comprehension: {
        situation: state.comprehension.situation,
        body: state.comprehension.body,
        behavior: state.comprehension.behavior,
        thoughts: state.comprehension.thoughts,
        unclear: state.comprehension.unclear,
        skipped: state.comprehension.skipped,
      },
      action: {
        direct: state.action.direct,
        influence: state.action.influence,
        none: state.action.none,
        next: state.action.next,
        when: state.action.when,
        status: state.action.status,
      },
      immediate_regulation: {
        offered: state.regulation.offered,
        accepted: state.regulation.accepted,
        practice_id: state.regulation.practiceId,
        completed: state.regulation.completed,
        intensity_after: state.regulation.intensityAfter,
      },
      learning_practice: {
        practice_id: state.learning.practiceId,
        completed: state.learning.completed,
        skipped: state.learning.skipped,
        utility: state.learning.utility,
        selection_basis: state.learning.selectionBasis,
      },
      completed_at: state.completedAt ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Falha ao salvar." };

  const rows = state.emotions.map((item, index) => ({
    session_id: data.id,
    user_id: userId,
    emotion_id: item.emotionId,
    family_id: item.familyId,
    emotion_level: item.level,
    intensity_before: item.intensityBefore,
    intensity_after: item.intensityAfter,
    is_focus: state.focus.mode === "single" && state.focus.emotionId === item.emotionId,
    position: index + 1,
  }));

  const { error: emotionsError } = await supabase.from("journey_session_emotions").insert(rows);
  if (emotionsError) return { ok: true, id: data.id, error: emotionsError.message };

  return { ok: true, id: data.id };
};
