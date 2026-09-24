import { AlertTriangle, ArrowLeft, Clock3, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProtocol } from "../../config/practice-protocols";
import type { Practice } from "../../domain/types";
import { BreathingPlayer } from "./BreathingPlayer";
import { StepPlayer } from "./StepPlayer";

/** Casca comum dos players: cabeçalho, segurança, modo silencioso e saída. */
export const PracticePlayer = ({
  practice,
  durationMinutes,
  silentMode,
  onToggleSilentMode,
  onComplete,
  onAbandon,
}: {
  practice: Practice;
  durationMinutes: number;
  silentMode: boolean;
  onToggleSilentMode: () => void;
  onComplete: () => void;
  onAbandon: () => void;
}) => {
  const protocol = getProtocol(practice.protocolId);

  if (!protocol) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Esta prática ainda não tem protocolo liberado pela curadoria. Escolha outra sugestão.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{practice.title}</h2>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" /> {durationMinutes} {durationMinutes === 1 ? "minuto" : "minutos"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {practice.silentModeAvailable && (
            <Button
              variant={silentMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleSilentMode}
              aria-pressed={silentMode}
              title={
                silentMode
                  ? "Modo silencioso ativo: as orientações escritas de cada etapa estão ocultas"
                  : "Orientações escritas visíveis. Toque para ativar o modo silencioso"
              }
            >
              {silentMode ? (
                <VolumeX className="mr-2 h-4 w-4" />
              ) : (
                <Volume2 className="mr-2 h-4 w-4" />
              )}
              {silentMode ? "Som desligado" : "Som ligado"}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onAbandon}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      {!!practice.safetyInstructions?.length && (
        <Alert className="border-border/70 bg-muted/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-1 text-sm">
            {practice.safetyInstructions.map((s) => (
              <p key={s}>{s}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {protocol.playerType === "breathing" ? (
        <BreathingPlayer
          protocol={protocol}
          durationMinutes={durationMinutes}
          silentMode={silentMode}
          onComplete={onComplete}
        />
      ) : (
        <StepPlayer
          protocol={protocol}
          durationMinutes={durationMinutes}
          silentMode={silentMode}
          onComplete={onComplete}
          variant={protocol.playerType === "grounding" ? "grounding" : "awareness"}
        />
      )}
    </div>
  );
};
