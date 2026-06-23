import { useEffect, useRef, useState } from "react";

interface Props {
  paused?: boolean;
  largeLabels?: boolean;
  /** Notifica quando uma etapa começa (para tocar sino, etc.). */
  onEtapaChange?: (index: number) => void;
}

const ETAPAS = [
  {
    titulo: "Perceber",
    descricao: "Observe pensamentos, emoções e sensações como elas estão agora.",
  },
  {
    titulo: "Respirar",
    descricao: "Leve a atenção à respiração. Acompanhe inspirar e expirar.",
  },
  {
    titulo: "Ampliar",
    descricao: "Expanda a consciência para o corpo inteiro e ao redor.",
  },
];

const DURACAO_ETAPA = 60; // segundos

export const PausaTresMinutosSessao = ({ paused = false, largeLabels = false, onEtapaChange }: Props) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  const etapaIdx = Math.min(2, Math.floor(elapsed / DURACAO_ETAPA));
  const restanteEtapa = DURACAO_ETAPA - (elapsed % DURACAO_ETAPA);
  const etapa = ETAPAS[etapaIdx];

  useEffect(() => {
    onEtapaChange?.(etapaIdx);
  }, [etapaIdx, onEtapaChange]);

  const titleClass = largeLabels
    ? "font-serif text-5xl sm:text-7xl tracking-wide font-semibold drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]"
    : "font-serif text-3xl sm:text-5xl tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]";

  return (
    <div className="flex flex-col items-center text-center px-6" style={{ minHeight: "min(22rem, 42vh)" }}>
      <div className="flex items-center gap-2 mb-6">
        {ETAPAS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-12 rounded-full transition-all ${
              i < etapaIdx
                ? "bg-primary-foreground/90"
                : i === etapaIdx
                  ? "bg-primary-foreground/70"
                  : "bg-primary-foreground/20"
            }`}
          />
        ))}
      </div>
      <p className="uppercase tracking-[0.25em] text-xs sm:text-sm opacity-80 mb-3">
        Etapa {etapaIdx + 1} de 3
      </p>
      <h2 className={titleClass}>{etapa.titulo}</h2>
      <p className="mt-4 max-w-md text-sm sm:text-base opacity-90">{etapa.descricao}</p>
      <p className="mt-8 text-3xl sm:text-4xl font-semibold tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
        0:{String(restanteEtapa).padStart(2, "0")}
      </p>
    </div>
  );
};
