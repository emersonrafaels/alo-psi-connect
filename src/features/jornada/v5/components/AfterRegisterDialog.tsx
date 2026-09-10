import { ChevronRight, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEmotionNode, getEmotionPath, getFamilyOf } from "../../config/emotion-taxonomy";
import { INTENSITY_LABELS } from "../../config/perceived-change-options";
import { MAX_EMOTIONS, type PickedEmotion } from "../types";

/**
 * Modal exibido após registrar a intensidade: perguntar se a pessoa quer
 * registrar mais uma emoção ou avançar para a etapa de compreensão.
 */
export const AfterRegisterDialog = ({
  open,
  emotions,
  onAnother,
  onAdvance,
}: {
  open: boolean;
  emotions: PickedEmotion[];
  onAnother: () => void;
  onAdvance: () => void;
}) => {
  const full = emotions.length >= MAX_EMOTIONS;
  const last = emotions[emotions.length - 1];
  const node = last ? getEmotionNode(last.emotionId) : null;
  const family = last ? getFamilyOf(last.emotionId) : null;
  const path = last ? getEmotionPath(last.emotionId) : [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onAdvance()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="text-xl sm:text-2xl">
            {last
              ? `“${node?.label ?? "Emoção"}” registrada`
              : "Emoção registrada"}
          </DialogTitle>
          <DialogDescription>
            {full
              ? "Você já registrou três emoções neste momento. Você pode avançar para a etapa de compreensão."
              : "O que você gostaria de fazer agora?"}
          </DialogDescription>
        </DialogHeader>

        {last && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
            <nav
              aria-label="Caminho da emoção selecionada"
              className="flex flex-wrap items-center gap-1 text-xs"
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
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-8 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: family?.color ?? "hsl(var(--primary))" }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {node?.label ?? last.emotionId}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Intensidade {last.intensityBefore} · {INTENSITY_LABELS[last.intensityBefore]}
                </span>
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!full && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onAnother}
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar outra emoção
            </Button>
          )}
          <Button className="w-full" onClick={onAdvance}>
            Avançar para a compreensão
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
