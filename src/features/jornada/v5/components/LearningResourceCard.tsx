import { Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { USEFULNESS_LABELS } from "../../config/perceived-change-options";
import { PracticePlayer } from "../../components/players/PracticePlayer";
import type { Intensity, Practice } from "../../domain/types";
import { V5_COPY } from "../copy";
import type { LearningState } from "../types";

/** Fase Regular: um recurso da trilha de aprendizagem, com transparência da escolha. */
export const LearningResourceCard = ({
  practice,
  learning,
  isNew,
  onSelectDuration,
  onStart,
  onComplete,
  onAbandon,
  onToggleSilent,
  onSkip,
  onAnother,
  onSetUtility,
  onNext,
}: {
  practice: Practice | null;
  learning: LearningState;
  isNew: boolean;
  onSelectDuration: (minutes: number) => void;
  onStart: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  onToggleSilent: () => void;
  onSkip: () => void;
  onAnother: () => void;
  onSetUtility: (utility: Intensity) => void;
  onNext: () => void;
}) => {
  if (!practice) {
    return (
      <Card className="border-border/70">
        <CardContent className="space-y-4 p-5 sm:p-8">
          <p className="text-sm text-muted-foreground">
            Nenhum recurso disponível com esses critérios agora. Você pode seguir sem prática.
          </p>
          <Button variant="outline" onClick={onSkip}>
            {V5_COPY.regulate.skip}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const duration = learning.durationMinutes ?? practice.durations[0];

  if (learning.playing) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5 sm:p-8">
          <PracticePlayer
            practice={practice}
            durationMinutes={duration}
            silentMode={learning.silentMode}
            onToggleSilentMode={onToggleSilent}
            onComplete={onComplete}
            onAbandon={onAbandon}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {V5_COPY.regulate.eyebrow}
          </p>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            {V5_COPY.regulate.title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{V5_COPY.regulate.description}</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg text-primary"
              >
                {practice.icon ?? "♡"}
              </span>
              <h3 className="text-lg font-semibold text-foreground">{practice.title}</h3>
              <p className="max-w-xl text-sm text-muted-foreground">{practice.description}</p>
            </div>
            <Badge
              className={cn(
                "shrink-0 rounded-full text-xs font-normal",
                isNew ? "" : "bg-secondary text-secondary-foreground"
              )}
            >
              {isNew ? V5_COPY.regulate.newBadge : V5_COPY.regulate.knownBadge}
            </Badge>
          </div>

          {practice.durations.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {practice.durations.map((minutes) => (
                <Button
                  key={minutes}
                  size="sm"
                  variant={duration === minutes ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => onSelectDuration(minutes)}
                >
                  {minutes} min
                </Button>
              ))}
            </div>
          )}

          <Alert className="border-primary/25 bg-card">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong className="text-foreground">{V5_COPY.regulate.whyLabel}</strong>{" "}
              {learning.reason}
            </AlertDescription>
          </Alert>

          {!!practice.benefits?.length && (
            <ul className="flex flex-wrap gap-2">
              {practice.benefits.map((benefit) => (
                <li key={benefit}>
                  <Badge variant="secondary" className="rounded-full text-xs font-normal">
                    {benefit}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onStart}>
              <Sparkles className="mr-2 h-4 w-4" /> {V5_COPY.regulate.practice}
            </Button>
            <Button variant="outline" onClick={onSkip}>
              {V5_COPY.regulate.skip}
            </Button>
            <Button variant="ghost" onClick={onAnother}>
              {V5_COPY.regulate.another}
            </Button>
          </div>
        </div>

        {learning.completed && (
          <div className="space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground">
              {V5_COPY.regulate.utilityLabel}
            </p>
            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Utilidade do recurso">
              {([1, 2, 3, 4, 5] as Intensity[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={learning.utility === value}
                  onClick={() => onSetUtility(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all",
                    learning.utility === value
                      ? "border-transparent bg-primary text-primary-foreground shadow-md"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-base font-semibold">{value}</span>
                  <span className="text-[11px] leading-tight opacity-90">
                    {USEFULNESS_LABELS[value]}
                  </span>
                </button>
              ))}
            </div>
            {learning.utility != null && <Button onClick={onNext}>Continuar para agir</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
