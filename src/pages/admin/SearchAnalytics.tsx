import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SearchAnalytics() {
  const { data: searchQueries, isLoading } = useQuery({
    queryKey: ['search-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_search_queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  const topSearches = searchQueries?.reduce((acc: any[], query) => {
    const existing = acc.find(item => item.term === query.search_term);
    if (existing) {
      existing.count++;
      if (query.results_count === 0) existing.noResults++;
    } else {
      acc.push({
        term: query.search_term,
        count: 1,
        noResults: query.results_count === 0 ? 1 : 0
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => b.count - a.count).slice(0, 20);

  const noResultsQueries = searchQueries?.filter(q => q.results_count === 0)
    .slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics de Busca</h1>
        <p className="text-muted-foreground mt-2">
          Entenda o que os usuários estão procurando no blog
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Buscas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Termos Mais Buscados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topSearches && topSearches.length > 0 ? (
              <div className="space-y-2">
                {topSearches.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{item.term}</p>
                        {item.noResults > 0 && (
                          <p className="text-xs text-destructive">
                            {item.noResults} busca{item.noResults > 1 ? 's' : ''} sem resultados
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{item.count}×</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma busca registrada ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Buscas Sem Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Buscas Sem Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : noResultsQueries && noResultsQueries.length > 0 ? (
              <div className="space-y-2">
                {noResultsQueries.map((query: any) => (
                  <div key={query.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="h-4 w-4 text-destructive" />
                      <p className="font-medium">{query.search_term}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(query.created_at), "d 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Todas as buscas retornaram resultados! 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Buscas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : searchQueries && searchQueries.length > 0 ? (
            <div className="space-y-2">
              {searchQueries.slice(0, 20).map((query: any) => (
                <div key={query.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{query.search_term}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(query.created_at), "d 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`text-sm ${query.results_count === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {query.results_count} resultado{query.results_count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma busca registrada ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
