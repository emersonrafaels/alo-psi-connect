import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { getEmotionNode, getEmotionPath, getFamilyOf } from "../../config/emotion-taxonomy";
import { INTENSITY_LABELS } from "../../config/perceived-change-options";
import type { Intensity } from "../../domain/types";

const VALUES: Intensity[] = [1, 2, 3, 4, 5];

/** Janela de intensidade aberta ao escolher uma palavra na roda das emoções. */
export const IntensityDialog = ({
  emotionId,
  full,
  historyNote,
  onConfirm,
  onCancel,
}: {
  emotionId: string | null;
  full: boolean;
  historyNote?: string | null;
  onConfirm: (intensity: Intensity) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState<Intensity | null>(null);
  const node = getEmotionNode(emotionId);
  const family = getFamilyOf(emotionId);
  const path = getEmotionPath(emotionId);
  const open = !!node;

  useEffect(() => {
    setValue(null);
  }, [emotionId]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3 text-left">
          <Badge
            variant="secondary"
            className="w-fit rounded-full text-[11px] font-semibold uppercase tracking-wide"
          >
            <span
              aria-hidden
              className="mr-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: family?.color ?? "hsl(var(--primary))" }}
            />
            Intensidade
          </Badge>
          <DialogTitle className="text-xl sm:text-2xl">
            Quanto “{node?.label ?? "essa emoção"}” está presente agora?
          </DialogTitle>
          <DialogDescription>
            A intensidade é registrada separadamente da posição da palavra na roda.
          </DialogDescription>
        </DialogHeader>

        {path.length > 0 && (
          <nav
            aria-label="Caminho da emoção selecionada"
            className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/70 bg-muted/30 p-3 text-xs"
          >
            {path.map((item, i) => (
              <span key={item.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <span
                  className={
                    i === path.length - 1
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
              </span>
            ))}
          </nav>
        )}

        {full ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Você já registrou três emoções neste momento. Remova uma no painel ao lado para incluir
            esta.
          </p>
        ) : (
          <div className="space-y-2">
            <div
              className="grid grid-cols-5 gap-2"
              role="radiogroup"
              aria-label="Escala de intensidade de 1 a 5"
            >
              {VALUES.map((item) => {
                const selected = value === item;
                return (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${item} — ${INTENSITY_LABELS[item]}`}
                    onClick={() => setValue(item)}
                    className={cn(
                      "rounded-2xl border py-4 text-lg font-semibold transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected
                        ? "border-transparent text-primary-foreground shadow-md"
                        : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40"
                    )}
                    style={
                      selected
                        ? {
                            backgroundColor: family?.color ?? "hsl(var(--primary))",
                            color: "hsl(var(--background))",
                          }
                        : undefined
                    }
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{INTENSITY_LABELS[1]}</span>
              <span>{INTENSITY_LABELS[5]}</span>
            </div>
          </div>
        )}

        {historyNote && !full && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Sparkles aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {historyNote}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          {!full && (
            <Button disabled={!value} onClick={() => value && onConfirm(value)}>
              Registrar emoção
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
