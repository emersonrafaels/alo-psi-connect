import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Brain, TrendingUp, Target, RefreshCw, Lightbulb } from 'lucide-react';

interface Props {
  institutionId: string;
}

interface PredictiveInsight {
  title: string;
  summary: string;
  cohort?: string;
  confidence?: 'baixa' | 'média' | 'alta' | string;
  suggested_actions?: string[];
  trend?: 'up' | 'down' | 'stable' | string;
}

interface PredictivePayload {
  insights: PredictiveInsight[];
  benchmark?: {
    enabled: boolean;
    message?: string;
    metrics?: Array<{ label: string; institution: number; network: number; delta: number }>;
  };
  generated_at?: string;
}

async function fetchInsights(institutionId: string): Promise<PredictivePayload> {
  const { data, error } = await supabase.functions.invoke('institution-predictive-insights', {
    body: { institutionId },
  });
  if (error) throw error;
  return data as PredictivePayload;
}

function trendBadge(trend?: string) {
  if (trend === 'up') return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Melhora</Badge>;
  if (trend === 'down') return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400">Queda</Badge>;
  return <Badge variant="outline">Estável</Badge>;
}

export function BuddyInstitutionPanel({ institutionId }: Props) {
  const [enabled, setEnabled] = useState(false);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['institution-predictive', institutionId],
    queryFn: () => fetchInsights(institutionId),
    enabled: enabled && !!institutionId,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-5 w-5 text-primary" />
                Buddy Institucional
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Insights preditivos, padrões por coorte e benchmark anônimo com outras instituições da rede.
                Todos os dados respeitam anonimização (k-anônimo ≥ 5).
              </p>
            </div>
            <div className="flex gap-2">
              {enabled && (
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              )}
              {!enabled && (
                <Button onClick={() => setEnabled(true)}>
                  <Sparkles className="h-4 w-4 mr-2" /> Gerar insights
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {!enabled ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Clique em "Gerar insights" para o Buddy analisar padrões de coortes, tendências emocionais
              e sugerir ações estratégicas para sua instituição.
            </p>
          </CardContent>
        </Card>
      ) : isFetching ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {(data?.insights || []).map((ins, i) => (
              <Card key={i} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      {ins.title}
                    </CardTitle>
                    {trendBadge(ins.trend)}
                  </div>
                  {ins.cohort && (
                    <p className="text-xs text-muted-foreground">Coorte: {ins.cohort}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{ins.summary}</p>
                  {ins.suggested_actions && ins.suggested_actions.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs font-medium mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3 text-primary" /> Ações sugeridas
                      </p>
                      <ul className="space-y-1">
                        {ins.suggested_actions.map((a, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-primary">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ins.confidence && (
                    <p className="text-[10px] text-muted-foreground">Confiança: {ins.confidence}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!data?.insights || data.insights.length === 0) && (
              <Card className="md:col-span-2">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Ainda não há dados suficientes para gerar insights confiáveis.
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Benchmark com a rede
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.benchmark?.enabled ? (
                <p className="text-sm text-muted-foreground">
                  {data?.benchmark?.message ||
                    'O benchmark é opcional (opt-in) e requer no mínimo 3 instituições participantes para preservar o anonimato.'}
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {(data.benchmark.metrics || []).map((m, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-lg font-bold">{m.institution.toFixed(2)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Rede: {m.network.toFixed(2)} ({m.delta >= 0 ? '+' : ''}
                        {m.delta.toFixed(2)})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
