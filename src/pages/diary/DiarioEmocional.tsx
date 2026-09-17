import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useMoodEntries } from "@/hooks/useMoodEntries";
import { useEmotionConfig } from "@/hooks/useEmotionConfig";
import { useTenant } from "@/hooks/useTenant";

import { buildTenantPath } from "@/utils/tenantHelpers";
import { getTodayLocalDateString } from "@/lib/utils";

import { Plus, CalendarDays, Heart } from "lucide-react";
import DataLoadError from "@/components/system/DataLoadError";

const DiarioEmocional = () => {
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();

  const {
    entries,
    loading: entriesLoading,
    isError: entriesError,
    refetch: refetchEntries,
  } = useMoodEntries();

  const {
    activeConfigs,
  } = useEmotionConfig();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(
        buildTenantPath(
          tenant?.slug || "alopsi",
          "/diario-emocional/experiencia"
        )
      );
    }
  }, [user, authLoading, navigate, tenant]);

  if (authLoading || entriesLoading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Carregando diário emocional...
      </div>
    );
  }

  if (entriesError) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16">
        <DataLoadError
          title="Não conseguimos carregar seu diário agora"
          description="O serviço de dados está instável neste momento. Seus registros estão salvos; tente novamente em alguns instantes."
          onRetry={() => refetchEntries()}
        />
      </div>
    );
  }

  const today = getTodayLocalDateString();

  const todayEntry = entries.find(
    (entry) => entry.date === today
  );

  const recentEntries = entries.slice(0, 7);

  return (
    <div className="min-h-screen bg-[#f8f9fd]">
      <div className="mx-auto max-w-6xl px-8 py-10">

        {/* Cabeçalho */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-[#7667c9]">
            Seu espaço de acompanhamento
          </p>

          <h1 className="text-3xl font-bold text-[#173575]">
            Diário Emocional
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Registre como você está se sentindo e acompanhe sua evolução
            emocional ao longo do tempo.
          </p>
        </div>

        {/* Resumo */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1eeff]">
                <CalendarDays className="h-5 w-5 text-[#7667c9]" />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Total de entradas
            </p>

            <p className="mt-1 text-2xl font-bold text-[#173575]">
              {entries.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef8f7]">
                <Heart className="h-5 w-5 text-[#41938d]" />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Esta semana
            </p>

            <p className="mt-1 text-2xl font-bold text-[#173575]">
              {recentEntries.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3e7]">
                <Heart className="h-5 w-5 text-[#db8c43]" />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Emoções acompanhadas
            </p>

            <p className="mt-1 text-2xl font-bold text-[#173575]">
              {activeConfigs.length}
            </p>
          </div>

        </div>

        {/* Entrada de hoje */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>
              <p className="text-sm font-medium text-[#7667c9]">
                Registro de hoje
              </p>

              <h2 className="mt-1 text-xl font-semibold text-[#173575]">
                Como você está se sentindo hoje?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {todayEntry
                  ? "Você já fez seu registro de hoje."
                  : "Reserve alguns minutos para registrar como foi o seu dia."}
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
  "/diario-emocional-v2/novo-registro"
)
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#173575]
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#10295f]
              "
            >
              <Plus className="h-4 w-4" />

              {todayEntry
                ? "Novo registro"
                : "Registrar agora"}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DiarioEmocional;