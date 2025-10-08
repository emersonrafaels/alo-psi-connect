import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Trash2, Star, Award } from 'lucide-react';
import { BlogPost } from '@/hooks/useBlogPosts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { PostStatusBadge } from '@/components/blog/PostStatusBadge';
import { EditorialBadge } from '@/components/blog/EditorialBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBlogPostManager } from '@/hooks/useBlogPostManager';
import { useBulkPostActions } from '@/hooks/useBulkPostActions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface CurationTableProps {
  posts: BlogPost[];
  isLoading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const EDITORIAL_BADGES = [
  { value: 'editors_choice', label: 'Escolha do Editor' },
  { value: 'trending', label: 'Em Alta' },
  { value: 'must_read', label: 'Leitura Obrigatória' },
  { value: 'community_favorite', label: 'Favorito da Comunidade' },
  { value: 'staff_pick', label: 'Escolha da Equipe' }
];

export const CurationTable = ({ posts, isLoading, selectedIds, onSelectionChange }: CurationTableProps) => {
  const navigate = useNavigate();
  const { deletePost } = useBlogPostManager();
  const { bulkSetFeatured, bulkSetBadge } = useBulkPostActions();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const toggleSelection = (postId: string) => {
    if (selectedIds.includes(postId)) {
      onSelectionChange(selectedIds.filter(id => id !== postId));
    } else {
      onSelectionChange([...selectedIds, postId]);
    }
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === posts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(posts.map(p => p.id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum post encontrado
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === posts.length && posts.length > 0}
                onCheckedChange={toggleAllSelection}
              />
            </TableHead>
            <TableHead className="w-20">Imagem</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-40">Curadoria</TableHead>
            <TableHead className="w-24 text-center">Views</TableHead>
            <TableHead className="w-24 text-center">Rating</TableHead>
            <TableHead className="w-32">Data</TableHead>
            <TableHead className="w-48">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow 
              key={post.id} 
              className={post.is_featured ? 'bg-primary/5' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(post.id)}
                  onCheckedChange={() => toggleSelection(post.id)}
                />
              </TableCell>
              <TableCell>
                {post.featured_image_url ? (
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                    Sem imagem
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium line-clamp-1">{post.title}</div>
                  <div className="text-xs text-muted-foreground">
                    por {post.author?.nome || 'Desconhecido'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <PostStatusBadge status={post.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  {post.is_featured && (
                    <Badge variant="default" className="gap-1 w-fit">
                      <Star className="h-3 w-3" />
                      Destaque #{post.featured_order}
                    </Badge>
                  )}
                  {post.editorial_badge && (
                    <EditorialBadge badge={post.editorial_badge} />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {post.views_count || 0}
              </TableCell>
              <TableCell className="text-center">
                {post.average_rating ? `${Number(post.average_rating).toFixed(1)} ⭐` : '-'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {post.published_at 
                  ? format(new Date(post.published_at), 'dd/MM/yyyy', { locale: ptBR })
                  : format(new Date(post.created_at), 'dd/MM/yyyy', { locale: ptBR })
                }
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => bulkSetFeatured.mutate({ 
                      postIds: [post.id], 
                      featured: !post.is_featured 
                    })}
                    title={post.is_featured ? 'Remover destaque' : 'Destacar'}
                  >
                    <Star className={`h-4 w-4 ${post.is_featured ? 'fill-current' : ''}`} />
                  </Button>

                  <Select
                    value={post.editorial_badge || 'none'}
                    onValueChange={(value) => {
                      bulkSetBadge.mutate({ 
                        postIds: [post.id], 
                        badge: value === 'none' ? null : value 
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-8 p-0 border-0">
                      <Award className="h-4 w-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Badge</SelectItem>
                      {EDITORIAL_BADGES.map(badge => (
                        <SelectItem key={badge.value} value={badge.value}>
                          {badge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/blog/analytics/${post.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir "{post.title}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePost.mutate(post.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
