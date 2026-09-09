import { useEffect, useMemo, useReducer, useState } from "react";
import { Sparkles } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { EmotionWheel } from "../components/EmotionWheel";
import { EmotionListFallback } from "../components/EmotionListFallback";
import { EmotionBreadcrumb } from "../components/EmotionBreadcrumb";
import { getEmotionNode } from "../config/emotion-taxonomy";
import { getPractice } from "../config/practices";
import type { Intensity } from "../domain/types";
import { ComprehensionDimensions } from "./components/ComprehensionDimensions";
import { ControlColumns } from "./components/ControlColumns";
import { EmotionLandscape } from "./components/EmotionLandscape";
import { FocusSelection } from "./components/FocusSelection";
import { ImmediateRegulationCard } from "./components/ImmediateRegulationCard";
import { LearningResourceCard } from "./components/LearningResourceCard";
import { PerceiveSidebar } from "./components/PerceiveSidebar";
import { PhaseStepper } from "./components/PhaseStepper";
import { SessionSummary } from "./components/SessionSummary";
import { V5_COPY } from "./copy";
import {
  getImmediatePausePractice,
  selectLearningResource,
  IMMEDIATE_PAUSE_PRACTICE_ID,
} from "./learningTrail";
import { clearDraft, loadDraft, persistSession, saveDraft } from "./repository";
import { createV5State, phaseIndex, shouldOfferPause, v5Reducer } from "./reducer";
import type { V5Phase } from "./types";
import { useEmotionLandscape, useKnownPractices } from "./useV5Signals";

