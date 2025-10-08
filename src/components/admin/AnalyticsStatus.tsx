import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AnalyticsStatus = () => {
  const { data: lastAggregation, isLoading } = useQuery({
    queryKey: ['analytics-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_analytics_daily')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const isStale = !lastAggregation || 
    (new Date().getTime() - new Date(lastAggregation.created_at).getTime()) > 48 * 60 * 60 * 1000;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Status da Agregação
        </CardTitle>
        <CardDescription>Última atualização dos analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {lastAggregation ? (
            <>
              <span className="text-2xl font-bold">
                {formatDistanceToNow(new Date(lastAggregation.created_at), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </span>
              {isStale && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Desatualizado
                </Badge>
              )}
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-muted-foreground">Nunca</span>
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Requer sincronização
              </Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
