import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Users } from 'lucide-react';
import { useInstitutionPatients } from '@/hooks/useInstitutionPatients';
import { EducationalInstitution } from '@/hooks/useInstitutions';

interface InstitutionPatientsModalProps {
  institution: EducationalInstitution | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InstitutionPatientsModal = ({
  institution,
  isOpen,
  onClose,
}: InstitutionPatientsModalProps) => {
  const { patientInstitutions, isLoading, removePatient, isRemoving } = useInstitutionPatients(
    institution?.id
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      enrolled: 'default',
      graduated: 'secondary',
      inactive: 'outline',
    };
    const labels = {
      enrolled: 'Matriculado',
      graduated: 'Graduado',
      inactive: 'Inativo',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pacientes - {institution?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : patientInstitutions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum paciente vinculado a esta instituição.
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {patientInstitutions.map((pi: any) => (
                  <div
                    key={pi.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{pi.pacientes.profiles.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {pi.pacientes.profiles.email}
                      </p>
                      {pi.enrollment_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Matrícula: {new Date(pi.enrollment_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(pi.enrollment_status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePatient(pi.id)}
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
