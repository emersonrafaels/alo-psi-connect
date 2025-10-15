import { useState, useEffect } from 'react';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { supabase } from '@/integrations/supabase/client';
import { useBlogPostManager } from '@/hooks/useBlogPostManager';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PostStatusBadge } from './PostStatusBadge';
import { EditorialBadge } from './EditorialBadge';
import { Pencil, Trash2, Eye, Plus, ExternalLink, BarChart3, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const BlogPostsList = () => {
  const navigate = useNavigate();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | 'all'>('all');
  const [tenants, setTenants] = useState<Map<string, { name: string; slug: string }>>(new Map());
  
  const { data: posts, isLoading } = useBlogPosts({
    status: statusFilter === 'all' ? undefined : statusFilter
  });
  const { deletePost, publishPost } = useBlogPostManager();

  // Carregar tenants
  useEffect(() => {
    const fetchTenants = async () => {
      const { data } = await supabase
        .from('tenants')
        .select('id, name, slug');
      
      if (data) {
        const tenantsMap = new Map(data.map(t => [t.id, { name: t.name, slug: t.slug }]));
        setTenants(tenantsMap);
      }
    };
    
    fetchTenants();
  }, []);

  const handleDelete = () => {
    if (deletePostId) {
      deletePost.mutate(deletePostId);
      setDeletePostId(null);
    }
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Posts</h1>
        <Button onClick={() => navigate('/admin/blog/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Post
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="published">Publicados</TabsTrigger>
          <TabsTrigger value="draft">Rascunhos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Curadoria</TableHead>
              <TableHead>Visualizações</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts?.map((post) => {
              const tenant = (post as any).tenant_id ? tenants.get((post as any).tenant_id) : null;
              
              return (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  {tenant ? (
                    <Badge variant="outline" className="gap-1">
                      {tenant.slug === 'alopsi' && '🟢'}
                      {tenant.slug === 'medcos' && '🔵'}
                      {tenant.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem tenant</span>
                  )}
                </TableCell>
                <TableCell>
                  <PostStatusBadge status={post.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {(post as any).is_featured && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3" />
                        Destaque #{(post as any).featured_order || '?'}
                      </Badge>
                    )}
                    {(post as any).editorial_badge && (
                      <EditorialBadge badge={(post as any).editorial_badge} />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    {post.views_count || 0}
                  </div>
                </TableCell>
                <TableCell>
                  {post.published_at 
                    ? new Date(post.published_at).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/post-analytics/${post.id}`)}
                      title="Ver analytics do post"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    {post.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        title="Ver post no blog"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {post.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publishPost.mutate(post.id)}
                      >
                        Publicar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePostId(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
