import { BlogPost } from "@/hooks/useBlogPosts";
import { PostCardVariant } from "./PostCardVariant";

interface FeaturedGridProps {
  posts: BlogPost[];
}

export const FeaturedGrid = ({ posts }: FeaturedGridProps) => {
  if (posts.length === 0) return null;

  // Layout pattern: primeiro e quarto são large (2 colunas), resto é normal (1 coluna)
  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Posts em Destaque</h2>
        <p className="text-muted-foreground">Artigos selecionados para você</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {posts.map((post, index) => {
          // Padrão: índice 0, 3, 6, 9... são large (ocupam 2 colunas)
          const isLarge = index % 7 === 0 || index % 7 === 3;
          
          return (
            <PostCardVariant
              key={post.id}
              post={post}
              variant={isLarge ? 'large' : 'default'}
              className={isLarge ? 'md:col-span-2' : ''}
            />
          );
        })}
      </div>
    </section>
  );
};
