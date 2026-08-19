import { cn } from "@/lib/utils";
import type { EmotionNode } from "../domain/types";

/** Grade de cards de palavras (nível 2 ou 3), espelhando a seleção da Roda. */
export const EmotionLevelCards = ({
  nodes,
  selectedId,
  levelLabel,
  color,
  onSelect,
}: {
  nodes: EmotionNode[];
  selectedId: string | null;
  levelLabel: string;
  color?: string;
  onSelect: (emotionId: string) => void;
}) => (
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
              ? "border-primary shadow-md ring-1 ring-primary/40"
              : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
          )}
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 transition-opacity"
            style={{ backgroundColor: color, opacity: selected ? 1 : 0.25 }}
          />
          <span className="block pl-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {levelLabel}
          </span>
          <span className="mt-1 block pl-1 text-base font-semibold text-foreground">
            {node.label}
          </span>
        </button>
      );
    })}
  </div>
);

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
