import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BlogImageUpload } from './BlogImageUpload';
import { TagSelector } from './TagSelector';
import { useBlogPostManager } from '@/hooks/useBlogPostManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { RecoverDraftModal } from './RecoverDraftModal';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useLocalDraft } from '@/hooks/useLocalDraft';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownPreview } from './MarkdownPreview';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileEdit, Eye, Columns, ExternalLink, Building2 } from 'lucide-react';
import { MarkdownToolbar } from './MarkdownToolbar';
import { EditorMetrics } from './EditorMetrics';
import { MarkdownCheatSheet } from './MarkdownCheatSheet';
import { PostTemplates } from './PostTemplates';
import { useMarkdownToolbar } from '@/hooks/useMarkdownToolbar';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAuthorRole } from '@/hooks/useSuperAuthorRole';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

const postSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  status: z.enum(['draft', 'published']),
  read_time_minutes: z.number().optional(),
  allow_comments: z.boolean().optional(),
  allow_ratings: z.boolean().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface BlogPostEditorProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featured_image_url?: string;
    status: 'draft' | 'published';
    read_time_minutes?: number;
    tags?: Array<{ id: string; name: string; slug: string }>;
    allow_comments?: boolean;
    allow_ratings?: boolean;
    comments_count?: number;
    average_rating?: number;
    ratings_count?: number;
    is_featured?: boolean;
    featured_order?: number;
    editorial_badge?: string;
  };
}

