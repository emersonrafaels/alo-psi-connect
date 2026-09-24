
import { useState } from "react";

import {
  Plus,
  Trash2,
  Sparkles,
  Check,
  Settings2,
  Heart,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

import { useEmotionConfig } from "@/hooks/useEmotionConfig";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";

/* =========================================
   CONSTANTES
========================================= */

type TemplateCategory =
  | "basic"
  | "advanced"
  | "wellbeing"
  | "professional";

const templates: {
  key: TemplateCategory;
  name: string;
  count: number;
  description: string;
}[] = [
  {
    key: "basic",
    name: "Básico",
    count: 3,
    description: "Para começar",
  },
  {
    key: "advanced",
    name: "Avançado",
    count: 6,
    description: "Mais detalhes",
  },
  {
    key: "wellbeing",
    name: "Bem-estar",
    count: 5,
    description: "Foco no equilíbrio",
  },
  {
    key: "professional",
    name: "Completo",
    count: 12,
    description: "Visão ampliada",
  },
];

const scaleEmojis: Record<number, string> = {
  1: "😢",
  2: "😔",
  3: "😐",
  4: "😊",
  5: "🤩",
};

const scaleColors: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#059669",
};

const popularEmotions = [
  "Criatividade",
  "Foco",
  "Relaxamento",
  "Motivação",
  "Confiança",
  "Produtividade",
  "Paciência",
  "Gratidão",
  "Clareza",
  "Disposição",
  "Calma",
  "Inspiração",
];

const templateLabels: Record<string, string> = {
  basic: "Básico",
  advanced: "Avançado",
  wellbeing: "Bem-estar",
  professional: "Completo",
  custom: "Personalizado",
};

const templateDescriptions: Record<string, string> = {
  basic: "3 emoções essenciais para começar",
  advanced: "6 emoções para análise mais profunda",
  wellbeing: "5 emoções focadas em bem-estar",
  professional: "12 emoções para análise completa",
  custom: "Configuração personalizada por você",
};

/* =========================================
   COMPONENTE
========================================= */

