import { cn } from "@/lib/utils";
import type { EmotionNode } from "../domain/types";
import { shade } from "../utils/wheelColors";

/** Grade de cards de palavras (nível 2 ou 3), espelhando a seleção da Roda. */
export const EmotionLevelCards = ({
  nodes,
  selectedId,
  levelLabel,
  familyLabel,
  color,
  onSelect,
}: {
  nodes: EmotionNode[];
  selectedId: string | null;
  levelLabel: string;
  familyLabel?: string;
  color?: string;
  onSelect: (emotionId: string) => void;
}) => {
  const accent = color ? shade(color, -18, 10) : undefined;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => {
        const selected = selectedId === node.id;
        return (
          <button
            key={node.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(node.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-card p-4 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selected
                ? "shadow-md"
                : "border-border hover:-translate-y-0.5 hover:shadow-sm"
            )}
            style={
              selected && accent
                ? { borderColor: accent, backgroundColor: `${accent}1f` }
                : undefined
            }
          >
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: accent, opacity: selected ? 1 : 0.55 }}
              />
              {familyLabel ? `${familyLabel} · ${levelLabel}` : levelLabel}
            </span>
            <span className="mt-1.5 block text-base font-semibold text-foreground">
              {node.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/** Barra de confirmação abaixo das grades. */
export const EmotionConfirmBar = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-0.5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);
