
import { useState } from "react";

import {
  CalendarDays,
  ChevronRight,
  History,
  Heart,
} from "lucide-react";

import {
  useMoodEntries,
  type MoodEntry,
} from "@/hooks/useMoodEntries";

import { useEmotionConfig } from "@/hooks/useEmotionConfig";

import { useMoodEntryAnalyses } from "@/hooks/useMoodEntryAnalyses";

import { parseISODateLocal } from "@/lib/utils";

import { getAllEmotions } from "@/utils/emotionFormatters";

import { MoodEntryDetailModal } from "@/components/mood/MoodEntryDetailModal";

/* =========================================
   COMPONENTE
========================================= */

const DiarioHistorico = () => {
  const { entries, loading } = useMoodEntries();

  const { userConfigs } = useEmotionConfig();

  const [selectedEntry, setSelectedEntry] =
    useState<MoodEntry | null>(null);

  const entryIds = entries.map((entry) => entry.id);

  const { data: analysesMap } =
    useMoodEntryAnalyses(entryIds);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#7667c9] border-t-transparent dark:border-violet-400 dark:border-t-transparent" />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Carregando histórico...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================
     INTERFACE
  ========================================= */

  return (
    <>
      <div
        className="
          w-full min-w-0
          px-4 py-6
          sm:px-6
          md:px-8 md:py-8
          lg:px-10
        "
      >
        <div className="mx-auto w-full min-w-0 max-w-[1400px]">

          {/* =====================================
              CABEÇALHO
          ===================================== */}

          <header className="mb-6 sm:mb-8">

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#7667c9] dark:text-violet-300">
              Seus registros
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173575] dark:text-slate-100 sm:text-3xl">
              Histórico
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Acompanhe seus registros emocionais ao longo do tempo.
            </p>

            {/* Total de registros */}

            {entries.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-[#161f32] dark:text-slate-300">

                <History className="h-3.5 w-3.5 text-[#7667c9] dark:text-violet-300" />

                {entries.length}{" "}
                {entries.length === 1
                  ? "registro realizado"
                  : "registros realizados"}

              </div>
            )}

          </header>

          {/* =====================================
              ESTADO VAZIO
          ===================================== */}

          {entries.length === 0 ? (

            <div
              className="
                flex min-h-[250px]
                flex-col items-center
                justify-center
                rounded-2xl border
                border-slate-200
                bg-white p-6
                text-center

                dark:border-slate-700
                dark:bg-[#161f32]
              "
            >

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-500/15">

                <Heart className="h-7 w-7 text-[#7667c9] dark:text-violet-300" />

              </div>

              <h2 className="mt-4 text-base font-semibold text-[#173575] dark:text-slate-100">
                Nenhum registro encontrado
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Seus registros emocionais aparecerão aqui depois que você fizer sua primeira entrada.
              </p>

            </div>

          ) : (

            /* =====================================
                LISTA DE REGISTROS
            ===================================== */

            <div className="grid grid-cols-1 gap-3 sm:gap-4">

              {entries.map((entry) => {

                const emotions = getAllEmotions(
                  entry,
                  userConfigs
                );

                const visibleEmotions = emotions.slice(0, 4);

                const remainingEmotions = Math.max(
                  emotions.length - 4,
                  0
                );

                const entryDate = parseISODateLocal(
                  entry.date
                );

                const formattedDate =
                  entryDate.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });

                const formattedWeekday =
                  entryDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                  });

                return (

                  /* =================================
                      CARD CLICÁVEL
                  ================================= */

                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    aria-label={`Visualizar registro de ${formattedDate}`}
                    className="
                      group
                      w-full min-w-0
                      overflow-hidden
                      rounded-2xl

                      border border-slate-200
                      bg-white

                      p-4 text-left
                      shadow-sm

                      transition-all duration-200

                      hover:-translate-y-[1px]
                      hover:border-violet-300
                      hover:shadow-md

                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-violet-400
                      focus-visible:ring-offset-2

                      dark:border-slate-700
                      dark:bg-[#161f32]
                      dark:hover:border-violet-500/60
                      dark:focus-visible:ring-violet-400
                      dark:focus-visible:ring-offset-[#0b1020]

                      sm:p-5
                    "
                  >

                    {/* =================================
                        DATA E INDICADOR
                    ================================= */}

                    <div className="flex min-w-0 items-center gap-3">

                      {/* Ícone da data */}

                      <div
                        className="
                          flex h-10 w-10
                          shrink-0
                          items-center justify-center
                          rounded-xl

                          bg-[#f1eeff]
                          text-[#7667c9]

                          dark:bg-violet-500/15
                          dark:text-violet-300
                        "
                      >
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      {/* Informações da data */}

                      <div className="min-w-0 flex-1">

                        <p
                          className="
                            text-sm font-semibold
                            leading-5

                            text-[#173575]
                            dark:text-slate-100

                            sm:text-base
                          "
                        >
                          {formattedDate}
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-xs capitalize
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {formattedWeekday}
                        </p>

                      </div>

                      {/* Seta indicativa */}

                      <ChevronRight
                        className="
                          h-5 w-5 shrink-0

                          text-slate-400
                          dark:text-slate-500

                          transition-transform
                          duration-200

                          group-hover:translate-x-1
                          group-hover:text-[#7667c9]

                          dark:group-hover:text-violet-300
                        "
                      />

                    </div>

                    {/* =================================
                        TEXTO DO REGISTRO
                    ================================= */}

                    {entry.journal_text && (

                      <div
                        className="
                          mt-4 min-w-0
                          rounded-xl

                          bg-slate-50
                          px-3 py-3

                          dark:bg-[#111827]
                        "
                      >

                        <p
                          className="
                            break-words
                            text-sm leading-6

                            text-slate-600
                            dark:text-slate-300
                          "
                        >
                          {entry.journal_text.length > 180
                            ? `${entry.journal_text.substring(0, 180)}...`
                            : entry.journal_text}
                        </p>

                      </div>

                    )}

                    {/* =================================
                        DIVISÓRIA
                    ================================= */}

                    <div className="my-4 border-t border-slate-100 dark:border-slate-700/70" />

                    {/* =================================
                        EMOÇÕES REGISTRADAS
                    ================================= */}

                    {emotions.length > 0 ? (

                      <div className="min-w-0">

                        {/* Grid responsivo */}

                        <div
                          className="
                            grid min-w-0
                            grid-cols-2 gap-2

                            md:grid-cols-4
                          "
                        >

                          {visibleEmotions.map((emotion) => (

                            <div
                              key={emotion.key}
                              className="
                                flex min-w-0
                                items-center
                                justify-between
                                gap-2

                                rounded-lg

                                bg-[#f4f1ff]
                                px-3 py-2

                                dark:bg-violet-500/15
                              "
                            >

                              <span
                                className="
                                  min-w-0
                                  truncate

                                  text-xs font-medium

                                  text-[#5f54a5]
                                  dark:text-violet-200
                                "
                                title={emotion.name}
                              >
                                {emotion.name}
                              </span>

                              <span
                                className="
                                  shrink-0
                                  text-xs font-semibold

                                  text-[#5f54a5]
                                  dark:text-violet-100
                                "
                              >
                                {Math.round(emotion.value)}/5
                              </span>

                            </div>

                          ))}

                        </div>

                        {/* Emoções adicionais */}

                        {remainingEmotions > 0 && (

                          <div className="mt-3 flex items-center justify-between gap-2">

                            <span
                              className="
                                text-xs font-medium
                                text-[#7667c9]
                                dark:text-violet-300
                              "
                            >
                              +{remainingEmotions}{" "}
                              {remainingEmotions === 1
                                ? "emoção adicional"
                                : "emoções adicionais"}
                            </span>

                            <span
                              className="
                                text-xs
                                text-slate-400
                                dark:text-slate-500
                              "
                            >
                              Ver detalhes
                            </span>

                          </div>

                        )}

                      </div>

                    ) : (

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Nenhuma emoção registrada nesta entrada.
                      </p>

                    )}

                  </button>

                );
              })}

            </div>

          )}

        </div>
      </div>

      {/* =====================================
          MODAL DE DETALHES
      ===================================== */}

      <MoodEntryDetailModal
        entry={selectedEntry}
        analysis={
          selectedEntry
            ? analysesMap?.get(selectedEntry.id) ?? null
            : null
        }
        open={!!selectedEntry}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(null);
          }
        }}
        userConfigs={userConfigs}
      />

    </>
  );
};

export default DiarioHistorico;