const DiarioConfiguracoes = () => {
  const {
    userConfigs,
    activeConfigs,
    loading,
    currentTemplate,
    addCustomEmotion,
    removeEmotion,
    toggleEmotion,
    applyTemplate,
  } = useEmotionConfig();

  const [addDialogOpen, setAddDialogOpen] =
    useState(false);

  const [customEmotionName, setCustomEmotionName] =
    useState("");

  const [applyingTemplate, setApplyingTemplate] =
    useState<string | null>(null);

  const [processingEmotion, setProcessingEmotion] =
    useState<string | null>(null);

  const [creatingEmotion, setCreatingEmotion] =
    useState(false);

  /* =========================================
     FUNÇÕES
  ========================================= */

  const handleRemoveEmotion = async (
    emotionType: string
  ) => {
    if (processingEmotion) return;

    setProcessingEmotion(emotionType);

    try {
      await removeEmotion(emotionType);

      toast.success(
        "Emoção removida com sucesso!"
      );
    } catch {
      toast.error(
        "Erro ao remover emoção"
      );
    } finally {
      setProcessingEmotion(null);
    }
  };

  const handleToggleEmotion = async (
    emotionType: string
  ) => {
    if (processingEmotion) return;

    setProcessingEmotion(emotionType);

    try {
      await toggleEmotion(emotionType);

      toast.success(
        "Configuração atualizada!"
      );
    } catch {
      toast.error(
        "Erro ao atualizar configuração"
      );
    } finally {
      setProcessingEmotion(null);
    }
  };

  const handleApplyTemplate = async (
    category: TemplateCategory
  ) => {
    if (applyingTemplate) return;

    setApplyingTemplate(category);

    try {
      await applyTemplate(category);

      toast.success(
        "Template aplicado com sucesso!"
      );
    } catch {
      toast.error(
        "Erro ao aplicar template"
      );
    } finally {
      setApplyingTemplate(null);
    }
  };

  const handleAddCustomEmotion = async () => {
    const emotionName = customEmotionName.trim();

    if (!emotionName) {
      toast.error(
        "Digite um nome para a emoção"
      );

      return;
    }

    if (emotionName.length > 30) {
      toast.error(
        "Nome muito longo (máximo 30 caracteres)"
      );

      return;
    }

    const existingNames = userConfigs.map(
      (config) =>
        config.display_name
          .trim()
          .toLowerCase()
    );

    if (
      existingNames.includes(
        emotionName.toLowerCase()
      )
    ) {
      toast.error(
        "Já existe uma emoção com este nome"
      );

      return;
    }

    if (creatingEmotion) return;

    setCreatingEmotion(true);

    try {
      const emojiSet: Record<string, string> = {};

      const colorScheme: Record<string, string> = {};

      for (let i = 1; i <= 5; i++) {
        emojiSet[i.toString()] =
          scaleEmojis[i];

        colorScheme[i.toString()] =
          scaleColors[i];
      }

      await addCustomEmotion(
        emotionName,
        1,
        5,
        emojiSet,
        colorScheme
      );

      toast.success(
        "Emoção personalizada criada!"
      );

      setCustomEmotionName("");

      setAddDialogOpen(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao criar emoção personalizada"
      );
    } finally {
      setCreatingEmotion(false);
    }
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div
        className="
          flex min-h-[400px]
          items-center justify-center
          px-4
        "
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="
              h-8 w-8 animate-spin
              text-[#7667c9]
              dark:text-violet-400
            "
          />

          <p
            className="
              text-sm text-slate-500
              dark:text-slate-400
            "
          >
            Carregando configurações...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================
     INTERFACE
  ========================================= */

  return (
    <div
      className="
        w-full min-w-0
        px-4 py-6
        sm:px-6
        md:px-8 md:py-8
        lg:px-10
      "
    >
      <div
        className="
          mx-auto w-full min-w-0
          max-w-[1400px]
          space-y-6
        "
      >

        {/* =====================================
            CABEÇALHO
        ===================================== */}

        <header className="space-y-2">

          <p
            className="
              text-xs font-semibold
              uppercase tracking-wider
              text-[#7667c9]
              dark:text-violet-300
            "
          >
            Personalização
          </p>

          <h1
            className="
              text-2xl font-bold
              tracking-tight
              text-[#173575]
              dark:text-slate-100
              sm:text-3xl
            "
          >
            Configurações
          </h1>

          <p
            className="
              max-w-2xl
              text-sm leading-6
              text-slate-500
              dark:text-slate-400
            "
          >
            Personalize as emoções que deseja
            acompanhar no seu diário.
          </p>

        </header>

        {/* =====================================
            TEMPLATE ATUAL
        ===================================== */}

        {currentTemplate && (
          <div
            className="
              rounded-2xl
              border border-violet-200
              bg-violet-50
              p-4
              dark:border-violet-500/20
              dark:bg-violet-500/10
              sm:p-5
            "
          >
            <div
              className="
                flex items-center gap-3
                sm:gap-4
              "
            >

              <div
                className="
                  flex h-11 w-11
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-white
                  dark:bg-violet-500/20
                "
              >
                <Sparkles
                  className="
                    h-5 w-5
                    text-[#7667c9]
                    dark:text-violet-300
                  "
                />
              </div>

              <div className="min-w-0 flex-1">

                <p
                  className="
                    text-xs font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Template atual
                </p>

                <div
                  className="
                    mt-1 flex flex-wrap
                    items-center gap-2
                  "
                >

                  <span
                    className="
                      text-sm font-semibold
                      text-[#173575]
                      dark:text-slate-100
                      sm:text-base
                    "
                  >
                    {templateLabels[currentTemplate] ||
                      currentTemplate}
                  </span>

                  <Badge
                    className="
                      border-0
                      bg-emerald-100
                      text-emerald-800
                      hover:bg-emerald-100
                      dark:bg-emerald-500/15
                      dark:text-emerald-300
                      dark:hover:bg-emerald-500/15
                    "
                  >
                    {activeConfigs.length}{" "}
                    {activeConfigs.length === 1
                      ? "ativa"
                      : "ativas"}
                  </Badge>

                </div>

                <p
                  className="
                    mt-1 text-xs leading-5
                    text-slate-500
                    dark:text-slate-400
                    sm:text-sm
                  "
                >
                  {templateDescriptions[currentTemplate] ||
                    ""}
                </p>

              </div>

            </div>
          </div>
        )}

        {/* =====================================
            TEMPLATES RÁPIDOS
        ===================================== */}

        <Card
          className="
            min-w-0 overflow-hidden
            rounded-2xl
            border border-slate-200
            bg-white shadow-sm

            dark:border-slate-800
            dark:bg-[#161f32]
          "
        >
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">

            <CardTitle
              className="
                flex items-center gap-2
                text-lg font-semibold
                text-[#173575]
                dark:text-slate-100
              "
            >
              <Settings2
                className="
                  h-5 w-5 shrink-0
                  text-[#7667c9]
                  dark:text-violet-300
                "
              />

              Templates rápidos
            </CardTitle>

            <CardDescription
              className="
                text-sm leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              Escolha uma configuração pronta
              de emoções.
            </CardDescription>

          </CardHeader>

          <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">

            <div
              className="
                grid min-w-0
                grid-cols-2 gap-3
                lg:grid-cols-4
              "
            >

              {templates.map((template) => {
                const isActive =
                  currentTemplate === template.key;

                const isApplying =
                  applyingTemplate === template.key;

                return (
                  <button
                    key={template.key}
                    type="button"
                    disabled={applyingTemplate !== null}
                    onClick={() =>
                      handleApplyTemplate(template.key)
                    }
                    aria-pressed={isActive}
                    className={`
                      relative flex min-w-0
                      min-h-[116px]
                      flex-col items-center
                      justify-center gap-2
                      rounded-xl border
                      px-2 py-4
                      text-center
                      transition-all duration-200

                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-violet-400

                      disabled:cursor-wait
                      disabled:opacity-70

                      ${
                        isActive
                          ? `
                            border-[#6b35ac]
                            bg-[#6b35ac]
                            text-white
                            shadow-sm

                            dark:border-violet-500
                            dark:bg-violet-600
                            dark:text-white
                          `
                          : `
                            border-slate-200
                            bg-slate-50
                            text-slate-700

                            hover:border-violet-300
                            hover:bg-violet-50

                            dark:border-slate-700
                            dark:bg-[#111827]
                            dark:text-slate-200

                            dark:hover:border-violet-500/50
                            dark:hover:bg-slate-800
                          `
                      }
                    `}
                  >

                    {isApplying ? (
                      <Loader2
                        className="h-5 w-5 animate-spin"
                      />
                    ) : isActive ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <SlidersHorizontal
                        className="
                          h-5 w-5
                          text-slate-400
                          dark:text-slate-400
                        "
                      />
                    )}

                    <span className="text-sm font-semibold">
                      {template.name}
                    </span>

                    <span
                      className={`
                        text-xs
                        ${
                          isActive
                            ? "text-white/85"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      `}
                    >
                      {isApplying
                        ? "Aplicando..."
                        : `${template.count} emoções`}
                    </span>

                  </button>
                );
              })}

            </div>

          </CardContent>
        </Card>

        {/* =====================================
            SUAS EMOÇÕES
        ===================================== */}

        <Card
          className="
            min-w-0 overflow-hidden
            rounded-2xl
            border border-slate-200
            bg-white shadow-sm

            dark:border-slate-800
            dark:bg-[#161f32]
          "
        >

          {/* CABEÇALHO DO CARD */}

          <CardHeader className="space-y-4 p-4 sm:p-6">

            <div
              className="
                flex min-w-0
                flex-col gap-4
                sm:flex-row
                sm:items-start
                sm:justify-between
              "
            >

              <div className="min-w-0 flex-1">

                <div
                  className="
                    flex flex-wrap
                    items-center gap-2
                  "
                >

                  <CardTitle
                    className="
                      text-lg font-semibold
                      text-[#173575]
                      dark:text-slate-100
                    "
                  >
                    Suas emoções
                  </CardTitle>

                  <Badge
                    className="
                      shrink-0 border-0
                      bg-violet-100
                      text-violet-700
                      hover:bg-violet-100

                      dark:bg-violet-500/20
                      dark:text-violet-200
                      dark:hover:bg-violet-500/20
                    "
                  >
                    {activeConfigs.length}{" "}
                    {activeConfigs.length === 1
                      ? "ativa"
                      : "ativas"}
                  </Badge>

                </div>

                <CardDescription
                  className="
                    mt-2 max-w-lg
                    text-sm leading-5
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Ative ou desative as emoções
                  que deseja acompanhar.
                </CardDescription>

              </div>

              {/* BOTÃO ADICIONAR */}

              <Dialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
              >

                <DialogTrigger asChild>

                  <Button
                    className="
                      h-10 w-full shrink-0
                      rounded-xl
                      bg-[#6b35ac]
                      px-4 text-white

                      hover:bg-[#59298f]

                      dark:bg-violet-600
                      dark:text-white
                      dark:hover:bg-violet-500

                      sm:w-auto
                    "
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Adicionar emoção
                  </Button>

                </DialogTrigger>

                {/* =================================
                    MODAL ADICIONAR EMOÇÃO
                ================================= */}

                <DialogContent
                  className="
                    flex w-[calc(100%-32px)]
                    max-w-lg
                    max-h-[85dvh]
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border border-slate-200
                    bg-white p-0

                    dark:border-slate-700
                    dark:bg-[#161f32]

                    sm:w-full
                  "
                >

                  <DialogHeader className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-700">

                    <DialogTitle
                      className="
                        pr-6 text-lg
                        text-[#173575]
                        dark:text-slate-100
                      "
                    >
                      Criar emoção personalizada
                    </DialogTitle>

                    <DialogDescription
                      className="
                        text-sm leading-5
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Escolha um nome para a emoção
                      que deseja acompanhar.
                    </DialogDescription>

                  </DialogHeader>

                  <div
                    className="
                      min-h-0 space-y-5
                      overflow-y-auto
                      px-5 py-5
                    "
                  >

                    {/* NOME */}

                    <div className="space-y-2">

                      <Label
                        htmlFor="emotion-name"
                        className="
                          text-sm font-medium
                          text-[#173575]
                          dark:text-slate-200
                        "
                      >
                        Nome da emoção
                      </Label>

                      <Input
                        id="emotion-name"
                        placeholder="Ex: Criatividade, Foco..."
                        value={customEmotionName}
                        maxLength={30}
                        onChange={(event) =>
                          setCustomEmotionName(
                            event.target.value
                          )
                        }
                        className="
                          h-11 rounded-xl
                          border-slate-200
                          bg-white
                          text-slate-900

                          dark:border-slate-700
                          dark:bg-[#111827]
                          dark:text-slate-100
                        "
                      />

                      <p
                        className="
                          text-right text-xs
                          text-slate-400
                          dark:text-slate-500
                        "
                      >
                        {customEmotionName.length}/30
                        caracteres
                      </p>

                    </div>

                    {/* SUGESTÕES */}

                    <div className="space-y-3">

                      <Label
                        className="
                          text-sm font-medium
                          text-[#173575]
                          dark:text-slate-200
                        "
                      >
                        Sugestões populares
                      </Label>

                      <div className="flex flex-wrap gap-2">

                        {popularEmotions.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() =>
                              setCustomEmotionName(name)
                            }
                            className="
                              rounded-full
                              border border-slate-200
                              bg-slate-50
                              px-3 py-1.5
                              text-xs font-medium
                              text-slate-600
                              transition-colors

                              hover:border-violet-300
                              hover:bg-violet-50
                              hover:text-violet-700

                              dark:border-slate-700
                              dark:bg-slate-800
                              dark:text-slate-300

                              dark:hover:border-violet-500
                              dark:hover:bg-violet-500/20
                              dark:hover:text-violet-200
                            "
                          >
                            {name}
                          </button>
                        ))}

                      </div>

                    </div>

                    {/* ESCALA */}

                    <div className="space-y-3">

                      <div className="flex items-center justify-between gap-2">

                        <Label
                          className="
                            text-sm font-medium
                            text-[#173575]
                            dark:text-slate-200
                          "
                        >
                          Escala de avaliação
                        </Label>

                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs"
                        >
                          1 a 5
                        </Badge>

                      </div>

                      <div
                        className="
                          grid grid-cols-5
                          gap-1.5 rounded-xl
                          bg-slate-50 p-2

                          dark:bg-[#111827]

                          sm:gap-2 sm:p-3
                        "
                      >

                        {[1, 2, 3, 4, 5].map(
                          (value) => (
                            <div
                              key={value}
                              className="
                                flex min-w-0
                                flex-col
                                items-center
                                justify-center
                                gap-1.5
                                rounded-lg
                                border border-slate-200
                                bg-white
                                px-1 py-3

                                dark:border-slate-700
                                dark:bg-slate-800
                              "
                            >

                              <span className="text-xl sm:text-2xl">
                                {scaleEmojis[value]}
                              </span>

                              <span
                                className="
                                  text-xs font-semibold
                                  text-slate-600
                                  dark:text-slate-300
                                "
                              >
                                {value}
                              </span>

                            </div>
                          )
                        )}

                      </div>

                      <p
                        className="
                          text-xs leading-5
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        Você poderá avaliar sua emoção
                        diariamente utilizando esta escala.
                      </p>

                    </div>

                    {/* CRIAR */}

                    <Button
                      onClick={handleAddCustomEmotion}
                      disabled={
                        !customEmotionName.trim() ||
                        creatingEmotion
                      }
                      className="
                        h-11 w-full rounded-xl
                        bg-[#6b35ac]
                        text-white

                        hover:bg-[#59298f]

                        dark:bg-violet-600
                        dark:hover:bg-violet-500
                      "
                    >

                      {creatingEmotion ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}

                      {creatingEmotion
                        ? "Criando emoção..."
                        : "Criar emoção"}

                    </Button>

                  </div>

                </DialogContent>

              </Dialog>

            </div>

          </CardHeader>

          {/* =====================================
              LISTA DE EMOÇÕES
          ===================================== */}

          <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">

            {userConfigs.length === 0 ? (

              <div
                className="
                  flex flex-col
                  items-center justify-center
                  gap-3
                  rounded-xl
                  border border-dashed
                  border-slate-200
                  px-4 py-10
                  text-center

                  dark:border-slate-700
                "
              >

                <Heart
                  className="
                    h-8 w-8
                    text-violet-400
                  "
                />

                <p
                  className="
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Nenhuma emoção configurada.
                </p>

                <p
                  className="
                    text-xs
                    text-slate-400
                    dark:text-slate-500
                  "
                >
                  Clique em Adicionar emoção
                  para começar.
                </p>

              </div>

            ) : (

              <div
                className="
                  grid min-w-0
                  grid-cols-1 gap-3
                  xl:grid-cols-2
                "
              >

                {userConfigs.map((config) => {

                  const isProcessing =
                    processingEmotion ===
                    config.emotion_type;

                  const emoji =
                    config.emoji_set?.[
                      config.scale_min.toString()
                    ] || "💜";

                  return (
                    <div
                      key={config.id}
                      className={`
                        flex min-w-0
                        items-center gap-3
                        rounded-xl
                        border
                        p-3
                        transition-colors

                        sm:gap-4 sm:p-4

                        ${
                          config.is_enabled
                            ? `
                              border-slate-200
                              bg-white

                              dark:border-slate-700
                              dark:bg-[#1e293b]
                            `
                            : `
                              border-slate-200
                              bg-slate-50

                              dark:border-slate-800
                              dark:bg-[#111827]
                            `
                        }
                      `}
                    >

                      {/* ÍCONE */}

                      <div
                        className="
                          flex h-10 w-10
                          shrink-0
                          items-center justify-center
                          rounded-xl
                          bg-violet-50

                          dark:bg-violet-500/15
                        "
                      >
                        <span className="text-xl">
                          {emoji}
                        </span>
                      </div>

                      {/* INFORMAÇÕES */}

                      <div className="min-w-0 flex-1">

                        <p
                          className="
                            truncate
                            text-sm font-semibold
                            text-[#173575]
                            dark:text-slate-100
                          "
                          title={config.display_name}
                        >
                          {config.display_name}
                        </p>

                        <p
                          className="
                            mt-1 text-xs
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          Escala de{" "}
                          {config.scale_min} a{" "}
                          {config.scale_max}
                        </p>

                      </div>

                      {/* CONTROLES */}

                      <div
                        className="
                          flex shrink-0
                          items-center gap-2
                          sm:gap-3
                        "
                      >

                        <Switch
                          checked={config.is_enabled}
                          disabled={isProcessing}
                          onCheckedChange={() =>
                            handleToggleEmotion(
                              config.emotion_type
                            )
                          }
                          aria-label={
                            config.is_enabled
                              ? `Desativar ${config.display_name}`
                              : `Ativar ${config.display_name}`
                          }
                          className="
                            data-[state=checked]:bg-[#6b35ac]
                            dark:data-[state=checked]:bg-violet-600
                            dark:data-[state=unchecked]:bg-slate-600
                          "
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isProcessing}
                          onClick={() =>
                            handleRemoveEmotion(
                              config.emotion_type
                            )
                          }
                          aria-label={`Remover ${config.display_name}`}
                          title={`Remover ${config.display_name}`}
                          className="
                            h-9 w-9 shrink-0
                            rounded-lg
                            text-red-500

                            hover:bg-red-50
                            hover:text-red-600

                            dark:text-red-400
                            dark:hover:bg-red-500/15
                            dark:hover:text-red-300
                          "
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>

                      </div>

                    </div>
                  );
                })}

              </div>

            )}

          </CardContent>

        </Card>

      </div>
    </div>
  );
};

export default DiarioConfiguracoes;