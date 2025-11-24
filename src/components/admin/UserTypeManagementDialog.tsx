import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserTypeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentType: string;
  onTypeUpdated?: () => void;
}

const USER_TYPES = [
  { value: 'paciente', label: 'Paciente' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'admin', label: 'Administrador Institucional' }
];

export const UserTypeManagementDialog = ({ 
  open, 
  onOpenChange, 
  userId, 
  userName,
  currentType,
  onTypeUpdated 
}: UserTypeManagementDialogProps) => {
  const [selectedType, setSelectedType] = useState<string>(currentType);
  const { updateUserType, loading } = useUserManagement();

  useEffect(() => {
    setSelectedType(currentType);
  }, [currentType, open]);

  const handleUpdateType = async () => {
    if (!selectedType || selectedType === currentType) return;

    const result = await updateUserType(userId, selectedType as 'paciente' | 'profissional' | 'admin');
    if (result.success) {
      onTypeUpdated?.();
      onOpenChange(false);
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'profissional':
        return 'default';
      case 'paciente':
        return 'secondary';
      case 'admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const isTypeChanged = selectedType !== currentType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Tipo de Usuário - {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Type */}
          <div>
            <h4 className="text-sm font-medium mb-2">Tipo Atual</h4>
            <Badge variant={getTypeBadgeVariant(currentType)}>
              {USER_TYPES.find(type => type.value === currentType)?.label || currentType}
            </Badge>
          </div>

          {/* Change Type */}
          <div>
            <h4 className="text-sm font-medium mb-2">Alterar Tipo</h4>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning Message */}
          {isTypeChanged && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {selectedType === 'profissional' 
                  ? 'O usuário será convertido para profissional. Um perfil profissional será criado automaticamente.'
                  : selectedType === 'admin'
                  ? 'O usuário será convertido para administrador institucional. Lembre-se de atribuir roles apropriadas (institution_admin) na seção "Gerenciar Roles".'
                  : 'O usuário será convertido para paciente. O perfil profissional será desativado se existir.'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateType} 
              disabled={!isTypeChanged || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Tipo'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};