import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const RESOLUTION_TYPES: { value: string; label: string }[] = [
  { value: "encaminhado_profissional", label: "Encaminhado a profissional" },
  { value: "acompanhamento_interno", label: "Acompanhamento interno realizado" },
  { value: "contato_familia", label: "Contato com família/responsável" },
  { value: "melhora_espontanea", label: "Melhora espontânea observada" },
  { value: "sem_necessidade", label: "Sem necessidade de intervenção" },
  { value: "outro", label: "Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentLabel?: string;
  onConfirm: (payload: { resolutionType: string; resolutionNotes: string }) => void | Promise<void>;
  isSubmitting?: boolean;
}

export default function TriageResolutionDialog({ open, onOpenChange, studentLabel, onConfirm, isSubmitting }: Props) {
  const [type, setType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (open) {
      setType("");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!type) {
      toast.error("Selecione o tipo de resolução");
      return;
    }
    await onConfirm({ resolutionType: type, resolutionNotes: notes.trim().slice(0, 500) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolver triagem</DialogTitle>
          <DialogDescription>
            {studentLabel ? `Registre como esta triagem de ${studentLabel} foi resolvida.` : "Registre como esta triagem foi resolvida."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="resolution-type">
              Tipo de resolução <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="resolution-type">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-notes">Descrição (opcional)</Label>
            <Textarea
              id="resolution-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes sobre a resolução..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !type}>
            {isSubmitting ? "Salvando..." : "Confirmar resolução"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const RESOLUTION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  RESOLUTION_TYPES.map((o) => [o.value, o.label])
);