/** Jornada Emocional V5 — perceber, compreender, regular, agir, registro. */
const JornadaEmocionalV5 = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [state, dispatch] = useReducer(v5Reducer, undefined, createV5State);
  const [maxPhase, setMaxPhase] = useState<V5Phase>("perceive");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { bubbles, isLoading: landscapeLoading, refetch } = useEmotionLandscape();
  const { known } = useKnownPractices();

  useEffect(() => {
    const draft = loadDraft();
    if (draft && !draft.completedAt) {
      dispatch({ type: "HYDRATE", state: draft });
      setMaxPhase(draft.phase);
    }
  }, []);

  useEffect(() => {
    saveDraft(state);
  }, [state]);

  useEffect(() => {
    if (phaseIndex(state.phase) > phaseIndex(maxPhase)) setMaxPhase(state.phase);
  }, [state.phase, maxPhase]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.phase]);

  const peakIntensity = useMemo(
    () =>
      state.emotions.length
        ? Math.max(...state.emotions.map((item) => item.intensityBefore))
        : null,
    [state.emotions]
  );

  const pausePractice = useMemo(
    () => getPractice(state.regulation.practiceId ?? IMMEDIATE_PAUSE_PRACTICE_ID) ?? getImmediatePausePractice(),
    [state.regulation.practiceId]
  );

  const showPause =
    state.phase === "perceive" &&
    shouldOfferPause(state) &&
    !state.regulation.declined &&
    !state.regulation.completed;

  useEffect(() => {
    if (showPause && !state.regulation.offered && pausePractice) {
      dispatch({ type: "OFFER_PAUSE", practiceId: pausePractice.id });
    }
  }, [showPause, state.regulation.offered, pausePractice]);

  const learningPick = useMemo(() => {
    if (state.phase !== "regulate") return null;
    return selectLearningResource({
      known,
      peakIntensity,
      availableMinutes: state.learning.durationMinutes ?? 5,
      rejectedIds: state.learning.rejectedIds,
    });
  }, [state.phase, known, peakIntensity, state.learning.durationMinutes, state.learning.rejectedIds]);

  useEffect(() => {
    if (learningPick && state.learning.practiceId !== learningPick.practice.id) {
      dispatch({
        type: "SET_LEARNING",
        practiceId: learningPick.practice.id,
        reason: learningPick.reason,
      });
    }
  }, [learningPick, state.learning.practiceId]);

  const learningPractice = getPractice(state.learning.practiceId ?? "");

  const focusLabel =
    state.focus.mode === "whole"
      ? "o momento como um conjunto"
      : getEmotionNode(state.focus.emotionId)?.label ?? "seu registro de hoje";

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await persistSession(state, user?.id ?? null, tenant?.id ?? null);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error ?? "Não foi possível salvar agora. Tente novamente.");
      return;
    }
    if (result.id) dispatch({ type: "MARK_SAVED", remoteId: result.id });
    setSaved(true);
    clearDraft();
    refetch();
  };

  const handleRestart = () => {
    clearDraft();
    setSaved(false);
    setSaveError(null);
    setMaxPhase("perceive");
    dispatch({ type: "RESET" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <header className="space-y-3">
          <Badge variant="secondary" className="rounded-full text-xs font-normal">
            <Sparkles aria-hidden className="mr-1.5 h-3.5 w-3.5" />
            Práticas · Rede Bem-Estar
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {V5_COPY.pageTitle}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            {V5_COPY.pageSubtitle}
          </p>
        </header>

        <PhaseStepper
          phase={state.phase}
          maxReached={maxPhase}
          onGoTo={(phase) => dispatch({ type: "GO_TO", phase })}
        />

        {state.phase === "perceive" && !state.focus.mode && (
          <>
            {showPause && state.regulation.offered && (
              <ImmediateRegulationCard
                practice={pausePractice ?? null}
                regulation={state.regulation}
                onAccept={() => dispatch({ type: "ACCEPT_PAUSE" })}
                onDecline={() => dispatch({ type: "DECLINE_PAUSE" })}
                onSaveForLater={() => dispatch({ type: "DECLINE_PAUSE" })}
                onStart={() => dispatch({ type: "START_PAUSE_PRACTICE" })}
                onComplete={() => dispatch({ type: "COMPLETE_PAUSE_PRACTICE" })}
                onAbandon={() => dispatch({ type: "ABANDON_PAUSE_PRACTICE" })}
                onReassess={(intensity) => dispatch({ type: "SET_REASSESS", intensity })}
                onContinue={() => dispatch({ type: "DECLINE_PAUSE" })}
              />
            )}

            {state.regulation.completed && state.regulation.intensityAfter == null && (
              <ImmediateRegulationCard
                practice={pausePractice ?? null}
                regulation={state.regulation}
                onAccept={() => dispatch({ type: "ACCEPT_PAUSE" })}
                onDecline={() => dispatch({ type: "DECLINE_PAUSE" })}
                onSaveForLater={() => dispatch({ type: "DECLINE_PAUSE" })}
                onStart={() => dispatch({ type: "START_PAUSE_PRACTICE" })}
                onComplete={() => dispatch({ type: "COMPLETE_PAUSE_PRACTICE" })}
                onAbandon={() => dispatch({ type: "ABANDON_PAUSE_PRACTICE" })}
                onReassess={(intensity) => dispatch({ type: "SET_REASSESS", intensity })}
                onContinue={() => dispatch({ type: "DECLINE_PAUSE" })}
              />
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="border-border/70 shadow-sm">
                <CardContent className="space-y-5 p-4 sm:p-6">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {V5_COPY.perceive.eyebrow}
                    </p>
                    <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                      {V5_COPY.perceive.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {V5_COPY.perceive.description}
                    </p>
                  </div>

                  <EmotionBreadcrumb
                    familyId={state.familyId}
                    level2Id={state.level2Id}
                    level3Id={state.level3Id}
                    onReset={() => dispatch({ type: "BACK_LEVEL" })}
                    onSelectFamily={(familyId) => dispatch({ type: "SELECT_FAMILY", familyId })}
                    onSelectLevel2={(emotionId) => dispatch({ type: "SELECT_LEVEL2", emotionId })}
                  />

                  <EmotionWheel
                    familyId={state.familyId}
                    level2Id={state.level2Id}
                    level3Id={state.level3Id}
                    onSelectFamily={(familyId) => dispatch({ type: "SELECT_FAMILY", familyId })}
                    onSelectLevel2={(emotionId) => dispatch({ type: "SELECT_LEVEL2", emotionId })}
                    onSelectLevel3={(emotionId) => dispatch({ type: "SELECT_LEVEL3", emotionId })}
                    onBackLevel={() => dispatch({ type: "BACK_LEVEL" })}
                  />

                  <EmotionListFallback
                    familyId={state.familyId}
                    level2Id={state.level2Id}
                    onSelectFamily={(familyId) => dispatch({ type: "SELECT_FAMILY", familyId })}
                    onSelectLevel2={(emotionId) => dispatch({ type: "SELECT_LEVEL2", emotionId })}
                    onSelectLevel3={(emotionId) => dispatch({ type: "SELECT_LEVEL3", emotionId })}
                  />

                  <p className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground">
                    {V5_COPY.perceive.principle}
                  </p>
                </CardContent>
              </Card>

              <PerceiveSidebar
                emotions={state.emotions}
                pendingEmotionId={state.pendingEmotionId}
                bubbles={bubbles}
                onPick={(emotionId) => dispatch({ type: "PICK_EMOTION", emotionId })}
                onConfirm={(intensity: Intensity) =>
                  dispatch({ type: "CONFIRM_EMOTION", intensity })
                }
                onCancelPending={() => dispatch({ type: "CANCEL_PENDING" })}
                onRemove={(emotionId) => dispatch({ type: "REMOVE_EMOTION", emotionId })}
                onClear={() => dispatch({ type: "CLEAR_EMOTIONS" })}
              />
            </div>

            {state.emotions.length > 0 && !showPause && (
              <FocusSelection
                emotions={state.emotions}
                mode={state.focus.mode}
                emotionId={state.focus.emotionId}
                onSelect={(mode, emotionId) => dispatch({ type: "SET_FOCUS", mode, emotionId })}
                onBack={() => dispatch({ type: "CLEAR_EMOTIONS" })}
                onNext={() => dispatch({ type: "GO_TO", phase: "comprehend" })}
              />
            )}
          </>
        )}

        {state.phase === "perceive" && state.focus.mode && (
          <FocusSelection
            emotions={state.emotions}
            mode={state.focus.mode}
            emotionId={state.focus.emotionId}
            onSelect={(mode, emotionId) => dispatch({ type: "SET_FOCUS", mode, emotionId })}
            onBack={() => dispatch({ type: "SET_FOCUS", mode: "single", emotionId: null })}
            onNext={() => dispatch({ type: "GO_TO", phase: "comprehend" })}
          />
        )}

        {state.phase === "comprehend" && (
          <ComprehensionDimensions
            value={state.comprehension}
            focusLabel={focusLabel}
            onChange={(key, value) => dispatch({ type: "SET_COMPREHENSION", key, value })}
            onToggleUnclear={(key) => dispatch({ type: "TOGGLE_UNCLEAR", key })}
            onSkip={() => dispatch({ type: "SKIP_COMPREHENSION" })}
            onClear={() => dispatch({ type: "CLEAR_COMPREHENSION" })}
            onBack={() => dispatch({ type: "GO_TO", phase: "perceive" })}
            onNext={() => dispatch({ type: "GO_TO", phase: "regulate" })}
          />
        )}

        {state.phase === "regulate" && (
          <LearningResourceCard
            practice={learningPractice ?? null}
            learning={state.learning}
            isNew={learningPick?.isNew ?? true}
            onSelectDuration={(minutes) => dispatch({ type: "SET_LEARNING_DURATION", minutes })}
            onStart={() => dispatch({ type: "START_LEARNING" })}
            onComplete={() => dispatch({ type: "COMPLETE_LEARNING" })}
            onAbandon={() => dispatch({ type: "ABANDON_LEARNING" })}
            onToggleSilent={() => dispatch({ type: "TOGGLE_LEARNING_SILENT" })}
            onSkip={() => dispatch({ type: "SKIP_LEARNING" })}
            onAnother={() => dispatch({ type: "REJECT_LEARNING" })}
            onSetUtility={(utility) => dispatch({ type: "SET_LEARNING_UTILITY", utility })}
            onNext={() => dispatch({ type: "GO_TO", phase: "act" })}
          />
        )}

        {state.phase === "act" && (
          <ControlColumns
            value={state.action}
            onChange={(key, value) => dispatch({ type: "SET_ACTION", key, value })}
            onWhen={(when) => dispatch({ type: "SET_ACTION_WHEN", when })}
            onStatus={(status) => dispatch({ type: "SET_ACTION_STATUS", status })}
            onBack={() => dispatch({ type: "GO_TO", phase: "regulate" })}
            onFinish={() => dispatch({ type: "FINISH" })}
          />
        )}

        {state.phase === "record" && (
          <div className="space-y-6">
            <SessionSummary
              state={state}
              saving={saving}
              saved={saved}
              saveError={saveError}
              onSave={handleSave}
              onRestart={handleRestart}
            />
            <EmotionLandscape
              bubbles={bubbles}
              todayIds={state.emotions.map((item) => item.emotionId)}
              isLoading={landscapeLoading}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JornadaEmocionalV5;
