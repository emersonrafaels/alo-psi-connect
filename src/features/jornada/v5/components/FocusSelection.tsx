import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getEmotionNode, getFamilyOf } from "../../config/emotion-taxonomy";
import { INTENSITY_LABELS } from "../../config/perceived-change-options";
import { V5_COPY } from "../copy";
import type { FocusMode, PickedEmotion } from "../types";

/** Escolha do foco da reflexão: uma emoção ou o momento como conjunto. */
export const FocusSelection = ({
  emotions,
  mode,
  emotionId,
  onSelect,
  onBack,
  onNext,
}: {
  emotions: PickedEmotion[];
  mode: FocusMode;
  emotionId: string | null;
  onSelect: (mode: "single" | "whole", emotionId?: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="space-y-6 p-5 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {V5_COPY.focus.eyebrow}
        </p>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{V5_COPY.focus.title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{V5_COPY.focus.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {emotions.map((item) => {
          const node = getEmotionNode(item.emotionId);
          const family = getFamilyOf(item.emotionId);
          const selected = mode === "single" && emotionId === item.emotionId;
          return (
            <button
              key={item.emotionId}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect("single", item.emotionId)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                selected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: family?.color ?? "hsl(var(--primary))" }}
                />
                <span className="text-base font-semibold text-foreground">
                  {node?.label ?? item.emotionId}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Intensidade {item.intensityAfter ?? item.intensityBefore} ·{" "}
                {INTENSITY_LABELS[item.intensityAfter ?? item.intensityBefore]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground">{V5_COPY.focus.alternative}</p>
        <Button
          variant={mode === "whole" ? "default" : "outline"}
          onClick={() => onSelect("whole", null)}
        >
          <Layers className="mr-2 h-4 w-4" />
          {V5_COPY.focus.wholeLabel}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {V5_COPY.focus.back}
        </Button>
        <Button disabled={!mode} onClick={onNext}>
          {V5_COPY.focus.next}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);
