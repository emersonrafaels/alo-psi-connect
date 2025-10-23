import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInstitutions } from '@/hooks/useInstitutions';

interface LinkInstitutionModalProps {
  customName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (targetInstitutionId: string) => void;
  isSaving: boolean;
}

export function LinkInstitutionModal({
  customName,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: LinkInstitutionModalProps) {
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const { institutions } = useInstitutions(true); // activeOnly = true

  const institutionOptions = institutions.map((inst) => ({
    value: inst.id,
    label: inst.name,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInstitutionId) {
      onSave(selectedInstitutionId);
      setSelectedInstitutionId('');
    }
  };

  const handleClose = () => {
    setSelectedInstitutionId('');
    onClose();
  };

  const selectedInstitution = institutions.find((i) => i.id === selectedInstitutionId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Vincular a Instituição Existente</DialogTitle>
          <DialogDescription>
            Selecione uma instituição catalogada para vincular a este texto digitado livremente.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Todos os pacientes que digitaram "<strong>{customName}</strong>" terão seus registros
            atualizados para a instituição oficial selecionada abaixo.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Instituição Catalogada</Label>
            <Combobox
              options={institutionOptions}
              value={selectedInstitutionId}
              onValueChange={setSelectedInstitutionId}
              placeholder="Buscar instituição..."
              emptyText="Nenhuma instituição encontrada"
            />
            {selectedInstitution && (
              <p className="text-sm text-muted-foreground">
                Tipo: <strong>{selectedInstitution.type === 'public' ? 'Pública' : 'Privada'}</strong>
                {' • '}
                Parceria: <strong>{selectedInstitution.has_partnership ? 'Sim' : 'Não'}</strong>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !selectedInstitutionId}>
              {isSaving ? 'Vinculando...' : 'Vincular Instituição'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
