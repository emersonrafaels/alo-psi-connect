import { AlertTriangle, ArrowLeft, VolumeX } from "lucide-react";
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{practice.title}</h2>
          <p className="text-sm text-muted-foreground">{durationMinutes} minutos</p>
        </div>
        <div className="flex gap-2">
          {practice.silentModeAvailable && (
            <Button
              variant={silentMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleSilentMode}
              aria-pressed={silentMode}
            >
              <VolumeX className="mr-2 h-4 w-4" /> Silencioso
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onAbandon}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      {!!practice.safetyInstructions?.length && (
        <Alert>
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
