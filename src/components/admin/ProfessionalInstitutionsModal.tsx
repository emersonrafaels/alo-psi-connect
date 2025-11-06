import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfessionalInstitutions } from '@/hooks/useProfessionalInstitutions';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useState } from 'react';
import { Trash2, Plus, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface ProfessionalInstitutionsModalProps {
  professionalId: number;
  professionalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfessionalInstitutionsModal = ({
  professionalId,
  professionalName,
  open,
  onOpenChange
}: ProfessionalInstitutionsModalProps) => {
  const { professionalInstitutions, addInstitution, removeInstitution, isAdding, isRemoving } = 
    useProfessionalInstitutions(professionalId);
  const { institutions } = useInstitutions(true);
  
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [relationshipType, setRelationshipType] = useState<'employee' | 'consultant' | 'supervisor' | 'intern'>('employee');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!selectedInstitution) return;
    
    addInstitution({
      professional_id: professionalId,
      institution_id: selectedInstitution,
      relationship_type: relationshipType,
      start_date: startDate || undefined,
      notes: notes || undefined
    });
    
    setSelectedInstitution('');
    setRelationshipType('employee');
    setStartDate('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Instituições - {professionalName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <h3 className="font-semibold">Vínculos Atuais</h3>
          {professionalInstitutions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma instituição vinculada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {professionalInstitutions.map((link: any) => (
                <div key={link.id} className="border rounded-lg p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{link.educational_institutions.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {link.relationship_type === 'employee' ? 'Funcionário' :
                             link.relationship_type === 'consultant' ? 'Consultor' :
                             link.relationship_type === 'supervisor' ? 'Supervisor' : 'Estagiário'}
                    </p>
                    {link.start_date && (
                      <p className="text-xs text-muted-foreground">
                        Desde: {format(new Date(link.start_date), 'dd/MM/yyyy')}
                      </p>
                    )}
                    {link.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {link.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstitution(link.id)}
                    disabled={isRemoving}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Nova Instituição
          </h3>
          
          <div className="space-y-3">
            <div>
              <Label>Instituição</Label>
              <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Vínculo</Label>
              <Select value={relationshipType} onValueChange={(v: any) => setRelationshipType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="consultant">Consultor</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="intern">Estagiário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Início (opcional)</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Professor de psicologia clínica"
                rows={2}
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={!selectedInstitution || isAdding}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Vínculo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
