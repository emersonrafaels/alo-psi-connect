import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EducationalInstitution } from '@/hooks/useInstitutions';

const institutionSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['public', 'private']),
  has_partnership: z.boolean(),
  is_active: z.boolean(),
});

type InstitutionForm = z.infer<typeof institutionSchema>;

interface EditInstitutionModalProps {
  institution: EducationalInstitution | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EducationalInstitution> & { id: string }) => void;
  isSaving: boolean;
}

export const EditInstitutionModal = ({
  institution,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: EditInstitutionModalProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<InstitutionForm>({
    resolver: zodResolver(institutionSchema),
    defaultValues: institution || {
      name: '',
      type: 'private',
      has_partnership: false,
      is_active: true,
    },
  });

  // Reinicializa o formulário quando a instituição muda
  useEffect(() => {
    if (institution) {
      reset({
        name: institution.name,
        type: institution.type as 'public' | 'private',
        has_partnership: institution.has_partnership,
        is_active: institution.is_active,
      });
    } else {
      // Modo criação: valores padrão
      reset({
        name: '',
        type: 'private',
        has_partnership: false,
        is_active: true,
      });
    }
  }, [institution, reset]);

  const onSubmit = (data: InstitutionForm) => {
    if (institution) {
      // Modo edição: incluir ID
      onSave({ ...data, id: institution.id });
    } else {
      // Modo criação: sem ID (será gerado pelo banco)
      onSave(data as any);
    }
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {institution ? 'Editar Instituição' : 'Nova Instituição'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Instituição</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Universidade de São Paulo (USP)"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as 'public' | 'private')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Pública</SelectItem>
                <SelectItem value="private">Privada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="has_partnership">Tem Parceria</Label>
            <Switch
              id="has_partnership"
              checked={watch('has_partnership')}
              onCheckedChange={(checked) => setValue('has_partnership', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Ativa</Label>
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : (institution ? 'Salvar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
