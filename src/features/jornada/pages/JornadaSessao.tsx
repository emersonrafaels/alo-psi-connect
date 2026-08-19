import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Compass,
  Heart,
  LayoutList,
  RotateCcw,
  Sparkles,
  Wind,
} from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";
import { JourneyProvider, useJourney } from "../state/JourneyProvider";
import { EmotionWheel } from "../components/EmotionWheel";
import { EmotionListFallback } from "../components/EmotionListFallback";
import { EmotionBreadcrumb } from "../components/EmotionBreadcrumb";
import { IntensityScale } from "../components/IntensityScale";
import { ContextQuestionStep } from "../components/ContextQuestionStep";
import { RecommendationCard } from "../components/RecommendationCard";
import { PracticePlayer } from "../components/players/PracticePlayer";
import { PracticeCheckout } from "../components/PracticeCheckout";
import { EMOTION_FAMILIES, getEmotionNode } from "../config/emotion-taxonomy";
import { getContextQuestion } from "../config/context-questions";
import { getPractice } from "../config/practices";
import { recommend } from "../engine/recommend";
import { JOURNEY_EVENTS } from "../analytics/events";
import { track } from "../analytics/track";
import type { Intensity } from "../domain/types";

const StageShell = ({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
}) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        {onBack && (
          <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        )}
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </CardContent>
  </Card>
);

