import { useParams } from 'react-router-dom';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { BlogPostEditor } from '@/components/blog/BlogPostEditor';
import { useBlogPostById } from '@/hooks/useBlogPostById';

const BlogEditor = () => {
  const { id } = useParams();
  const { data: post, isLoading } = useBlogPostById(id);

  return (
    <BlogLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">
          {id ? 'Editar Post' : 'Novo Post'}
        </h1>
        {isLoading ? (
          <div>Carregando...</div>
        ) : post && (post.status === 'archived' || post.status === 'draft' || post.status === 'published') ? (
          <BlogPostEditor 
            post={{
              id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              featured_image_url: post.featured_image_url,
              status: post.status === 'archived' ? 'draft' : post.status,
              read_time_minutes: post.read_time_minutes,
              tags: post.tags,
              tenant_id: post.tenant?.id,
              author_id: post.author_id,
              display_author_id: post.display_author_id,
              custom_author_name: post.custom_author_name,
              custom_author_url: post.custom_author_url,
              allow_comments: post.allow_comments,
              allow_ratings: post.allow_ratings,
              is_featured: post.is_featured,
              featured_order: post.featured_order,
              editorial_badge: post.editorial_badge
            }}
          />
        ) : id ? (
          <div>Post não encontrado</div>
        ) : (
          <BlogPostEditor />
        )}
      </div>
    </BlogLayout>
  );
};

export default BlogEditor;
