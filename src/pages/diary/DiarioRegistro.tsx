import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  Brain,
  CalendarDays,
  CheckCircle2,
  Heart,
  NotebookPen,
  Save,
  Settings2,
  Sparkles,
  Tag,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  useMoodEntries,
  type MoodEntry,
} from "@/hooks/useMoodEntries";
import { useEmotionConfig } from "@/hooks/useEmotionConfig";
import { useTenant } from "@/hooks/useTenant";

import {
  getTodayLocalDateString,
  normalizeDateForStorage,
} from "@/lib/utils";

import { DynamicEmotionSlider } from "@/components/DynamicEmotionSlider";
import { EntryComparisonCard } from "@/components/mood/EntryComparisonCard";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SleepSlider } from "@/components/ui/sleep-slider";
import { AudioRecorder } from "@/components/ui/audio-recorder";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";

const DiarioRegistro = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { tenant } = useTenant();

  const {
    entries: allEntries,
    getEntryByDate,
    createOrUpdateEntry,
  } = useMoodEntries();

  const {
    activeConfigs,
    loading: configsLoading,
  } = useEmotionConfig();

  const { toast } = useToast();

  const editDate = searchParams.get("date");

  const [selectedTab, setSelectedTab] =
    useState<"texto" | "audio">("texto");

  const [formData, setFormData] = useState({
    date: editDate || getTodayLocalDateString(),

    emotion_values: {} as Record<
      string,
      number
    >,

    sleep_hours: "",

    sleep_quality: [3],

    journal_text: "",

    audio_url: "",

    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [checkingExisting, setCheckingExisting] =
    useState(false);

  const [isEditMode, setIsEditMode] =
    useState(false);

  const [currentEntry, setCurrentEntry] =
    useState<MoodEntry | null>(null);

  const [initialized, setInitialized] =
    useState(false);

  /* =========================================
     DADOS DERIVADOS
  ========================================= */

  const emotionCount =
    Object.keys(
      formData.emotion_values
    ).length;

  const hasJournal =
    Boolean(formData.journal_text.trim());

  const moodValue =
    formData.emotion_values.mood ?? 3;

  const moodLabel =
    moodValue >= 4
      ? "Mais leve"
      : moodValue >= 3
      ? "Equilibrado"
      : "Mais desafiador";

  /* =========================================
     INICIALIZA EMOÇÕES
  ========================================= */

  const initializeEmotionValues =
    useCallback(() => {
      const values: Record<string, number> =
        {};

      activeConfigs.forEach(
        (config) => {
          values[
            config.emotion_type
          ] = Math.floor(
            (config.scale_min +
              config.scale_max) /
              2
          );
        }
      );

      return values;
    }, [activeConfigs]);

  /* =========================================
     CARREGA ENTRADA EXISTENTE
  ========================================= */

  const loadEntryForDate =
    useCallback(
      async (date: string) => {
        if (!user) return;

        setCheckingExisting(true);

        try {
          const existing =
            await getEntryByDate(date);

          if (existing) {
            const emotionValues =
              existing.emotion_values || {
                mood:
                  existing.mood_score,
                energy:
                  existing.energy_level,
                anxiety:
                  existing.anxiety_level,
              };

            setFormData({
              date:
                existing.date,

              emotion_values:
                emotionValues,

              sleep_hours:
                existing.sleep_hours?.toString() ||
                "",

              sleep_quality: [
                existing.sleep_quality ||
                  3,
              ],

              journal_text:
                existing.journal_text ||
                "",

              audio_url:
                existing.audio_url ||
                "",

              tags:
                existing.tags || [],
            });

            setCurrentEntry(
              existing
            );

            setIsEditMode(true);
          } else {
            setFormData({
              date,

              emotion_values:
                initializeEmotionValues(),

              sleep_hours: "",

              sleep_quality: [3],

              journal_text: "",

              audio_url: "",

              tags: [],
            });

            setCurrentEntry(null);
            setIsEditMode(false);
          }
        } catch (error) {
          console.error(
            "Erro ao carregar entrada:",
            error
          );

          toast({
            title:
              "Erro ao carregar entrada",
            description:
              "Não foi possível verificar os registros dessa data.",
            variant: "destructive",
          });
        } finally {
          setCheckingExisting(false);
        }
      },
      [
        user,
        getEntryByDate,
        initializeEmotionValues,
        toast,
      ]
    );

  /* =========================================
     INICIALIZAÇÃO
  ========================================= */

  useEffect(() => {
    if (
      !user ||
      profileLoading ||
      !profile ||
      configsLoading
    ) {
      return;
    }

    const date =
      editDate ||
      getTodayLocalDateString();

    loadEntryForDate(date).finally(
      () => {
        setInitialized(true);
      }
    );
  }, [
    user,
    profile,
    profileLoading,
    configsLoading,
    editDate,
    loadEntryForDate,
  ]);

  /* =========================================
     SALVAMENTO
  ========================================= */

  const saveEntry = async () => {
    if (
      !user ||
      !profile ||
      !formData.date
    ) {
      throw new Error(
        "Dados insuficientes para salvar"
      );
    }

    const entryData = {
      date: normalizeDateForStorage(
        formData.date
      ),

      mood_score:
        formData.emotion_values[
          "mood"
        ] ?? null,

      energy_level:
        formData.emotion_values[
          "energy"
        ] ?? null,

      anxiety_level:
        formData.emotion_values[
          "anxiety"
        ] ?? null,

      sleep_hours:
        formData.sleep_hours
          ? parseFloat(
              formData.sleep_hours
            )
          : null,

      sleep_quality:
        formData.sleep_quality[0] ??
        null,

      journal_text:
        formData.journal_text ||
        null,

      audio_url:
        formData.audio_url || null,

      tags:
        formData.tags.length > 0
          ? formData.tags
          : null,

      emotion_values:
        formData.emotion_values,
    };

    const result =
      await createOrUpdateEntry(
        entryData
      );

    if (!result) {
      throw new Error(
        "Falha ao salvar entrada"
      );
    }

    return result;
  };

  const handleSubmit = async () => {
    if (!user || saving) return;

    setSaving(true);

    try {
      await saveEntry();

      toast({
        title: isEditMode
          ? "Entrada atualizada"
          : "Entrada registrada",
        description:
          "Seu diário emocional foi salvo com sucesso.",
      });

      navigate(
        "/diario-emocional-v2"
      );
    } catch (error) {
      console.error(error);

      toast({
        title:
          "Erro ao salvar entrada",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     DATA
  ========================================= */

  const handleDateChange = async (
    newDate: string
  ) => {
    const today =
      getTodayLocalDateString();

    if (newDate > today) {
      toast({
        title: "Data inválida",
        description:
          "Não é possível registrar uma data futura.",
        variant: "destructive",
      });

      return;
    }

    setFormData((prev) => ({
      ...prev,
      date: newDate,
    }));

    await loadEntryForDate(
      newDate
    );
  };

  /* =========================================
     TAGS
  ========================================= */

  const addTag = () => {
    const tag = newTag.trim();

    if (
      !tag ||
      formData.tags.includes(tag)
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));

    setNewTag("");
  };

  const addSuggestedTag = (
    tag: string
  ) => {
    if (
      formData.tags.includes(tag)
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));
  };

  const removeTag = (
    tagToRemove: string
  ) => {
    setFormData((prev) => ({
      ...prev,

      tags: prev.tags.filter(
        (tag) =>
          tag !== tagToRemove
      ),
    }));
  };

  /* =========================================
     ENTRADA ANTERIOR
  ========================================= */

  const previousEntry =
    currentEntry
      ? allEntries
          .filter(
            (entry) =>
              entry.date <
              currentEntry.date
          )
          .sort((a, b) =>
            b.date.localeCompare(
              a.date
            )
          )[0]
      : null;

  /* =========================================
     LOADING
  ========================================= */

  if (
    !user ||
    profileLoading ||
    !profile ||
    configsLoading ||
    !initialized
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#7667c9] border-t-transparent" />

          <p className="mt-4 text-sm text-slate-500">
            Preparando seu registro...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="px-8 py-8 lg:px-10">
      <div className="mx-auto max-w-[1200px]">

        {/* VOLTAR */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/diario-emocional-v2"
            )
          }
          className="
            mb-6
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-slate-500
            transition
            hover:text-[#173575]
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar ao diário
        </button>

        {/* CABEÇALHO */}

        <section
          className="
            mb-6
            overflow-hidden
            rounded-3xl
            border
            border-[#ddd7fb]
            bg-gradient-to-br
            from-[#f4f1ff]
            via-white
            to-[#f7f9ff]
            p-7
          "
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">

            <div className="max-w-3xl">

              <div
                className="
                  mb-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-white
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-[#7667c9]
                  shadow-sm
                "
              >
                <Sparkles className="h-3.5 w-3.5" />

                {isEditMode
                  ? "Editando registro"
                  : "Novo registro"}
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#173575]">
                {isEditMode
                  ? "Atualize como você se sentiu"
                  : "Como você está se sentindo?"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Registre suas emoções,
                sono e reflexões para
                acompanhar sua evolução
                ao longo do tempo.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">

                <Badge
                  variant="secondary"
                  className="rounded-full bg-white"
                >
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />

                  {new Date(
                    `${formData.date}T12:00:00`
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                </Badge>

                <Badge
                  variant="secondary"
                  className="rounded-full bg-white"
                >
                  <Brain className="mr-1.5 h-3.5 w-3.5" />

                  {emotionCount} emoções
                </Badge>

                <Badge
                  variant="secondary"
                  className="rounded-full bg-white"
                >
                  <NotebookPen className="mr-1.5 h-3.5 w-3.5" />

                  {hasJournal
                    ? "Com reflexão"
                    : "Sem reflexão"}
                </Badge>

              </div>
            </div>

            <div
              className="
                min-w-[240px]
                rounded-2xl
                border
                border-white
                bg-white/80
                p-4
                shadow-sm
              "
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Resumo
              </p>

              <div className="mt-3 flex items-center gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#eee9ff]
                    text-[#7667c9]
                  "
                >
                  <Heart className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-[#173575]">
                    {moodLabel}
                  </p>

                  <p className="text-xs text-slate-500">
                    Humor atual:{" "}
                    {moodValue}/5
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* COMPARAÇÃO */}

        {currentEntry &&
          previousEntry && (
            <div className="mb-6">
              <EntryComparisonCard
                current={
                  currentEntry as any
                }
                previous={
                  previousEntry as any
                }
              />
            </div>
          )}

        {/* FORM */}

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="space-y-8 p-6 lg:p-8">

            {/* DATA */}

            <section>
              <div className="mb-4">
                <h2 className="font-semibold text-[#173575]">
                  Data do registro
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Escolha o dia referente
                  a este registro.
                </p>
              </div>

              <div className="max-w-sm">
                <Input
                  type="date"
                  value={
                    formData.date
                  }
                  max={
                    getTodayLocalDateString()
                  }
                  disabled={
                    checkingExisting
                  }
                  onChange={(event) =>
                    handleDateChange(
                      event.target
                        .value
                    )
                  }
                  className="h-11 rounded-xl"
                />

                {checkingExisting && (
                  <p className="mt-2 text-xs text-[#7667c9]">
                    Verificando registros...
                  </p>
                )}
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* EMOÇÕES */}

            <section>
              <div className="mb-5 flex items-start justify-between gap-4">

                <div>
                  <h2 className="font-semibold text-[#173575]">
                    Suas emoções
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Avalie como cada
                    aspecto está hoje.
                  </p>
                </div>

                <Badge variant="secondary">
                  {activeConfigs.length}{" "}
                  ativas
                </Badge>

              </div>

              {activeConfigs.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-[#cfc7f7] bg-[#f8f6ff] p-8 text-center">

                  <Settings2 className="mx-auto h-6 w-6 text-[#7667c9]" />

                  <p className="mt-3 text-sm text-slate-500">
                    Você ainda não
                    configurou emoções.
                  </p>

                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() =>
                      navigate(
                        "/diario-emocional-v2/configuracoes"
                      )
                    }
                  >
                    Configurar emoções
                  </Button>

                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                  {activeConfigs.map(
                    (config) => {
                      const defaultValue =
                        Math.floor(
                          (config.scale_min +
                            config.scale_max) /
                            2
                        );

                      const value =
                        formData
                          .emotion_values[
                          config
                            .emotion_type
                        ] ??
                        defaultValue;

                      return (
                        <div
                          key={
                            config.emotion_type
                          }
                          className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-4
                            transition
                            hover:border-[#d7d0f8]
                            hover:shadow-sm
                          "
                        >
                          <div className="mb-2 flex justify-end">

                            <span className="rounded-full bg-[#f1eeff] px-3 py-1 text-xs font-semibold text-[#7667c9]">
                              {value}/
                              {
                                config.scale_max
                              }
                            </span>

                          </div>

                          <DynamicEmotionSlider
                            emotionConfig={
                              config
                            }
                            value={[
                              value,
                            ]}
                            onValueChange={(
                              values: number[]
                            ) =>
                              setFormData(
                                (
                                  previous
                                ) => ({
                                  ...previous,

                                  emotion_values:
                                    {
                                      ...previous.emotion_values,

                                      [config.emotion_type]:
                                        values[0],
                                    },
                                })
                              )
                            }
                          />

                        </div>
                      );
                    }
                  )}

                </div>
              )}
            </section>

            <div className="border-t border-slate-100" />

            {/* SONO */}

            <section>

              <div className="mb-5">
                <h2 className="font-semibold text-[#173575]">
                  Sono
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  O sono também pode
                  influenciar seu
                  estado emocional.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 p-5">

                  <Label>
                    Horas de sono
                  </Label>

                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="Ex: 8"
                    value={
                      formData.sleep_hours
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,

                          sleep_hours:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="mt-3 h-11 rounded-xl"
                  />

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <Label>
                    Qualidade do sono
                  </Label>

                  <div className="mt-5">
                    <SleepSlider
                      value={
                        formData.sleep_quality
                      }
                      onValueChange={(
                        value
                      ) =>
                        setFormData(
                          (previous) => ({
                            ...previous,

                            sleep_quality:
                              value,
                          })
                        )
                      }
                    />
                  </div>

                </div>

              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* TAGS */}

            <section>

              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#7667c9]" />

                  <h2 className="font-semibold text-[#173575]">
                    Etiquetas
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Categorize o que
                  aconteceu no seu dia.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                {[
                  "Trabalho",
                  "Família",
                  "Exercício",
                  "Amigos",
                  "Estudo",
                  "Lazer",
                ].map(
                  (suggestion) => (
                    <Button
                      key={
                        suggestion
                      }
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={formData.tags.includes(
                        suggestion
                      )}
                      onClick={() =>
                        addSuggestedTag(
                          suggestion
                        )
                      }
                      className="rounded-full"
                    >
                      {suggestion}
                    </Button>
                  )
                )}

              </div>

              <div className="mt-4 flex max-w-xl gap-2">

                <Input
                  value={newTag}
                  placeholder="Outra etiqueta..."
                  onChange={(event) =>
                    setNewTag(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  className="rounded-xl"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                >
                  Adicionar
                </Button>

              </div>

              {formData.tags.length >
                0 && (
                <div className="mt-4 flex flex-wrap gap-2">

                  {formData.tags.map(
                    (tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer rounded-full px-3 py-1.5"
                        onClick={() =>
                          removeTag(tag)
                        }
                      >
                        {tag} ×
                      </Badge>
                    )
                  )}

                </div>
              )}

            </section>

            <div className="border-t border-slate-100" />

            {/* REFLEXÃO */}

            <section>

              <div className="mb-5">
                <h2 className="font-semibold text-[#173575]">
                  Reflexões do dia
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Escreva ou grave como
                  foi o seu dia.
                </p>
              </div>

              <Tabs
                value={selectedTab}
                onValueChange={(
                  value
                ) =>
                  setSelectedTab(
                    value as
                      | "texto"
                      | "audio"
                  )
                }
              >

                <TabsList className="grid w-full max-w-sm grid-cols-2">
                  <TabsTrigger value="texto">
                    Texto
                  </TabsTrigger>

                  <TabsTrigger value="audio">
                    Áudio
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="texto"
                  className="mt-4"
                >
                  <Textarea
                    value={
                      formData.journal_text
                    }
                    placeholder="Como foi seu dia? O que aconteceu? Como você se sentiu?"
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,

                          journal_text:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="min-h-[160px] resize-y rounded-2xl"
                  />
                </TabsContent>

                <TabsContent
                  value="audio"
                  className="mt-4"
                >
                  <AudioRecorder
                    userId={
                      user?.id || ""
                    }
                    entryDate={
                      formData.date
                    }
                    tenantId={
                      tenant?.id
                    }
                    existingAudioUrl={
                      formData.audio_url ||
                      undefined
                    }
                    onAudioUploaded={(
                      audioUrl
                    ) =>
                      setFormData(
                        (previous) => ({
                          ...previous,

                          audio_url:
                            audioUrl,
                        })
                      )
                    }
                    onTranscriptionComplete={(
                      _transcription,
                      reflection
                    ) => {
                      setFormData(
                        (previous) => ({
                          ...previous,

                          journal_text:
                            reflection,
                        })
                      );

                      setSelectedTab(
                        "texto"
                      );
                    }}
                    className="w-full"
                  />
                </TabsContent>

              </Tabs>
            </section>

            {/* AÇÕES */}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

              <Button
                variant="outline"
                disabled={
                  saving ||
                  checkingExisting
                }
                onClick={() =>
                  navigate(
                    "/diario-emocional-v2"
                  )
                }
                className="rounded-xl"
              >
                Cancelar
              </Button>

              <Button
                disabled={
                  saving ||
                  checkingExisting
                }
                onClick={
                  handleSubmit
                }
                className="min-w-[180px] rounded-xl bg-[#173575] hover:bg-[#10295f]"
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    Salvando...
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}

                    {isEditMode
                      ? "Atualizar entrada"
                      : "Salvar entrada"}
                  </>
                )}
              </Button>

            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DiarioRegistro;