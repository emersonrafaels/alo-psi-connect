import { useMemo } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticeProtocol } from "../../domain/types";
import { formatClock, usePracticeTimer } from "./usePracticeTimer";

/** Player de respiração guiada: círculo animado no ritmo real do protocolo. */
export const BreathingPlayer = ({
  protocol,
  durationMinutes,
  silentMode,
  onComplete,
}: {
  protocol: PracticeProtocol;
  durationMinutes: number;
  silentMode: boolean;
  onComplete: () => void;
}) => {
  const totalSeconds = durationMinutes * 60;
  const { elapsed, remaining, running, progress, toggle } = usePracticeTimer(
    totalSeconds,
    onComplete
  );

  const cycleSeconds = useMemo(
    () => protocol.phases.reduce((sum, p) => sum + p.seconds, 0),
    [protocol.phases]
  );

  const { phase, phaseElapsed, cycleIndex } = useMemo(() => {
    if (!cycleSeconds) {
      return { phase: protocol.phases[0], phaseElapsed: 0, cycleIndex: 0 };
    }
    const within = elapsed % cycleSeconds;
    let acc = 0;
    for (const p of protocol.phases) {
      if (within < acc + p.seconds) {
        return {
          phase: p,
          phaseElapsed: within - acc,
          cycleIndex: Math.floor(elapsed / cycleSeconds),
        };
      }
      acc += p.seconds;
    }
    return { phase: protocol.phases[0], phaseElapsed: 0, cycleIndex: 0 };
  }, [elapsed, cycleSeconds, protocol.phases]);

  const phaseProgress = phase ? phaseElapsed / phase.seconds : 0;
  const scale =
    phase?.key === "inhale"
      ? 0.65 + phaseProgress * 0.35
      : phase?.key === "exhale"
        ? 1 - phaseProgress * 0.35
        : phase?.key === "hold"
          ? 1
          : 0.65;

  return (
    <div className="flex min-h-[430px] flex-col items-center justify-center gap-7 py-4 sm:min-h-[500px]">
      <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
        <div
          className="absolute h-56 w-56 rounded-full border border-primary/15 bg-primary/10 transition-transform duration-1000 ease-linear sm:h-64 sm:w-64"
          style={{ transform: `scale(${scale})` }}
          aria-hidden
        />
        <div
          className="absolute h-40 w-40 rounded-full bg-primary/30 shadow-[var(--shadow-glow)] transition-transform duration-1000 ease-linear sm:h-44 sm:w-44"
          style={{ transform: `scale(${scale})` }}
          aria-hidden
        />
        <div className="relative z-10 text-center" aria-live="polite">
          <p className="text-2xl font-semibold text-foreground sm:text-3xl">{phase?.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {Math.max(Math.ceil((phase?.seconds ?? 0) - phaseElapsed), 0)}s
          </p>
        </div>
      </div>

      {!silentMode && phase?.hint && (
        <p className="max-w-sm text-center text-sm leading-relaxed text-muted-foreground">{phase.hint}</p>
      )}

      <div className="w-full max-w-sm space-y-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Ciclo {cycleIndex + 1}</span>
          <span>{formatClock(remaining)} restantes</span>
        </div>
      </div>

      <Button onClick={toggle} className="min-w-32">
        {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
        {running ? "Pausar" : "Continuar"}
      </Button>
    </div>
  );
};
