import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, History, RotateCcw, User, ListChecks } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RADAR_STEPS } from '@/data/radarCatalog';
import type { RadarCheckpoint } from '@/hooks/useInstitutionRadar';

interface Props {
  open: boolean;
  checkpoint: RadarCheckpoint | null;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onRestart: () => void;
  restarting?: boolean;
}

export function RadarCheckpointDialog({ open, checkpoint, onOpenChange, onContinue, onRestart, restarting }: Props) {
  const [confirming, setConfirming] = useState(false);
  if (!checkpoint) return null;
  const date = new Date(checkpoint.updatedAt);
  const step = Math.min(checkpoint.step, RADAR_STEPS.length - 1);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setConfirming(false); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <History className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Encontramos um preenchimento em andamento</DialogTitle>
          <DialogDescription className="text-center">
            Há um checkpoint do Radar que ainda não foi concluído. Deseja continuar ou começar do zero?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <div className="font-medium">
                Salvo em {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
              <div className="text-muted-foreground">
                {formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <div className="text-muted-foreground">Preenchido por</div>
              <div className="font-medium">{checkpoint.authorName ?? 'Usuário não identificado'}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ListChecks className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <div className="text-muted-foreground">Parou na</div>
              <div className="font-medium">
                Etapa {step + 1} de {RADAR_STEPS.length} · {RADAR_STEPS[step]?.label}
              </div>
            </div>
          </div>
        </div>

        {confirming ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              As respostas deste checkpoint serão descartadas. Tem certeza?
            </p>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={onRestart} disabled={restarting}>
                Sim, começar do zero
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirming(true)}>
              <RotateCcw className="h-4 w-4 mr-2" /> Começar do zero
            </Button>
            <Button onClick={onContinue}>Continuar de onde parou</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
