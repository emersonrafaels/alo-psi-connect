import { useParams } from 'react-router-dom';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { BlogPostEditor } from '@/components/blog/BlogPostEditor';
import { useBlogPost } from '@/hooks/useBlogPost';

const BlogEditor = () => {
  const { id } = useParams();
  const { data: post, isLoading } = useBlogPost(id);

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
              tags: post.tags
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
