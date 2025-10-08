import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlogPost } from '@/hooks/useBlogPosts';
import { Card } from '@/components/ui/card';
import { GripVertical, Star } from 'lucide-react';
import { useBulkPostActions } from '@/hooks/useBulkPostActions';

interface FeaturedPostsReorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: BlogPost[];
}

interface SortableItemProps {
  post: BlogPost;
  index: number;
}

const SortableItem = ({ post, index }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 mb-3 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
            {index + 1}
          </div>

          {post.featured_image_url && (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-20 h-16 object-cover rounded"
            />
          )}

          <div className="flex-1">
            <div className="font-medium line-clamp-1">{post.title}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Star className="h-3 w-3 fill-current" />
              {post.views_count || 0} visualizações
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const FeaturedPostsReorder = ({ open, onOpenChange, posts }: FeaturedPostsReorderProps) => {
  const [items, setItems] = useState(posts);
  const { updateFeaturedOrder } = useBulkPostActions();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    const updates = items.map((post, index) => ({
      id: post.id,
      featured_order: index + 1
    }));

    updateFeaturedOrder.mutate(updates, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reordenar Posts em Destaque</DialogTitle>
          <DialogDescription>
            Arraste e solte para reordenar os posts em destaque. A ordem será refletida no site.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum post em destaque para ordenar
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {items.map((post, index) => (
                  <SortableItem key={post.id} post={post} index={index} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateFeaturedOrder.isPending || items.length === 0}
          >
            {updateFeaturedOrder.isPending ? 'Salvando...' : 'Salvar Ordem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
