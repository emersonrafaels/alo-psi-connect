import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const catalogueSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['public', 'private']),
  has_partnership: z.boolean(),
  is_active: z.boolean(),
});

type CatalogueForm = z.infer<typeof catalogueSchema>;

interface CatalogueInstitutionModalProps {
  customName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CatalogueForm) => void;
  isSaving: boolean;
}

export function CatalogueInstitutionModal({
  customName,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: CatalogueInstitutionModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CatalogueForm>({
    resolver: zodResolver(catalogueSchema),
    defaultValues: {
      name: customName || '',
      type: 'private',
      has_partnership: false,
      is_active: true,
    },
  });

  const type = watch('type');
  const hasPartnership = watch('has_partnership');
  const isActive = watch('is_active');

  const onSubmit = (data: CatalogueForm) => {
    onSave(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Atualizar nome quando customName mudar
  if (customName && watch('name') !== customName) {
    setValue('name', customName);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Catalogar Instituição</DialogTitle>
          <DialogDescription>
            Adicione esta instituição ao catálogo oficial e normalize os registros dos pacientes.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Todos os pacientes que digitaram "<strong>{customName}</strong>" terão seus registros
            atualizados para o nome oficial que você definir abaixo.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Oficial da Instituição</Label>
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
            <Select value={type} onValueChange={(value: any) => setValue('type', value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Pública</SelectItem>
                <SelectItem value="private">Privada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="has_partnership">Tem Parceria</Label>
              <p className="text-sm text-muted-foreground">
                Esta instituição possui parceria com a plataforma
              </p>
            </div>
            <Switch
              id="has_partnership"
              checked={hasPartnership}
              onCheckedChange={(checked) => setValue('has_partnership', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Status Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Instituição visível para novos cadastros
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Catalogando...' : 'Catalogar Instituição'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
