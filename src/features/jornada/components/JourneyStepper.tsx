import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface JourneyStep {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
  enabled: boolean;
}

/** Stepper horizontal da jornada em tela única. */
export const JourneyStepper = ({
  steps,
  onGoTo,
  onReset,
}: {
  steps: JourneyStep[];
  onGoTo: (key: string) => void;
  onReset: () => void;
}) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center gap-3">
          <button
            type="button"
            disabled={!step.enabled}
            onClick={() => onGoTo(step.key)}
            aria-current={step.active ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full px-1 text-sm transition-colors",
              step.enabled ? "cursor-pointer" : "cursor-default",
              step.active
                ? "font-semibold text-foreground"
                : step.done
                  ? "text-foreground/80 hover:text-foreground"
                  : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                step.active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : step.done
                    ? "border-transparent bg-primary/15 text-primary"
                    : "border-border bg-background text-muted-foreground"
              )}
            >
              {step.done && !step.active ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className="whitespace-nowrap">{step.label}</span>
          </button>
          {index < steps.length - 1 && (
            <span aria-hidden className="hidden h-px w-6 bg-border sm:block" />
          )}
        </li>
      ))}
    </ol>

    <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={onReset}>
      <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reiniciar fluxo
    </Button>
  </div>
);
