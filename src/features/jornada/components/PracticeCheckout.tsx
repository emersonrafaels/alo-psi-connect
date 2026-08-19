import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PERCEIVED_CHANGE_OPTIONS,
  USEFULNESS_LABELS,
} from "../config/perceived-change-options";
import type { Intensity } from "../domain/types";

const VALUES: Intensity[] = [1, 2, 3, 4, 5];

/**
 * Checkout pós-prática. Nunca sugere que a pessoa deveria estar melhor:
 * apenas registra o que ela percebeu.
 */
export const PracticeCheckout = ({
  intensityBefore,
  intensityAfter,
  perceivedChangeIds,
  usefulness,
  note,
  onNoteChange,
  onIntensityAfter,
  onTogglePerceived,
  onUsefulness,
  onContinue,
}: {
  intensityBefore: Intensity;
  intensityAfter: Intensity | null;
  perceivedChangeIds: string[];
  usefulness: Intensity | null;
  note: string;
  onNoteChange: (value: string) => void;
  onIntensityAfter: (value: Intensity) => void;
  onTogglePerceived: (id: string) => void;
  onUsefulness: (value: Intensity) => void;
  onContinue: () => void;
}) => {
  const showNote = perceivedChangeIds.includes("outro");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Como está a intensidade agora?</h3>
        <p className="text-sm text-muted-foreground">
          Antes da prática você indicou {intensityBefore} de 5. Não existe resposta certa.
        </p>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Intensidade depois">
          {VALUES.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={intensityAfter === v}
              onClick={() => onIntensityAfter(v)}
              className={cn(
                "rounded-2xl border py-4 text-lg font-semibold transition-all",
                intensityAfter === v
                  ? "border-transparent bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">O que você percebeu?</h3>
        <div className="flex flex-wrap gap-2">
          {PERCEIVED_CHANGE_OPTIONS.map((option) => {
            const selected = perceivedChangeIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onTogglePerceived(option.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {showNote && (
          <Textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Quer descrever com suas palavras? (opcional)"
            className="min-h-[90px]"
          />
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Essa prática foi útil para você?</h3>
        <div className="grid gap-2 sm:grid-cols-5">
          {VALUES.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={usefulness === v}
              onClick={() => onUsefulness(v)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-xs font-medium leading-tight transition-all",
                usefulness === v
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {USEFULNESS_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" disabled={!intensityAfter} onClick={onContinue}>
        Continuar
      </Button>
    </div>
  );
};
