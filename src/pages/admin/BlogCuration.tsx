import { BlogLayout } from '@/components/blog/BlogLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Sparkles } from 'lucide-react';

const BlogCuration = () => {
  return (
    <BlogLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8 text-primary" />
            Dashboard de Curadoria
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle avançado de posts em destaque, badges editoriais e ordenação
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Em Desenvolvimento - Sprint 2
            </CardTitle>
            <CardDescription>
              Esta página será implementada na Sprint 2 com funcionalidades avançadas de curadoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Funcionalidades Planejadas:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Visão geral de todos os posts com filtros avançados</li>
                <li>Ações em massa (publicar, despublicar, adicionar a coleção)</li>
                <li>Arrastar e soltar para reordenar posts em destaque</li>
                <li>Quick actions (destacar post, adicionar badge editorial)</li>
                <li>Estatísticas de curadoria e engajamento</li>
                <li>Gerenciamento de coleções/séries de posts</li>
              </ul>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm">
                <strong>Já Disponível:</strong> Você pode editar posts individuais e configurar
                destaque e badges na página de edição de cada post.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BlogLayout>
  );
};

export default BlogCuration;