const JourneyFlow = () => {
  const { state, dispatch, helpers } = useJourney();
  const [useList, setUseList] = useState(false);
  const [note, setNote] = useState("");

  const family = helpers.family;
  const level2Node = getEmotionNode(state.level2Id);
  const contextQuestion = useMemo(() => getContextQuestion(state.familyId), [state.familyId]);

  const result = useMemo(() => {
    if (!state.selectedEmotionId || !state.intensity) return null;
    return recommend({
      sessionId: state.sessionId,
      emotionId: state.selectedEmotionId,
      intensity: state.intensity,
      contextAnswerId: state.contextAnswerId,
    });
  }, [state.sessionId, state.selectedEmotionId, state.intensity, state.contextAnswerId]);

  const selectedPractice = getPractice(state.selectedPracticeId);
  const duration =
    state.selectedDuration ?? selectedPractice?.durations[0] ?? 3;

  // ---------- entry ----------
  if (state.stage === "entry") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 p-6">
            <Badge className="text-xs">Começar aqui</Badge>
            <h2 className="text-xl font-semibold text-foreground">
              Quero me regular agora
            </h2>
            <p className="text-sm text-muted-foreground">
              Você nomeia o que está sentindo e recebe uma prática curta escolhida para esse
              estado.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                dispatch({ type: "SELECT_MODE", mode: "regulate", entryPoint: "jornada_entry" });
                track(JOURNEY_EVENTS.journeyStarted, { journeyMode: "regulate" });
              }}
            >
              <Wind className="mr-2 h-4 w-4" /> Iniciar jornada
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <Badge variant="secondary" className="text-xs">
              Entender
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">
              Quero entender o que sinto
            </h2>
            <p className="text-sm text-muted-foreground">
              Mesmo caminho, com mais espaço para observar antes de praticar.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                dispatch({ type: "SELECT_MODE", mode: "understand", entryPoint: "jornada_entry" });
                track(JOURNEY_EVENTS.journeyStarted, { journeyMode: "understand" });
              }}
            >
              <Compass className="mr-2 h-4 w-4" /> Explorar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- wheel ----------
  if (state.stage === "wheel") {
    const level2Options = family?.children ?? [];
    const level3Options = level2Node?.children ?? [];

    return (
      <StageShell
        title="O que você está sentindo agora?"
        subtitle="Comece pela família emocional. Depois você refina em palavras mais específicas."
        onBack={() => dispatch({ type: "BACK" })}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EmotionBreadcrumb
            ids={[state.familyId, state.level2Id, state.level3Id]}
            onSelect={(id) => {
              const node = getEmotionNode(id);
              if (node?.level === 1) dispatch({ type: "SELECT_FAMILY", familyId: id });
              if (node?.level === 2) dispatch({ type: "SELECT_LEVEL2", emotionId: id });
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => setUseList((v) => !v)}>
            <LayoutList className="mr-2 h-4 w-4" />
            {useList ? "Usar a Roda" : "Ver lista completa"}
          </Button>
        </div>

        {useList ? (
          <EmotionListFallback
            onSelect={(id) => {
              dispatch({ type: "CONFIRM_EMOTION", emotionId: id });
              track(JOURNEY_EVENTS.emotionSelected, { emotionId: id, source: "list" });
            }}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[auto,1fr]">
            <EmotionWheel
              selectedFamilyId={state.familyId}
              onSelectFamily={(familyId) => {
                dispatch({ type: "SELECT_FAMILY", familyId });
                track(JOURNEY_EVENTS.emotionFamilySelected, { familyId });
              }}
            />

            <div className="space-y-6">
              {!family && (
                <p className="text-sm text-muted-foreground">
                  Escolha uma família na Roda para ver as palavras disponíveis.
                </p>
              )}

              {family && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Nível 2 · {family.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {level2Options.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => dispatch({ type: "SELECT_LEVEL2", emotionId: node.id })}
                        aria-pressed={state.level2Id === node.id}
                        className={
                          state.level2Id === node.id
                            ? "rounded-full border border-transparent px-4 py-2 text-sm font-medium text-primary-foreground"
                            : "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                        }
                        style={
                          state.level2Id === node.id
                            ? { backgroundColor: family.color }
                            : undefined
                        }
                      >
                        {node.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {level2Node && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Nível 3 · escolha a palavra mais próxima
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {level3Options.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          dispatch({ type: "CONFIRM_EMOTION", emotionId: node.id });
                          track(JOURNEY_EVENTS.emotionSelected, {
                            emotionId: node.id,
                            source: "wheel",
                          });
                        }}
                        className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40"
                      >
                        {node.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      dispatch({ type: "CONFIRM_EMOTION", emotionId: level2Node.id });
                      track(JOURNEY_EVENTS.emotionSelected, {
                        emotionId: level2Node.id,
                        source: "wheel_level2",
                      });
                    }}
                  >
                    Seguir com “{level2Node.label}”
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </StageShell>
    );
  }

  // ---------- intensity ----------
  if (state.stage === "intensity") {
    return (
      <StageShell
        title={`Você escolheu “${helpers.selectedEmotion?.label ?? ""}”`}
        onBack={() => dispatch({ type: "BACK" })}
      >
        <IntensityScale
          value={state.intensity}
          color={family?.color}
          onChange={(intensity) => {
            dispatch({ type: "SELECT_INTENSITY", intensity });
            track(JOURNEY_EVENTS.intensitySelected, {
              emotionId: state.selectedEmotionId,
              intensity,
            });
          }}
        />
      </StageShell>
    );
  }

  // ---------- context ----------
  if (state.stage === "context") {
    return (
      <StageShell
        title="Uma pergunta rápida"
        subtitle="Serve apenas para escolher melhor a prática. Pode pular."
        onBack={() => dispatch({ type: "BACK" })}
      >
        {contextQuestion ? (
          <ContextQuestionStep
            question={contextQuestion}
            value={state.contextAnswerId}
            onAnswer={(optionId) => {
              dispatch({ type: "ANSWER_CONTEXT", contextAnswerId: optionId });
              track(JOURNEY_EVENTS.contextAnswered, { contextAnswerId: optionId });
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma pergunta adicional para esta família.
          </p>
        )}
        <Button variant="ghost" onClick={() => dispatch({ type: "SKIP_CONTEXT" })}>
          Pular esta pergunta
        </Button>
      </StageShell>
    );
  }

  // ---------- recommendation ----------
  if (state.stage === "recommendation") {
    if (!result) {
      return (
        <StageShell
          title="Ainda não temos uma prática liberada para esse estado"
          subtitle="A curadoria precisa aprovar uma prática para essa combinação. Você pode escolher outra palavra."
          onBack={() => dispatch({ type: "BACK" })}
        >
          <Button onClick={() => dispatch({ type: "OPEN_WHEEL" })}>Escolher outra emoção</Button>
        </StageShell>
      );
    }

    return (
      <StageShell
        title="Uma prática para agora"
        subtitle={`Escolhida para “${helpers.selectedEmotion?.label}” com intensidade ${state.intensity}.`}
        onBack={() => dispatch({ type: "BACK" })}
      >
        <div className="space-y-4">
          <RecommendationCard
            practice={result.primary}
            primary
            selected={state.selectedPracticeId === result.primary.id}
            selectedDuration={state.selectedDuration}
            onSelectPractice={() =>
              dispatch({ type: "SELECT_PRACTICE", practiceId: result.primary.id })
            }
            onSelectDuration={(minutes) => dispatch({ type: "SELECT_DURATION", minutes })}
            onStart={() => {
              dispatch({ type: "START_PRACTICE" });
              track(JOURNEY_EVENTS.practiceStarted, {
                practiceId: result.primary.id,
                ruleId: result.decision.ruleId,
              });
            }}
          />

          {!state.showAlternatives && !!result.alternatives.length && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                dispatch({ type: "REQUEST_ALTERNATIVES" });
                track(JOURNEY_EVENTS.alternativeRequested, { ruleId: result.decision.ruleId });
              }}
            >
              Ver outras opções
            </Button>
          )}

          {state.showAlternatives &&
            result.alternatives.map((practice) => (
              <RecommendationCard
                key={practice.id}
                practice={practice}
                selected={state.selectedPracticeId === practice.id}
                selectedDuration={state.selectedDuration}
                onSelectPractice={() =>
                  dispatch({ type: "SELECT_PRACTICE", practiceId: practice.id })
                }
                onSelectDuration={(minutes) => dispatch({ type: "SELECT_DURATION", minutes })}
                onStart={() => {
                  dispatch({ type: "START_PRACTICE" });
                  track(JOURNEY_EVENTS.practiceStarted, {
                    practiceId: practice.id,
                    ruleId: result.decision.ruleId,
                    alternative: true,
                  });
                }}
              />
            ))}
        </div>
      </StageShell>
    );
  }

  // ---------- practice ----------
  if (state.stage === "practice" && selectedPractice) {
    return (
      <StageShell title="Prática em andamento">
        <PracticePlayer
          practice={selectedPractice}
          durationMinutes={duration}
          silentMode={state.silentMode}
          onToggleSilentMode={() => dispatch({ type: "TOGGLE_SILENT_MODE" })}
          onComplete={() => {
            dispatch({ type: "COMPLETE_PRACTICE" });
            track(JOURNEY_EVENTS.practiceCompleted, {
              practiceId: selectedPractice.id,
              durationMinutes: duration,
            });
          }}
          onAbandon={() => {
            dispatch({ type: "ABANDON_PRACTICE" });
            track(JOURNEY_EVENTS.practiceAbandoned, { practiceId: selectedPractice.id });
          }}
        />
      </StageShell>
    );
  }

  // ---------- checkout ----------
  if (state.stage === "checkout" && state.intensity) {
    return (
      <StageShell title="Como você está agora?" subtitle="Só o que você percebeu. Sem certo ou errado.">
        <PracticeCheckout
          intensityBefore={state.intensity}
          intensityAfter={state.intensityAfter}
          perceivedChangeIds={state.perceivedChangeIds}
          usefulness={state.usefulness}
          note={note}
          onNoteChange={setNote}
          onIntensityAfter={(intensity: Intensity) =>
            dispatch({ type: "SET_INTENSITY_AFTER", intensity })
          }
          onTogglePerceived={(optionId) =>
            dispatch({ type: "TOGGLE_PERCEIVED_CHANGE", optionId })
          }
          onUsefulness={(usefulness: Intensity) => dispatch({ type: "SET_USEFULNESS", usefulness })}
          onContinue={() => {
            dispatch({ type: "COMPLETE_CHECKOUT" });
            track(JOURNEY_EVENTS.checkoutCompleted, {
              intensityBefore: state.intensity,
              intensityAfter: state.intensityAfter,
              perceivedChangeIds: state.perceivedChangeIds,
              usefulness: state.usefulness,
            });
          }}
        />
      </StageShell>
    );
  }

  // ---------- understand (fase 2 em curadoria) ----------
  if (state.stage === "understand") {
    return (
      <StageShell title="Quer entender melhor esse estado?" onBack={() => dispatch({ type: "BACK" })}>
        <p className="text-sm text-muted-foreground">
          A Paisagem Emocional e o Mapa do Estresse fazem parte da próxima etapa da jornada e
          serão liberados quando a curadoria concluir o conteúdo. Por enquanto, você já pode
          encerrar registrando o que praticou.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              dispatch({ type: "FINISH" });
              track(JOURNEY_EVENTS.journeyCompleted, {});
            }}
          >
            <Heart className="mr-2 h-4 w-4" /> Encerrar jornada
          </Button>
        </div>
      </StageShell>
    );
  }

  // ---------- completed ----------
  return (
    <StageShell title="Jornada concluída" subtitle="Obrigado por dedicar esse tempo a você.">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => dispatch({ type: "RESET" })}>
          <RotateCcw className="mr-2 h-4 w-4" /> Nova jornada
        </Button>
      </div>
    </StageShell>
  );
};

const JornadaSessao = () => {
  const location = useLocation();
  const basePath = getBasePath(getTenantSlugFromPath(location.pathname));

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Jornada de Autorregulação | Rede Bem-Estar";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
          <div className="mb-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Protótipo
              </Badge>
              <Link
                to={`${basePath}/praticas`}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Voltar para Práticas
              </Link>
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold text-foreground sm:text-4xl">
              <Sparkles className="h-7 w-7 text-primary" />
              Jornada de Autorregulação
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Nomear o que você sente, escolher uma prática adequada ao momento e perceber o que
              mudou. Nenhuma etapa é diagnóstico e nada aqui gera alerta automático.
            </p>
          </div>

          <JourneyProvider>
            <JourneyFlow />
          </JourneyProvider>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JornadaSessao;