export const BlogPostEditor = ({ post }: BlogPostEditorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPost, updatePost } = useBlogPostManager();
  const { isSuperAuthor } = useSuperAuthorRole();
  const { tenant: contextTenant } = useTenant();
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image_url || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map(t => t.id) || []
  );
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('editor');
  const [slugExists, setSlugExists] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [userStartedEditing, setUserStartedEditing] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { applyFormatting, handleKeyDown, handlePaste } = useMarkdownToolbar(
    textareaRef,
    (newValue) => setValue('content', newValue, { shouldDirty: true, shouldTouch: true })
  );
  
  // Curation fields (only for super_author/admin)
  const [isFeatured, setIsFeatured] = useState(post?.is_featured || false);
  const [featuredOrder, setFeaturedOrder] = useState(post?.featured_order?.toString() || '');
  const [editorialBadge, setEditorialBadge] = useState(post?.editorial_badge || 'none');

  // Local draft management
  const {
    draft,
    saveDraft,
    clearDraft,
    showRecoveryModal,
    acceptRecovery,
    rejectRecovery
  } = useLocalDraft({
    postId: post?.id,
    enabled: true
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      excerpt: post?.excerpt || '',
      content: post?.content || '',
      status: post?.status || 'draft',
      read_time_minutes: post?.read_time_minutes || undefined,
      allow_comments: post?.allow_comments ?? true,
      allow_ratings: post?.allow_ratings ?? true,
    },
  });

  // Separar o ref do content para usar callback ref pattern
  const { ref: contentRef, ...contentRegister } = register('content');

  // Carregar lista de tenants disponíveis
  useEffect(() => {
    const fetchTenants = async () => {
      const { data } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setAvailableTenants(data);
      }
    };
    
    fetchTenants();
  }, []);

  // Recuperar rascunho se aceito
  useEffect(() => {
    if (draft && !showRecoveryModal && !post) {
      reset({
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: draft.content,
        status: draft.status,
        read_time_minutes: draft.read_time_minutes
      });
      if (draft.featured_image_url) {
        setFeaturedImage(draft.featured_image_url);
      }
      if (draft.tags) {
        setSelectedTags(draft.tags);
      }
    }
  }, [draft, showRecoveryModal, post, reset]);

  const title = watch('title');
  const slug = watch('slug');
  const content = watch('content');
  const excerpt = watch('excerpt');
  const allFormData = watch();

  // Verificar slug único
  const checkSlug = async (slugToCheck: string) => {
    if (!slugToCheck || (post && slugToCheck === post.slug)) {
      setSlugExists(false);
      return;
    }

    setCheckingSlug(true);
    const { data } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slugToCheck)
      .maybeSingle();

    setSlugExists(!!data);
    setCheckingSlug(false);
  };

  const handleTemplateSelect = (templateContent: string) => {
    setValue('content', templateContent);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    toast({
      title: 'Template aplicado',
      description: 'O template foi inserido no editor. Personalize conforme necessário.',
    });
  };

  // Auto-save to database (debounced)
  const autoSaveHandler = async (data: typeof allFormData) => {
    if (!data.title || !data.content) return; // Não salvar se vazio
    
    const postData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      status: 'draft' as const, // Sempre salvar como draft no auto-save
      read_time_minutes: data.read_time_minutes,
      featured_image_url: featuredImage || undefined,
      tags: selectedTags,
    };

    if (post) {
      await updatePost.mutateAsync({ ...postData, id: post.id });
    } else {
      // Para posts novos, só cria no banco quando o usuário clicar em salvar
      // Auto-save vai apenas para localStorage
      return;
    }
  };

  const { saveStatus, lastSaved } = useAutoSave(allFormData, {
    delay: 3000,
    enabled: !!post, // Só auto-save no banco para posts existentes
    onSave: autoSaveHandler,
    onSuccess: () => {
      console.log('Auto-save successful');
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar automaticamente. Seus dados estão seguros no navegador.',
        variant: 'destructive'
      });
    }
  });

  // Helper para verificar se o conteúdo é significativo
  const hasSignificantContent = useCallback(() => {
    const titleLength = (allFormData.title || '').trim().length;
    const contentLength = (allFormData.content || '').trim().length;
    const hasImage = !!featuredImage;
    const hasTags = selectedTags.length > 0;
    
    return titleLength > 3 || contentLength > 10 || hasImage || hasTags;
  }, [allFormData.title, allFormData.content, featuredImage, selectedTags]);

  // Marcar que o usuário começou a editar quando houver mudanças reais
  useEffect(() => {
    if (!userStartedEditing && hasSignificantContent()) {
      setUserStartedEditing(true);
    }
  }, [userStartedEditing, hasSignificantContent]);

  // Memoizar dados do draft para evitar re-criação
  const draftData = useMemo(() => ({
    title: allFormData.title,
    slug: allFormData.slug,
    excerpt: allFormData.excerpt,
    content: allFormData.content,
    status: allFormData.status,
    read_time_minutes: allFormData.read_time_minutes,
    featured_image_url: featuredImage,
    tags: selectedTags
  }), [allFormData.title, allFormData.slug, allFormData.excerpt, allFormData.content, 
       allFormData.status, allFormData.read_time_minutes, featuredImage, selectedTags]);

  // Auto-save to localStorage apenas se usuário começou a editar E tem conteúdo significativo
  useEffect(() => {
    if (userStartedEditing && hasSignificantContent()) {
      saveDraft(draftData);
    }
  }, [draftData, saveDraft, userStartedEditing, hasSignificantContent]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && title) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [title, post, setValue]);

  const onSubmit = (data: PostFormData) => {
    const postData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      status: data.status,
      read_time_minutes: data.read_time_minutes,
      featured_image_url: featuredImage || undefined,
      tags: selectedTags,
      allow_comments: data.allow_comments,
      allow_ratings: data.allow_ratings,
      tenant_id: selectedTenantId || undefined,
      is_featured: isSuperAuthor ? isFeatured : undefined,
      featured_order: isSuperAuthor && isFeatured && featuredOrder ? parseInt(featuredOrder) : undefined,
      editorial_badge: isSuperAuthor && editorialBadge !== 'none' ? editorialBadge : undefined,
    } as any;

    if (post) {
      updatePost.mutate(
        { ...postData, id: post.id },
        {
          onSuccess: () => {
            clearDraft(); // Limpar rascunho após salvar com sucesso
          }
        }
      );
    } else {
      createPost.mutate(postData, {
        onSuccess: () => {
          clearDraft(); // Limpar rascunho após criar com sucesso
        }
      });
    }
  };

  return (
    <>
      <RecoverDraftModal
        open={showRecoveryModal}
        draftTimestamp={draft?.timestamp}
        onRecover={acceptRecovery}
        onDiscard={rejectRecovery}
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {post ? 'Editando Post' : 'Novo Post'}
            </h2>
            {post && post.status === 'published' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                title="Ver post no blog"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver no Blog
              </Button>
            )}
            <MarkdownCheatSheet />
            <PostTemplates onSelectTemplate={handleTemplateSelect} />
          </div>
          <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        </div>

        {/* Editor Metrics */}
        <EditorMetrics title={title} excerpt={excerpt || ''} content={content} />

        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Digite o título do post"
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Site de Publicação
          </Label>
          <Select 
            value={selectedTenantId || 'context'} 
            onValueChange={(value) => setSelectedTenantId(value === 'context' ? null : value)}
          >
            <SelectTrigger id="tenant" className="bg-background">
              <SelectValue placeholder="Selecione o site" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="context">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">🌐 Site Atual (Auto)</span>
                  <span className="text-xs text-muted-foreground">
                    {contextTenant ? `${contextTenant.name} (${contextTenant.slug})` : 'Detectado pela URL'}
                  </span>
                </div>
              </SelectItem>
              
              <div className="my-1 border-t" />
              
              {availableTenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium flex items-center gap-2">
                      {tenant.slug === 'alopsi' && '🟢'}
                      {tenant.slug === 'medcos' && '🔵'}
                      {tenant.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{tenant.slug}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {selectedTenantId 
              ? 'Post será criado para o site selecionado acima' 
              : 'Post será criado para o site atual (baseado na URL)'}
          </p>
        </div>

        <div>
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            {...register('slug')}
            placeholder="url-do-post"
            onBlur={(e) => checkSlug(e.target.value)}
            className={slugExists ? 'border-destructive' : ''}
          />
          {slugExists && (
            <p className="text-sm text-destructive mt-1">
              ⚠️ Este slug já está em uso. Por favor, escolha outro.
            </p>
          )}
          {checkingSlug && (
            <p className="text-sm text-muted-foreground mt-1">
              Verificando disponibilidade...
            </p>
          )}
          {errors.slug && (
            <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="excerpt">Resumo</Label>
          <Textarea
            id="excerpt"
            {...register('excerpt')}
            placeholder="Breve descrição do post"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="content">Conteúdo (Markdown)</Label>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="split" className="flex items-center gap-2">
                <Columns className="h-4 w-4" />
                Split
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <MarkdownToolbar onAction={applyFormatting} />
                <Textarea
                  {...contentRegister}
                  ref={(e) => {
                    contentRef(e);
                    textareaRef.current = e;
                  }}
                  id="content"
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Escreva o conteúdo em Markdown..."
                  rows={20}
                  className="font-mono border-0 rounded-none focus-visible:ring-0"
                />
              </div>
              {errors.content && (
                <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <MarkdownPreview 
                content={content}
                title={title}
                excerpt={excerpt}
                featuredImage={featuredImage}
              />
            </TabsContent>

            <TabsContent value="split" className="mt-0">
              <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full flex flex-col">
                    <Label className="p-4 pb-0 block">Editor</Label>
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <MarkdownToolbar onAction={applyFormatting} />
                      <Textarea
                        {...contentRegister}
                        ref={(e) => {
                          contentRef(e);
                          textareaRef.current = e;
                        }}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="Escreva o conteúdo em Markdown..."
                        className="font-mono flex-1 resize-none border-0 rounded-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full overflow-auto">
                    <MarkdownPreview 
                      content={content}
                      title={title}
                      excerpt={excerpt}
                      featuredImage={featuredImage}
                      className="h-full"
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
              {errors.content && (
                <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

      <div>
        <Label>Imagem de Destaque</Label>
        <BlogImageUpload
          currentImageUrl={featuredImage}
          onImageUploaded={setFeaturedImage}
          onImageRemoved={() => setFeaturedImage('')}
        />
      </div>

      <div>
        <Label>Tags</Label>
        <TagSelector
          selectedTags={selectedTags.map(id => {
            const tag = post?.tags?.find(t => t.id === id);
            return tag || { id, name: '', slug: '' };
          })}
          onChange={(tags) => setSelectedTags(tags.map(t => t.id))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            defaultValue={post?.status || 'draft'}
            onValueChange={(value) => setValue('status', value as 'draft' | 'published')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="read_time_minutes">Tempo de Leitura (min)</Label>
          <Input
            id="read_time_minutes"
            type="number"
            {...register('read_time_minutes', { valueAsNumber: true })}
            placeholder="5"
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold">Configurações de Interação</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow_comments">Permitir comentários</Label>
            <p className="text-sm text-muted-foreground">
              {post?.comments_count ? `${post.comments_count} comentário${post.comments_count > 1 ? 's' : ''} atualmente` : 'Permitir que leitores comentem'}
            </p>
          </div>
          <input
            id="allow_comments"
            type="checkbox"
            {...register('allow_comments')}
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow_ratings">Permitir avaliações</Label>
            <p className="text-sm text-muted-foreground">
              {post?.ratings_count ? `⭐ ${post.average_rating?.toFixed(1)} (${post.ratings_count} avaliações)` : 'Permitir que leitores avaliem'}
            </p>
          </div>
          <input
            id="allow_ratings"
            type="checkbox"
            {...register('allow_ratings')}
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>
      </div>

      {/* Curation Section - Only for Super Author/Admin */}
      {isSuperAuthor && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Configurações de Curadoria
            </CardTitle>
            <CardDescription>
              Controles avançados para destacar e categorizar este post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Featured Post */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_featured">Post em Destaque</Label>
                <p className="text-sm text-muted-foreground">
                  Destacar este post na página principal
                </p>
              </div>
              <Switch
                id="is_featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>

            {/* Featured Order */}
            {isFeatured && (
              <div>
                <Label htmlFor="featured_order">Ordem do Destaque</Label>
                <Input
                  id="featured_order"
                  type="number"
                  min="1"
                  value={featuredOrder}
                  onChange={(e) => setFeaturedOrder(e.target.value)}
                  placeholder="1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Posts com ordem menor aparecem primeiro (1, 2, 3...)
                </p>
              </div>
            )}

            {/* Editorial Badge */}
            <div>
              <Label htmlFor="editorial_badge">Badge Editorial</Label>
              <Select value={editorialBadge} onValueChange={setEditorialBadge}>
                <SelectTrigger id="editorial_badge">
                  <SelectValue placeholder="Selecione um badge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="editors_pick">⭐ Escolha do Editor</SelectItem>
                  <SelectItem value="trending">🔥 Em Alta</SelectItem>
                  <SelectItem value="must_read">📚 Leitura Obrigatória</SelectItem>
                  <SelectItem value="community_favorite">❤️ Favorito da Comunidade</SelectItem>
                  <SelectItem value="staff_pick">✨ Escolha da Equipe</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Badge especial que aparecerá no card do post
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
          {post ? 'Atualizar Post' : 'Criar Post'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/admin/blog')}>
          Cancelar
        </Button>
      </div>
      </form>
    </>
  );
};
