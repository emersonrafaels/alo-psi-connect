import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";
import { JourneyProvider, useJourney } from "../state/JourneyProvider";
import { EmotionWheel } from "../components/EmotionWheel";
import { EmotionSearch } from "../components/EmotionSearch";
import { EmotionListFallback } from "../components/EmotionListFallback";
import { EmotionBreadcrumb } from "../components/EmotionBreadcrumb";
import { EmotionConfirmBar, EmotionLevelCards } from "../components/EmotionLevelCards";
import { JourneyStepper, type JourneyStep } from "../components/JourneyStepper";
import { IntensityScale } from "../components/IntensityScale";
import { ContextQuestionStep } from "../components/ContextQuestionStep";
import { RecommendationCard } from "../components/RecommendationCard";
import { WhyThisPractice } from "../components/WhyThisPractice";
import { PracticePlayer } from "../components/players/PracticePlayer";
import { PracticeCheckout } from "../components/PracticeCheckout";
import { getEmotionNode } from "../config/emotion-taxonomy";
import { getFamilyCopy } from "../config/family-copy";
import { getContextQuestion } from "../config/context-questions";
import { getPractice } from "../config/practices";
import { recommend } from "../engine/recommend";
import { JOURNEY_EVENTS } from "../analytics/events";
import { track } from "../analytics/track";
import type { Intensity } from "../domain/types";

