import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const REOPEN_REASONS: { value: string; label: string }[] = [
  { value: "nova_ocorrencia", label: "Nova ocorrência identificada" },
  { value: "piora_quadro", label: "Piora do quadro do aluno" },
  { value: "resolucao_incompleta", label: "Resolução anterior incompleta" },
  { value: "solicitacao_familia", label: "Solicitação da família/aluno" },
  { value: "outro", label: "Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentLabel?: string;
  onConfirm: (payload: { reopenReason: string; reopenNotes: string }) => void | Promise<void>;
  isSubmitting?: boolean;
}

export default function TriageReopenDialog({ open, onOpenChange, studentLabel, onConfirm, isSubmitting }: Props) {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (open) {
      setReason("");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Selecione o motivo da reabertura");
      return;
    }
    await onConfirm({ reopenReason: reason, reopenNotes: notes.trim().slice(0, 500) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reabrir triagem</DialogTitle>
          <DialogDescription>
            {studentLabel ? `Registre o motivo para reabrir a triagem de ${studentLabel}.` : "Registre o motivo para reabrir esta triagem."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reopen-reason">
              Motivo da reabertura <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reopen-reason">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {REOPEN_REASONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reopen-notes">Descrição (opcional)</Label>
            <Textarea
              id="reopen-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes sobre a reabertura..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting ? "Salvando..." : "Confirmar reabertura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const REOPEN_REASON_LABEL: Record<string, string> = Object.fromEntries(
  REOPEN_REASONS.map((o) => [o.value, o.label])
);
