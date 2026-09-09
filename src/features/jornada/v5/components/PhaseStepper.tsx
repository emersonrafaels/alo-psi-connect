import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { V5_COPY } from "../copy";
import { phaseIndex } from "../reducer";
import type { V5Phase } from "../types";

/** Stepper das 5 fases, com rótulo e subtítulo por fase. */
export const PhaseStepper = ({
  phase,
  maxReached,
  onGoTo,
}: {
  phase: V5Phase;
  maxReached: V5Phase;
  onGoTo: (phase: V5Phase) => void;
}) => {
  const current = phaseIndex(phase);
  const reached = phaseIndex(maxReached);

  return (
    <nav
      aria-label="Fases da jornada"
      className="rounded-3xl border border-border/70 bg-card/80 p-2 shadow-sm backdrop-blur-sm"
    >
      <ol className="grid gap-1 sm:grid-cols-5">
        {V5_COPY.phases.map((item, index) => {
          const isActive = index === current;
          const isDone = index < current;
          const enabled = index <= reached;
          return (
            <li key={item.key}>
              <button
                type="button"
                disabled={!enabled}
                aria-current={isActive ? "step" : undefined}
                onClick={() => onGoTo(item.key as V5Phase)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  enabled ? "cursor-pointer" : "cursor-default opacity-60",
                  isActive ? "bg-primary/10" : enabled ? "hover:bg-accent/50" : ""
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isActive
                      ? "border-transparent bg-primary text-primary-foreground"
                      : isDone
                        ? "border-transparent bg-primary/15 text-primary"
                        : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      isActive ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
