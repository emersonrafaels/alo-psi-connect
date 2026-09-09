import { Heart, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { getEmotionNode, getFamilyOf } from "../../config/emotion-taxonomy";
import { IntensityScale } from "../../components/IntensityScale";
import { PracticePlayer } from "../../components/players/PracticePlayer";
import type { Intensity, Practice } from "../../domain/types";
import { V5_COPY } from "../copy";
import type { RegulationState } from "../types";

/** Pausa opcional de regulação imediata + reavaliação da mesma ocorrência. */
export const ImmediateRegulationCard = ({
  practice,
  regulation,
  onAccept,
  onDecline,
  onSaveForLater,
  onStart,
  onComplete,
  onAbandon,
  onReassess,
  onContinue,
}: {
  practice: Practice | null;
  regulation: RegulationState;
  onAccept: () => void;
  onDecline: () => void;
  onSaveForLater: () => void;
  onStart: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  onReassess: (intensity: Intensity) => void;
  onContinue: () => void;
}) => {
  const reassessNode = getEmotionNode(regulation.reassessEmotionId);
  const reassessFamily = getFamilyOf(regulation.reassessEmotionId);

  if (regulation.completed) {
    return (
      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {V5_COPY.pause.reassessEyebrow}
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            {V5_COPY.pause.reassessTitle}
            {reassessNode && (
              <span className="text-muted-foreground"> · {reassessNode.label}</span>
            )}
          </h3>
          <Alert className="border-border/70 bg-card">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">{V5_COPY.pause.reassessNote}</AlertDescription>
          </Alert>
          <IntensityScale
            value={regulation.intensityAfter}
            color={reassessFamily?.color}
            onChange={onReassess}
            label="Muito pouco → Muito intensamente"
          />
          {regulation.intensityAfter != null && (
            <Button onClick={onContinue}>Continuar</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (regulation.playing && practice) {
    return (
      <Card className="border-primary/25">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {V5_COPY.pause.playerEyebrow}
          </p>
          <PracticePlayer
            practice={practice}
            durationMinutes={1}
            silentMode={false}
            onToggleSilentMode={() => undefined}
            onComplete={onComplete}
            onAbandon={onAbandon}
          />
        </CardContent>
      </Card>
    );
  }

  if (regulation.accepted && practice) {
    return (
      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {V5_COPY.pause.playerEyebrow}
          </p>
          <h3 className="text-lg font-semibold text-foreground">{practice.title}</h3>
          <p className="text-sm text-muted-foreground">{V5_COPY.pause.playerDescription}</p>
          <div className="flex flex-wrap gap-2">
            {V5_COPY.pause.chips.map((chip) => (
              <Badge key={chip} variant="secondary" className="rounded-full text-xs font-normal">
                {chip}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onStart}>Iniciar prática</Button>
            <Button variant="ghost" onClick={onDecline}>
              Encerrar sem concluir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardContent className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {V5_COPY.pause.eyebrow}
          </p>
          <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {V5_COPY.pause.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{V5_COPY.pause.lead}</strong>{" "}
            {V5_COPY.pause.description}
          </p>
          <p className="flex items-start gap-2 rounded-2xl border border-border/70 bg-card p-3 text-xs text-muted-foreground">
            <Heart aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {V5_COPY.pause.safety}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onAccept}>{V5_COPY.pause.accept}</Button>
            <Button variant="outline" onClick={onDecline}>
              {V5_COPY.pause.decline}
            </Button>
            <Button variant="ghost" onClick={onSaveForLater}>
              {V5_COPY.pause.later}
            </Button>
          </div>
        </div>
        <div className="mx-auto hidden w-32 md:block">
          <BuddyMascot size="lg" stack animated />
        </div>
      </CardContent>
    </Card>
  );
};
