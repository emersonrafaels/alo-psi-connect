import { Check, Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getProtocol } from "../../config/practice-protocols";
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

  const protocol = getProtocol(practice.protocolId);
  const steps =
    protocol?.steps?.map((step) => `${step.title}: ${step.instruction}`) ??
    protocol?.phases.map((phase) => `${phase.label}: ${phase.hint ?? ""}`.trim()) ??
    [];
  const done = learning.completed;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {V5_COPY.regulate.eyebrow}
            </p>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              {V5_COPY.regulate.title}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {V5_COPY.regulate.description}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4 sm:p-5">
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
                variant="secondary"
                className="shrink-0 rounded-full text-xs font-normal"
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

            {steps.length > 0 && (
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li
                    key={step}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3 text-sm",
                      done
                        ? "border-primary/30 bg-primary/5 text-foreground"
                        : "border-border/70 bg-card text-muted-foreground"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        done
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="flex flex-wrap gap-2">
              {done ? (
                <>
                  <Button disabled variant="secondary">
                    <Check className="mr-2 h-4 w-4" /> {V5_COPY.regulate.practiced}
                  </Button>
                  <Button variant="outline" onClick={onNext}>
                    {V5_COPY.regulate.continue}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={onStart}>
                    <Sparkles className="mr-2 h-4 w-4" /> {V5_COPY.regulate.practice}
                  </Button>
                  <Button variant="outline" onClick={onSkip}>
                    {V5_COPY.regulate.skip}
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={onAnother}>
                {V5_COPY.regulate.another}
              </Button>
            </div>

            {done && (
              <div className="space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {V5_COPY.regulate.utilityLabel}
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={V5_COPY.regulate.utilityLabel}
                >
                  {V5_COPY.regulate.utilityOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={learning.utility === option.value}
                      size="sm"
                      variant={learning.utility === option.value ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => onSetUtility(option.value as Intensity)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-max border-border/70 shadow-sm lg:sticky lg:top-24">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">
            {V5_COPY.regulate.autonomyTitle}
          </h3>
          <p className="text-sm text-muted-foreground">{V5_COPY.regulate.autonomyDescription}</p>
          <ol className="space-y-2">
            {V5_COPY.regulate.autonomyItems.map((item, i) => (
              <li
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-border/70 p-3"
              >
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">{item.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
