import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileEdit, Eye, Columns, ExternalLink, Building2, Maximize2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { EditorMetrics } from './EditorMetrics';
import { PostTemplates } from './PostTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAuthorRole } from '@/hooks/useSuperAuthorRole';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { sanitizeHtml, extractTextFromHtml } from '@/utils/htmlSanitizer';
import { normalizeHtmlForEditor } from '@/utils/htmlHelpers';
import { useBlogTags } from '@/hooks/useBlogTags';
import { FocusMode } from './FocusMode';
import { ResponsivePreview } from './ResponsivePreview';

const postSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  excerpt: z.string().optional(),
  content: z.string()
    .min(1, 'Conteúdo é obrigatório')
    .refine(
      (html) => {
        const textContent = extractTextFromHtml(html).trim();
        return textContent.length >= 50;
      },
      'O conteúdo deve ter pelo menos 50 caracteres de texto'
    ),
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
  const { data: allTags = [] } = useBlogTags();
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image_url || '');
  const [selectedTags, setSelectedTags] = useState<Array<{ id: string; name: string; slug: string }>>(
    post?.tags || []
  );
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('editor');
  const [slugExists, setSlugExists] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [userStartedEditing, setUserStartedEditing] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  
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
      content: post?.content ? normalizeHtmlForEditor(post.content) : '',
      status: post?.status || 'draft',
      read_time_minutes: post?.read_time_minutes || undefined,
      allow_comments: post?.allow_comments ?? true,
      allow_ratings: post?.allow_ratings ?? true,
    },
  });

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
        // Convert tag IDs to full tag objects
        const fullTags = allTags.filter(tag => draft.tags?.includes(tag.id));
        setSelectedTags(fullTags);
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
    toast({
      title: 'Template aplicado',
      description: 'O template foi inserido no editor. Personalize conforme necessário.',
    });
  };

  // Auto-save to database (debounced)
  const autoSaveHandler = async (data: typeof allFormData) => {
    if (!data.title || !data.content) return;
    
    const sanitizedContent = sanitizeHtml(data.content);
    
    const postData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: sanitizedContent,
      status: 'draft' as const,
      read_time_minutes: data.read_time_minutes,
      featured_image_url: featuredImage || undefined,
      tags: selectedTags.map(t => t.id),
    };

    if (post) {
      await updatePost.mutateAsync({ ...postData, id: post.id });
    }
  };

  const { saveStatus, lastSaved } = useAutoSave(allFormData, {
    delay: 3000,
    enabled: !!post,
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

  const hasSignificantContent = useCallback(() => {
    const titleLength = (allFormData.title || '').trim().length;
    const contentLength = extractTextFromHtml(allFormData.content || '').trim().length;
    const hasImage = !!featuredImage;
    const hasTags = selectedTags.length > 0;
    
    return titleLength > 3 || contentLength > 10 || hasImage || hasTags;
  }, [allFormData.title, allFormData.content, featuredImage, selectedTags.length]);

  useEffect(() => {
    if (!userStartedEditing && hasSignificantContent()) {
      setUserStartedEditing(true);
    }
  }, [userStartedEditing, hasSignificantContent]);

  const draftData = useMemo(() => ({
    title: allFormData.title,
    slug: allFormData.slug,
    excerpt: allFormData.excerpt,
    content: allFormData.content,
    status: allFormData.status,
    read_time_minutes: allFormData.read_time_minutes,
    featured_image_url: featuredImage,
    tags: selectedTags.map(t => t.id)
  }), [allFormData.title, allFormData.slug, allFormData.excerpt, allFormData.content, 
       allFormData.status, allFormData.read_time_minutes, featuredImage, selectedTags]);

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
    const sanitizedContent = sanitizeHtml(data.content);
    
    const postData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: sanitizedContent,
      status: data.status,
      read_time_minutes: data.read_time_minutes,
      featured_image_url: featuredImage || undefined,
      tags: selectedTags.map(t => t.id),
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
            clearDraft();
          }
        }
      );
    } else {
      createPost.mutate(postData, {
        onSuccess: () => {
          clearDraft();
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
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
            <PostTemplates onSelectTemplate={handleTemplateSelect} />
          </div>
          <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Label htmlFor="title" className="text-base font-semibold">Título</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Digite o título do post"
                className="text-lg h-12 mt-2"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug" className="text-base font-semibold">Slug (URL)</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="url-do-post"
                onBlur={(e) => checkSlug(e.target.value)}
                className={`mt-2 ${slugExists ? 'border-destructive' : ''}`}
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
              <Label htmlFor="excerpt" className="text-base font-semibold">Resumo</Label>
              <Textarea
                id="excerpt"
                {...register('excerpt')}
                placeholder="Breve descrição do post (ideal para compartilhamento)"
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-base font-semibold mb-3 block">Conteúdo</Label>
              
              <div className="flex items-center justify-between mb-3">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-3">
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
                </Tabs>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2 gap-2"
                  onClick={() => setFocusModeOpen(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                  Modo Foco
                </Button>
              </div>
              
              <Tabs value={viewMode} className="w-full">
                <TabsContent value="editor" className="mt-0">
                  <RichTextEditor
                    value={content || ''}
                    onChange={(html) => setValue('content', html, { shouldValidate: true })}
                    placeholder="Comece a escrever o conteúdo do seu post..."
                    minHeight="600px"
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                  <ResponsivePreview 
                    content={sanitizeHtml(content || '')}
                    title={title || 'Sem título'}
                  />
                </TabsContent>

                <TabsContent value="split" className="mt-0">
                  <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
                    <ResizablePanel defaultSize={50}>
                      <div className="h-full pr-2">
                        <RichTextEditor
                          value={content || ''}
                          onChange={(html) => setValue('content', html, { shouldValidate: true })}
                          placeholder="Comece a escrever o conteúdo do seu post..."
                          minHeight="600px"
                        />
                      </div>
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle />
                    
                    <ResizablePanel defaultSize={50}>
                      <div className="h-full pl-2 border rounded-lg p-6 bg-background overflow-y-auto">
                        <div 
                          className="prose prose-slate dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
                        />
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </TabsContent>
              </Tabs>
              
              {errors.content && (
                <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold">Imagem de Destaque</Label>
              <BlogImageUpload
                currentImageUrl={featuredImage || null}
                onImageUploaded={setFeaturedImage}
                onImageRemoved={() => setFeaturedImage('')}
              />
            </div>
          </div>

          {/* Right Column: Sidebar (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sticky Sidebar */}
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Editor Metrics */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Métricas do Post</h3>
                <EditorMetrics title={title} excerpt={excerpt || ''} content={content} />
              </div>

              {/* Site Selection */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Site de Publicação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={selectedTenantId || 'context'} 
                    onValueChange={(value) => setSelectedTenantId(value === 'context' ? null : value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o site" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="context">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">🌐 Site Atual (Auto)</span>
                          <span className="text-xs text-muted-foreground">
                            {contextTenant ? `${contextTenant.name}` : 'Detectado pela URL'}
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedTenantId 
                      ? 'Post será criado para o site selecionado' 
                      : 'Post será criado para o site atual'}
                  </p>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <TagSelector
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                  />
                </CardContent>
              </Card>

              {/* Publication Settings */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <Select 
                      value={watch('status')} 
                      onValueChange={(value) => setValue('status', value as 'draft' | 'published')}
                    >
                      <SelectTrigger id="status" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">📝 Rascunho</SelectItem>
                        <SelectItem value="published">✅ Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="allow_comments" className="text-sm">Comentários</Label>
                    <Switch
                      id="allow_comments"
                      checked={watch('allow_comments') ?? true}
                      onCheckedChange={(checked) => setValue('allow_comments', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_ratings" className="text-sm">Avaliações</Label>
                    <Switch
                      id="allow_ratings"
                      checked={watch('allow_ratings') ?? true}
                      onCheckedChange={(checked) => setValue('allow_ratings', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Curation Fields - Only for Super Authors */}
              {isSuperAuthor && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Curadoria Avançada
              </CardTitle>
              <CardDescription>
                Controles especiais para destaque e badges editoriais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_featured">Post em Destaque</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir este post na seção de destaques
                  </p>
                </div>
                <Switch
                  id="is_featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>

              {isFeatured && (
                <div>
                  <Label htmlFor="featured_order">Ordem de Exibição</Label>
                  <Input
                    id="featured_order"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={featuredOrder}
                    onChange={(e) => setFeaturedOrder(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Menor número aparece primeiro
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="editorial_badge">Badge Editorial</Label>
                <Select value={editorialBadge} onValueChange={setEditorialBadge}>
                  <SelectTrigger id="editorial_badge">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="trending">🔥 Em Alta</SelectItem>
                    <SelectItem value="must_read">📚 Leitura Obrigatória</SelectItem>
                    <SelectItem value="editors_pick">⭐ Escolha do Editor</SelectItem>
                    <SelectItem value="community_favorite">❤️ Favorito da Comunidade</SelectItem>
                    <SelectItem value="staff_pick">✨ Escolha da Equipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
              </Card>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-6 border-t">
          <Button type="submit" disabled={createPost.isPending || updatePost.isPending || slugExists}>
            {createPost.isPending || updatePost.isPending ? 'Salvando...' : 'Salvar Post'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/blog-management')}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modo Foco */}
      <FocusMode
        isOpen={focusModeOpen}
        onClose={() => setFocusModeOpen(false)}
        value={content || ''}
        onChange={(html) => setValue('content', html, { shouldValidate: true })}
      />
    </>
  );
};
