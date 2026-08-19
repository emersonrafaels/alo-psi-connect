import { cn } from "@/lib/utils";
import { INTENSITY_LABELS } from "../config/perceived-change-options";
import type { Intensity } from "../domain/types";

const VALUES: Intensity[] = [1, 2, 3, 4, 5];

export const IntensityScale = ({
  value,
  onChange,
  color,
  label = "Quanto essa emoção está presente agora?",
}: {
  value: Intensity | null;
  onChange: (value: Intensity) => void;
  color?: string;
  label?: string;
}) => (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div
      className="grid grid-cols-5 gap-2"
      role="radiogroup"
      aria-label="Escala de intensidade de 1 a 5"
    >
      {VALUES.map((v) => {
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl border px-2 py-4 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selected
                ? "border-transparent bg-primary text-primary-foreground shadow-md"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40"
            )}
            style={selected && color ? { backgroundColor: color, color: "hsl(var(--background))" } : undefined}
          >
            <span className="text-lg font-semibold">{v}</span>
            <span className="text-[11px] leading-tight opacity-90">{INTENSITY_LABELS[v]}</span>
          </button>
        );
      })}
    </div>
    <p className="text-xs text-muted-foreground">
      A intensidade indica apenas o quanto essa emoção está presente agora. Não é diagnóstico
      nem classificação de risco.
    </p>
  </div>
);