/** Seção numerada da tela única. */
const Section = ({
  id,
  index,
  title,
  subtitle,
  badge,
  children,
  innerRef,
}: {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  innerRef?: (el: HTMLDivElement | null) => void;
}) => (
  <section
    id={id}
    ref={innerRef}
    className="scroll-mt-28 border-t border-border/60 pt-8 first:border-t-0 first:pt-0"
  >
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          <span className="text-primary">{index}.</span> {title}
        </h2>
        {subtitle && <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {badge && (
        <Badge variant="secondary" className="shrink-0 rounded-full text-xs font-normal">
          {badge}
        </Badge>
      )}
    </div>
    {children}
  </section>
);

const STEP_KEYS = [
  "familia",
  "emocao",
  "intensidade",
  "contexto",
  "recomendacao",
  "pratica",
  "checkout",
  "concluir",
] as const;

const JourneyFlow = () => {
  const { state, dispatch, helpers } = useJourney();
  const [note, setNote] = useState("");
  const [refineOpen, setRefineOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const family = helpers.family;
  const level2Node = getEmotionNode(state.level2Id);
  const level3Node = getEmotionNode(state.level3Id);
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
  const duration = state.selectedDuration ?? selectedPractice?.durations[0] ?? 3;

  const needLabel =
    contextQuestion?.options.find((option) => option.id === state.contextAnswerId)?.label ?? null;

  const stage = state.stage;
  const afterReco = ["recommendation", "practice", "checkout", "understand", "completed"].includes(
    stage
  );

  const scrollTo = (key: string) => {
    const el = sectionRefs.current[key];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // rola automaticamente para a seção recém-liberada
  const lastRevealed = useRef<string>("familia");
  useEffect(() => {
    const target = afterReco
      ? stage === "practice"
        ? "pratica"
        : stage === "checkout"
          ? "checkout"
          : stage === "recommendation"
            ? "recomendacao"
            : "concluir"
      : state.intensity
        ? "contexto"
        : state.selectedEmotionId
          ? "intensidade"
          : state.familyId
            ? "emocao"
            : "familia";
    if (target !== lastRevealed.current) {
      lastRevealed.current = target;
      const timer = window.setTimeout(() => scrollTo(target), 120);
      return () => window.clearTimeout(timer);
    }
  }, [stage, afterReco, state.familyId, state.selectedEmotionId, state.intensity]);

  // ---------- entrada ----------
  if (stage === "entry") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 p-6">
            <Badge className="text-xs">Começar aqui</Badge>
            <h2 className="text-xl font-semibold text-foreground">Quero me regular agora</h2>
            <p className="text-sm text-muted-foreground">
              Você nomeia o que está sentindo e recebe uma prática curta escolhida para esse estado.
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
            <h2 className="text-xl font-semibold text-foreground">Quero entender o que sinto</h2>
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

  const steps: JourneyStep[] = [
    {
      key: "familia",
      label: "Família",
      done: !!state.familyId,
      active: !state.familyId,
      enabled: true,
    },
    {
      key: "emocao",
      label: "Emoção",
      done: !!state.selectedEmotionId,
      active: !!state.familyId && !state.selectedEmotionId,
      enabled: !!state.familyId,
    },
    {
      key: "intensidade",
      label: "Intensidade",
      done: !!state.intensity,
      active: !!state.selectedEmotionId && !state.intensity,
      enabled: !!state.selectedEmotionId,
    },
    {
      key: "contexto",
      label: "Contexto",
      done: !!state.contextAnswerId || afterReco,
      active: stage === "context",
      enabled: !!state.intensity,
    },
    {
      key: "recomendacao",
      label: "Recomendação",
      done: !!state.practiceStartedAt,
      active: stage === "recommendation",
      enabled: afterReco,
    },
    {
      key: "pratica",
      label: "Prática",
      done: !!state.practiceCompletedAt,
      active: stage === "practice",
      enabled: stage === "practice" || !!state.practiceCompletedAt,
    },
    {
      key: "checkout",
      label: "Checkout",
      done: state.status === "checkout_completed" || stage === "completed",
      active: stage === "checkout",
      enabled: stage === "checkout" || state.status === "checkout_completed",
    },
    {
      key: "concluir",
      label: "Concluir",
      done: stage === "completed",
      active: stage === "understand" || stage === "completed",
      enabled: stage === "understand" || stage === "completed",
    },
  ];

  const setRef = (key: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
  };

  return (
    <div className="space-y-6">
      <JourneyStepper
        steps={steps}
        onGoTo={scrollTo}
        onReset={() => {
          setRefineOpen(false);
          setNote("");
          dispatch({ type: "RESET" });
        }}
      />

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-8 p-5 sm:p-8">
          {/* 1 — família */}
          <Section
            id="familia"
            innerRef={setRef("familia")}
            index={1}
            title="Selecione uma família emocional"
            subtitle="O clique no nível 1 abre as palavras do nível 2. Você também pode buscar direto pelo nome."
            badge="Nível 1"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="space-y-4">
                {family && (
                  <div
                    className="mx-auto flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{
                      borderColor: `${family.color}66`,
                      backgroundColor: `${family.color}1f`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: family.color }}
                    />
                    Família selecionada: {family.label}
                  </div>
                )}
                <EmotionWheel
                  className="mx-auto max-w-[560px]"
                  familyId={state.familyId}
                  level2Id={state.level2Id}
                  onSelectFamily={(familyId) => {
                    setRefineOpen(false);
                    dispatch({ type: "SELECT_FAMILY", familyId });
                    track(JOURNEY_EVENTS.emotionFamilySelected, { familyId });
                  }}
                  onSelectLevel2={(emotionId) => {
                    setRefineOpen(false);
                    dispatch({ type: "SELECT_LEVEL2", emotionId });
                    track(JOURNEY_EVENTS.emotionLevel2Selected, { emotionId, emotionLevel: 2 });
                  }}
                  onSelectLevel3={(emotionId) => {
                    setRefineOpen(true);
                    dispatch({ type: "SELECT_LEVEL3", emotionId });
                  }}
                  onBackLevel={() => {
                    setRefineOpen(false);
                    if (state.level2Id && state.familyId) {
                      dispatch({ type: "SELECT_FAMILY", familyId: state.familyId });
                    } else {
                      dispatch({ type: "CLEAR_FAMILY" });
                    }
                  }}
                />
                <EmotionSearch
                  onPick={(id) => {
                    setRefineOpen(false);
                    dispatch({ type: "CONFIRM_EMOTION", emotionId: id });
                    track(JOURNEY_EVENTS.emotionSelected, { emotionId: id, source: "search" });
                  }}
                />
              </div>

              <Card className="border-border/70 bg-muted/30">
                <CardContent className="space-y-4 p-5">
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: family?.color ?? "hsl(var(--foreground))" }}
                  >
                    {family?.label ?? "Escolha uma família"}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {family
                      ? getFamilyCopy(family.id)
                      : "Cada família reúne palavras mais específicas. Escolha a que parece mais próxima — é possível refinar depois."}
                  </p>
                  {!!family?.children?.length && (
                    <div className="flex flex-wrap gap-1.5">
                      {family.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setRefineOpen(false);
                            dispatch({ type: "SELECT_LEVEL2", emotionId: child.id });
                          }}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                            state.level2Id === child.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-accent"
                          )}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* 2 — nível 2 */}
          {family && (
            <Section
              id="emocao"
              innerRef={setRef("emocao")}
              index={2}
              title="Escolha uma emoção"
              subtitle="Depois da seleção, você pode confirmar no nível 2 ou abrir o refinamento do nível 3."
              badge="Nível 2"
            >
              <div className="space-y-4">
                <Badge
                  className="rounded-full text-xs"
                  style={{ backgroundColor: family.color, color: "hsl(var(--background))" }}
                >
                  {family.label}
                </Badge>

                <EmotionLevelCards
                  nodes={family.children}
                  selectedId={state.level2Id}
                  levelLabel="Nível 2"
                  familyLabel={family.label}
                  color={family.color}
                  onSelect={(emotionId) => {
                    setRefineOpen(false);
                    dispatch({ type: "SELECT_LEVEL2", emotionId });
                    track(JOURNEY_EVENTS.emotionLevel2Selected, { emotionId, emotionLevel: 2 });
                  }}
                />

                {level2Node && (
                  <EmotionConfirmBar
                    title={`Você selecionou “${level2Node.label}”`}
                    hint="Pode continuar agora ou refinar com uma palavra do nível 3."
                  >
                    <Button
                      onClick={() => {
                        setRefineOpen(false);
                        dispatch({ type: "CONFIRM_EMOTION", emotionId: level2Node.id });
                        track(JOURNEY_EVENTS.emotionSelected, {
                          emotionId: level2Node.id,
                          source: "wheel_level2",
                        });
                      }}
                    >
                      Confirmar e continuar
                    </Button>
                    {!!level2Node.children?.length && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRefineOpen(true);
                          window.setTimeout(() => scrollTo("refinamento"), 80);
                        }}
                      >
                        Refinar no nível 3
                      </Button>
                    )}
                  </EmotionConfirmBar>
                )}
              </div>
            </Section>
          )}

          {/* 3 — nível 3 */}
          {level2Node && (refineOpen || level3Node) && !!level2Node.children?.length && (
            <Section
              id="refinamento"
              innerRef={setRef("refinamento")}
              index={3}
              title="Refinamento opcional"
              subtitle="Escolha uma palavra mais específica ou volte e confirme a emoção do nível 2."
              badge="Nível 3 · opcional"
            >
              <div className="space-y-4">
                <EmotionLevelCards
                  nodes={level2Node.children}
                  selectedId={state.level3Id}
                  levelLabel="Nível 3"
                  color={family?.color}
                  onSelect={(emotionId) => dispatch({ type: "SELECT_LEVEL3", emotionId })}
                />

                {level3Node && (
                  <EmotionConfirmBar
                    title={`Refinamento selecionado: “${level3Node.label}”`}
                    hint="O nó selecionado será a emoção final da sessão."
                  >
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setRefineOpen(false);
                        dispatch({ type: "SELECT_LEVEL2", emotionId: level2Node.id });
                      }}
                    >
                      Usar nível 2
                    </Button>
                    <Button
                      onClick={() => {
                        dispatch({ type: "CONFIRM_EMOTION", emotionId: level3Node.id });
                        track(JOURNEY_EVENTS.emotionSelected, {
                          emotionId: level3Node.id,
                          source: "wheel",
                        });
                      }}
                    >
                      Confirmar e continuar
                    </Button>
                  </EmotionConfirmBar>
                )}
              </div>
            </Section>
          )}

          {/* 4 — intensidade */}
          {state.selectedEmotionId && (
            <Section
              id="intensidade"
              innerRef={setRef("intensidade")}
              index={4}
              title="Quanto essa emoção está presente agora?"
              subtitle="A intensidade é registrada somente depois que a palavra final foi definida."
              badge="Intensidade"
            >
              <div className="space-y-5">
                <EmotionBreadcrumb
                  ids={[state.familyId, state.level2Id, state.level3Id]}
                  onSelect={(id) => {
                    const node = getEmotionNode(id);
                    if (node?.level === 1) {
                      setRefineOpen(false);
                      dispatch({ type: "SELECT_FAMILY", familyId: id });
                    }
                    if (node?.level === 2) {
                      setRefineOpen(false);
                      dispatch({ type: "SELECT_LEVEL2", emotionId: id });
                    }
                    if (node?.level === 3) dispatch({ type: "SELECT_LEVEL3", emotionId: id });
                  }}
                />

                <IntensityScale
                  value={state.intensity}
                  color={family?.color}
                  label=""
                  onChange={(intensity) => {
                    dispatch({ type: "SELECT_INTENSITY", intensity });
                    track(JOURNEY_EVENTS.intensitySelected, {
                      emotionId: state.selectedEmotionId,
                      intensity,
                    });
                  }}
                />

                {state.intensity && (
                  <div className="flex justify-end">
                    <Button onClick={() => scrollTo("contexto")}>
                      Continuar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* 5 — contexto */}
          {state.intensity && (
            <Section
              id="contexto"
              innerRef={setRef("contexto")}
              index={5}
              title={contextQuestion?.question ?? "O que você mais precisa neste momento?"}
              subtitle="Uma pergunta curta ajuda a ordenar as práticas sem transformar o check-in em questionário."
              badge="Pergunta contextual"
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                  <span className="font-semibold text-foreground">
                    {helpers.selectedEmotion?.label}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · Intensidade {state.intensity}/5 ·{" "}
                    {[family?.label, level2Node?.label, level3Node?.label]
                      .filter(Boolean)
                      .join(" → ")}
                  </span>
                </div>

                {contextQuestion ? (
                  <ContextQuestionStep
                    question={{ ...contextQuestion, question: "" }}
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

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!afterReco && (
                    <Button variant="ghost" onClick={() => dispatch({ type: "SKIP_CONTEXT" })}>
                      Pular esta pergunta
                    </Button>
                  )}
                  {afterReco && (
                    <Button onClick={() => scrollTo("recomendacao")}>
                      Ver recomendação <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* 6 — recomendação */}
          {afterReco && (
            <Section
              id="recomendacao"
              innerRef={setRef("recomendacao")}
              index={6}
              title="Práticas recomendadas para você"
              subtitle="Uma prática principal e até duas alternativas, com regras curatoriais claras."
              badge="Recomendação determinística"
            >
              {!result ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ainda não temos uma prática liberada pela curadoria para essa combinação. Você
                    pode escolher outra palavra.
                  </p>
                  <Button variant="outline" onClick={() => scrollTo("familia")}>
                    Escolher outra emoção
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      Você selecionou{" "}
                      <strong className="text-foreground">
                        {helpers.selectedEmotion?.label}
                      </strong>{" "}
                      ({state.intensity}/5)
                      {needLabel && (
                        <>
                          {" "}
                          e indicou: <strong className="text-foreground">{needLabel}</strong>
                        </>
                      )}
                      .
                    </div>

                    <RecommendationCard
                      practice={result.primary}
                      primary
                      selected={state.selectedPracticeId === result.primary.id}
                      selectedDuration={state.selectedDuration}
                      onSelectPractice={() =>
                        dispatch({ type: "SELECT_PRACTICE", practiceId: result.primary.id })
                      }
                      onSelectDuration={(minutes) =>
                        dispatch({ type: "SELECT_DURATION", minutes })
                      }
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
                          track(JOURNEY_EVENTS.alternativeRequested, {
                            ruleId: result.decision.ruleId,
                          });
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
                          onSelectDuration={(minutes) =>
                            dispatch({ type: "SELECT_DURATION", minutes })
                          }
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

                  <WhyThisPractice
                    practice={getPractice(state.selectedPracticeId) ?? result.primary}
                    emotionLabel={helpers.selectedEmotion?.label ?? ""}
                    intensity={state.intensity ?? 0}
                    needLabel={needLabel}
                  />
                </div>
              )}
            </Section>
          )}

          {/* 7 — prática */}
          {stage === "practice" && selectedPractice && (
            <Section
              id="pratica"
              innerRef={setRef("pratica")}
              index={7}
              title="Prática em andamento"
              badge={selectedPractice.categoryLabel}
            >
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
            </Section>
          )}

          {/* 8 — checkout */}
          {stage === "checkout" && state.intensity && (
            <Section
              id="checkout"
              innerRef={setRef("checkout")}
              index={8}
              title="Como você está agora?"
              subtitle="Só o que você percebeu. Sem certo ou errado."
              badge="Checkout"
            >
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
                onUsefulness={(usefulness: Intensity) =>
                  dispatch({ type: "SET_USEFULNESS", usefulness })
                }
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
            </Section>
          )}

          {/* 9 — concluir */}
          {(stage === "understand" || stage === "completed") && (
            <Section
              id="concluir"
              innerRef={setRef("concluir")}
              index={9}
              title={stage === "completed" ? "Jornada concluída" : "Encerrar a jornada"}
              subtitle={
                stage === "completed"
                  ? "Obrigado por dedicar esse tempo a você."
                  : "A Paisagem Emocional e o Mapa do Estresse chegam na próxima etapa da jornada."
              }
              badge="Concluir"
            >
              <div className="flex flex-wrap gap-2">
                {stage === "understand" ? (
                  <Button
                    onClick={() => {
                      dispatch({ type: "FINISH" });
                      track(JOURNEY_EVENTS.journeyCompleted, {});
                    }}
                  >
                    <Heart className="mr-2 h-4 w-4" /> Encerrar jornada
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setRefineOpen(false);
                      setNote("");
                      dispatch({ type: "RESET" });
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Nova jornada
                  </Button>
                )}
              </div>
            </Section>
          )}

          <Accordion type="single" collapsible className="border-t border-border/60 pt-2">
            <AccordionItem value="lista" className="border-none">
              <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <LayoutList className="h-4 w-4" /> Ver todas as palavras em lista
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <EmotionListFallback
                  onSelect={(id) => {
                    setRefineOpen(false);
                    dispatch({ type: "CONFIRM_EMOTION", emotionId: id });
                    track(JOURNEY_EVENTS.emotionSelected, { emotionId: id, source: "list" });
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
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
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
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
