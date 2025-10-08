import { useEffect, useState } from 'react';
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

const postSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  status: z.enum(['draft', 'published']),
  read_time_minutes: z.number().optional(),
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
  };
}

export const BlogPostEditor = ({ post }: BlogPostEditorProps) => {
  const navigate = useNavigate();
  const { createPost, updatePost } = useBlogPostManager();
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image_url || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map(t => t.id) || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    },
  });

  const title = watch('title');

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
    };

    if (post) {
      updatePost.mutate({ ...postData, id: post.id });
    } else {
      createPost.mutate(postData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="url-do-post"
        />
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
        <Textarea
          id="content"
          {...register('content')}
          placeholder="Escreva o conteúdo em Markdown..."
          rows={15}
          className="font-mono"
        />
        {errors.content && (
          <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
        )}
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

      <div className="flex gap-4">
        <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
          {post ? 'Atualizar Post' : 'Criar Post'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/admin/blog')}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};
