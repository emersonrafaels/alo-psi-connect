import { useMemo } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PracticeProtocol } from "../../domain/types";
import { formatClock, usePracticeTimer } from "./usePracticeTimer";

/**
 * Player por etapas — atende grounding e práticas de consciência.
 * As etapas e os segundos vêm do protocolo curatorial, escalados para a duração escolhida.
 */
export const StepPlayer = ({
  protocol,
  durationMinutes,
  silentMode,
  onComplete,
  variant = "grounding",
}: {
  protocol: PracticeProtocol;
  durationMinutes: number;
  silentMode: boolean;
  onComplete: () => void;
  variant?: "grounding" | "awareness";
}) => {
  const steps = protocol.steps ?? [];
  const baseTotal = steps.reduce((sum, s) => sum + s.seconds, 0) || 1;
  const totalSeconds = durationMinutes * 60;
  const factor = totalSeconds / baseTotal;

  const scaled = useMemo(
    () => steps.map((s) => ({ ...s, seconds: Math.max(Math.round(s.seconds * factor), 5) })),
    [steps, factor]
  );

  const scaledTotal = scaled.reduce((sum, s) => sum + s.seconds, 0);
  const { elapsed, remaining, running, progress, toggle } = usePracticeTimer(
    scaledTotal,
    onComplete
  );

  const { index, stepElapsed } = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < scaled.length; i++) {
      if (elapsed < acc + scaled[i].seconds) return { index: i, stepElapsed: elapsed - acc };
      acc += scaled[i].seconds;
    }
    return { index: Math.max(scaled.length - 1, 0), stepElapsed: 0 };
  }, [elapsed, scaled]);

  const current = scaled[index];
  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-1.5" aria-hidden>
        {scaled.map((s, i) => (
          <span
            key={s.title}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i < index ? "w-6 bg-primary" : i === index ? "w-10 bg-primary" : "w-6 bg-secondary"
            )}
          />
        ))}
      </div>

      <div
        className={cn(
          "w-full max-w-md rounded-3xl border border-border p-8 text-center",
          variant === "grounding" ? "bg-accent/30" : "bg-card"
        )}
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Etapa {index + 1} de {scaled.length}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">{current.title}</h3>
        {!silentMode && (
          <p className="mt-3 text-base text-muted-foreground">{current.instruction}</p>
        )}
        <p className="mt-5 text-3xl font-semibold tabular-nums text-primary">
          {formatClock(Math.max(current.seconds - stepElapsed, 0))}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground">
          {formatClock(remaining)} restantes
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={toggle}>
          {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {running ? "Pausar" : "Continuar"}
        </Button>
        <Button variant="ghost" onClick={onComplete}>
          <SkipForward className="mr-2 h-4 w-4" /> Encerrar
        </Button>
      </div>
    </div>
  );
};
