import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckSquare, Square, Trash2, Star, Award, FileCheck, FileX } from 'lucide-react';
import { useBulkPostActions } from '@/hooks/useBulkPostActions';

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  totalCount: number;
}

const EDITORIAL_BADGES = [
  { value: 'editors_choice', label: 'Escolha do Editor' },
  { value: 'trending', label: 'Em Alta' },
  { value: 'must_read', label: 'Leitura Obrigatória' },
  { value: 'community_favorite', label: 'Favorito da Comunidade' },
  { value: 'staff_pick', label: 'Escolha da Equipe' }
];

export const BulkActionsToolbar = ({ 
  selectedIds, 
  onSelectAll, 
  onDeselectAll,
  totalCount 
}: BulkActionsToolbarProps) => {
  const { 
    bulkPublish, 
    bulkUnpublish, 
    bulkSetFeatured, 
    bulkSetBadge, 
    bulkDelete 
  } = useBulkPostActions();

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedIds.length} selecionado(s)
          </span>
          {selectedIds.length === totalCount ? (
            <Button variant="ghost" size="sm" onClick={onDeselectAll} className="gap-1">
              <Square className="h-4 w-4" />
              Desselecionar Todos
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onSelectAll} className="gap-1">
              <CheckSquare className="h-4 w-4" />
              Selecionar Todos ({totalCount})
            </Button>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => bulkPublish.mutate(selectedIds)}
            disabled={bulkPublish.isPending}
            className="gap-1"
          >
            <FileCheck className="h-4 w-4" />
            Publicar
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => bulkUnpublish.mutate(selectedIds)}
            disabled={bulkUnpublish.isPending}
            className="gap-1"
          >
            <FileX className="h-4 w-4" />
            Despublicar
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => bulkSetFeatured.mutate({ postIds: selectedIds, featured: true })}
            disabled={bulkSetFeatured.isPending}
            className="gap-1"
          >
            <Star className="h-4 w-4" />
            Destacar
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => bulkSetFeatured.mutate({ postIds: selectedIds, featured: false })}
            disabled={bulkSetFeatured.isPending}
            className="gap-1"
          >
            <Star className="h-4 w-4" />
            Remover Destaque
          </Button>

          <Select
            onValueChange={(value) => {
              bulkSetBadge.mutate({ 
                postIds: selectedIds, 
                badge: value === 'none' ? null : value 
              });
            }}
          >
            <SelectTrigger className="w-[180px] h-9">
              <Award className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Aplicar Badge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Remover Badge</SelectItem>
              {EDITORIAL_BADGES.map(badge => (
                <SelectItem key={badge.value} value={badge.value}>
                  {badge.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a excluir {selectedIds.length} post(s). Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => bulkDelete.mutate(selectedIds)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
