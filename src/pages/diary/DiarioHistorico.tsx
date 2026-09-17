import { useState } from "react";

import { useMoodEntries } from "@/hooks/useMoodEntries";
import { useEmotionConfig } from "@/hooks/useEmotionConfig";
import {
  useMoodEntryAnalyses,
} from "@/hooks/useMoodEntryAnalyses";

import { parseISODateLocal } from "@/lib/utils";
import { getAllEmotions } from "@/utils/emotionFormatters";

import { MoodEntryDetailModal } from "@/components/mood/MoodEntryDetailModal";

import type { MoodEntry } from "@/hooks/useMoodEntries";

const DiarioHistorico = () => {
  const { entries, loading } = useMoodEntries();
  const { userConfigs } = useEmotionConfig();

  const [selectedEntry, setSelectedEntry] =
    useState<MoodEntry | null>(null);

  const entryIds = entries.map((entry) => entry.id);

  const { data: analysesMap } =
    useMoodEntryAnalyses(entryIds);

  if (loading) {
    return (
      <div className="px-8 py-8 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm text-slate-500">
            Carregando histórico...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-8 py-8 lg:px-10">
        <div className="mx-auto max-w-[1400px]">

          {/* Cabeçalho */}
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-[#7667c9]">
              Seus registros
            </p>

            <h1 className="text-3xl font-bold text-[#173575]">
              Histórico
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Acompanhe seus registros emocionais ao longo do tempo.
            </p>
          </div>

          {/* Sem registros */}
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                Você ainda não possui registros no diário emocional.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {entries.map((entry) => {
                const emotions = getAllEmotions(
                  entry,
                  userConfigs
                );

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      text-left
                      transition-all
                      hover:-translate-y-[1px]
                      hover:border-[#cfc7f7]
                      hover:shadow-md
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#7667c9]/30
                    "
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                      {/* Informações principais */}
                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-semibold capitalize text-[#173575]">
                          {parseISODateLocal(
                            entry.date
                          ).toLocaleDateString(
                            "pt-BR",
                            {
                              weekday: "long",
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>

                        {entry.journal_text && (
                          <p className="mt-2 max-w-3xl overflow-hidden text-ellipsis text-sm leading-6 text-slate-500">
                            {entry.journal_text.length > 180
                              ? `${entry.journal_text.substring(
                                  0,
                                  180
                                )}...`
                              : entry.journal_text}
                          </p>
                        )}

                      </div>

                      {/* Emoções */}
                      <div className="flex flex-wrap gap-2 lg:max-w-[420px] lg:justify-end">

  {emotions.slice(0, 4).map((emotion) => (
    <div
      key={emotion.key}
      className="
        rounded-full
        bg-[#f4f1ff]
        px-3
        py-1.5
        text-xs
        font-medium
        text-[#5f54a5]
      "
    >
      {emotion.name}: {Math.round(emotion.value)}/5
    </div>
  ))}

  {emotions.length > 4 && (
    <div
      className="
        rounded-full
        bg-slate-100
        px-3
        py-1.5
        text-xs
        font-medium
        text-slate-500
      "
    >
      +{emotions.length - 4}
    </div>
  )}

</div>
                    </div>
                  </button>
                );
              })}

            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhe */}
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