import { ArrowRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEmotionNode, getEmotionPath, getFamilyOf } from "../../config/emotion-taxonomy";
import { INTENSITY_LABELS } from "../../config/perceived-change-options";
import { EmotionSearch } from "../../components/EmotionSearch";
import { V5_COPY } from "../copy";
import { MAX_EMOTIONS, type PickedEmotion } from "../types";

/** Painel lateral da fase Perceber: registro em construção das emoções escolhidas. */
export const PerceiveSidebar = ({
  emotions,
  onPick,
  onRemove,
  onClear,
  onAdvance,
  onAddAnother,
}: {
  emotions: PickedEmotion[];
  onPick: (emotionId: string) => void;
  onRemove: (emotionId: string) => void;
  onClear: () => void;
  onAdvance?: () => void;
  onAddAnother?: () => void;
}) => {
  const full = emotions.length >= MAX_EMOTIONS;

  return (
    <Card className="self-start overflow-hidden border-primary/15 shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            1 · {V5_COPY.perceive.sidebarEyebrow}
          </p>
          <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {V5_COPY.perceive.sidebarTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{V5_COPY.perceive.sidebarDescription}</p>
        </div>

        <EmotionSearch onPick={onPick} />


        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {V5_COPY.perceive.recordLabel}
          </p>
          {emotions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-primary/25 bg-background p-4 text-sm leading-relaxed text-muted-foreground">
              {V5_COPY.perceive.emptyRecord}
            </p>
          ) : (
            <ul className="space-y-2">
              {emotions.map((item) => {
                const node = getEmotionNode(item.emotionId);
                const family = getFamilyOf(item.emotionId);
                return (
                  <li
                    key={item.emotionId}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3"
                  >
                    <span
                      aria-hidden
                      className="h-8 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: family?.color ?? "hsl(var(--primary))" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {node?.label ?? item.emotionId}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {getEmotionPath(item.emotionId).map((part) => part.label).join(" › ")}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {item.intensityBefore} · {INTENSITY_LABELS[item.intensityBefore]}
                        {item.intensityAfter != null && ` → ${item.intensityAfter} após a pausa`}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      aria-label={`Remover ${node?.label ?? "emoção"}`}
                      onClick={() => onRemove(item.emotionId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!full && onAddAnother && (
          <Button className="w-full" onClick={onAddAnother}>
            <Plus className="mr-2 h-4 w-4" />
            {V5_COPY.perceive.exploreAnother}
          </Button>
        )}

        {emotions.length > 0 && onAdvance && (
          <Button className="w-full" onClick={onAdvance}>
            Avançar para a compreensão
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {emotions.length > 0 && (
          <Button variant="link" className="h-auto w-full p-0 text-sm font-semibold" onClick={onClear}>
            {V5_COPY.perceive.restart}
          </Button>
        )}

        <p className="border-t border-border/70 pt-5 text-xs leading-relaxed text-muted-foreground">
          {V5_COPY.perceive.limitNote}
        </p>
      </CardContent>
    </Card>
  );
};
