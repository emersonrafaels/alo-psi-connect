import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import BuddyCharacter from '@/components/hero/BuddyCharacter';
import {
  Sparkles, RefreshCw, Lightbulb, Target, TrendingUp, BookOpen,
  Heart, Users, AlertTriangle, PartyPopper, ArrowRight, Clock, UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  institutionId: string;
}

interface Insight {
  title: string;
  situation?: string;
  impact?: string;
  recommendation?: string;
  narrative?: string;
  cohort?: string;
  dimension?: 'academico' | 'socioemocional' | 'engajamento' | 'risco' | string;
  severity?: 'positivo' | 'atencao' | 'alerta' | 'critico' | string;
  confidence?: string;
  evidence?: string;
}

interface PriorityAction {
  title: string;
  why?: string;
  how?: string[] | string;
  owner?: string;
  timeframe?: string;
  cta_label?: string;
  cta_target?: 'triagem' | 'notas' | 'diario' | 'metricas' | null;
}

interface Payload {
  headline?: string;
  tldr?: string;
  wow_metric?: { label: string; value: string; context?: string } | null;
  celebrate?: string[];
  insights: Insight[];
  priority_actions: PriorityAction[];
  generated_at?: string;
  // legado
  predictive_insights?: any[];
  suggested_actions?: any[];
}

async function fetchInsights(institutionId: string, force = false): Promise<Payload> {
  const { data, error } = await supabase.functions.invoke('institution-predictive-insights', {
    body: { institutionId, force },
  });
  if (error) throw error;
  return data as Payload;
}

// Compatibiliza payload antigo com o novo shape
function normalize(p: Payload | undefined): Payload {
  if (!p) return { insights: [], priority_actions: [] };
  const insights: Insight[] = p.insights?.length
    ? p.insights
    : (p.predictive_insights || []).map((x: any) => ({
        title: x.title,
        situation: x.description,
        impact: x.evidence,
        recommendation: '',
        cohort: x.affected_cohort,
        confidence: x.confidence,
        severity: 'atencao',
        dimension: 'socioemocional',
      }));
  const actions: PriorityAction[] = p.priority_actions?.length
    ? p.priority_actions
    : (p.suggested_actions || []).map((x: any) => ({
        title: x.title, why: x.description, cta_label: x.cta_label, owner: 'Coordenação', timeframe: '15 dias',
      }));
  return { ...p, insights, priority_actions: actions };
}

const dimensionIcon = (d?: string) => {
  switch (d) {
    case 'academico': return BookOpen;
    case 'socioemocional': return Heart;
    case 'engajamento': return Users;
    case 'risco': return AlertTriangle;
    default: return Lightbulb;
  }
};

const severityStyle = (s?: string) => {
  switch (s) {
    case 'positivo': return { badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', ring: 'ring-emerald-500/20', label: 'Positivo' };
    case 'critico': return { badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30', ring: 'ring-rose-500/30', label: 'Crítico' };
    case 'alerta': return { badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30', ring: 'ring-orange-500/20', label: 'Alerta' };
    case 'atencao':
    default: return { badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', ring: 'ring-amber-500/20', label: 'Atenção' };
  }
};

const confidenceLabel: Record<string, string> = {
  baixa: 'Confiança baixa', media: 'Confiança média', alta: 'Confiança alta',
};

function scrollToTab(target?: string | null) {
  if (!target) return;
  const map: Record<string, string> = {
    triagem: '[data-tab-triagem]', notas: '[data-tab-notas]',
    diario: '[data-tab-diario]', metricas: '[data-tab-metricas]',
  };
  const el = document.querySelector(map[target] || '');
  if (el instanceof HTMLElement) { el.click(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else document.getElementById('institution-tabs')?.scrollIntoView({ behavior: 'smooth' });
}

export function BuddyInstitutionPanel({ institutionId }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [forceKey, setForceKey] = useState(0);

  const { data: raw, isFetching, refetch } = useQuery({
    queryKey: ['institution-predictive', institutionId, forceKey],
    queryFn: () => fetchInsights(institutionId, forceKey > 0),
    enabled: enabled && !!institutionId,
    staleTime: 60 * 60 * 1000,
  });

  const data = useMemo(() => normalize(raw), [raw]);

  return (
    <div className="space-y-6">
      {/* Convite inicial */}
      {!enabled && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="shrink-0"><BuddyCharacter size="lg" animated /></div>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">Buddy Institucional</h2>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                  Um diagnóstico executivo do bem-estar da sua instituição — em linguagem de gestão,
                  não de consultório. O Buddy conecta os dados e entrega o que decidir na segunda de manhã.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="border-primary/30">📊 Diagnóstico executivo</Badge>
                  <Badge variant="outline" className="border-primary/30">🎯 Coortes em risco</Badge>
                  <Badge variant="outline" className="border-primary/30">🗓️ Plano de 15 dias</Badge>
                  <Badge variant="outline" className="border-primary/30">🎉 O que celebrar</Badge>
                </div>
                <div className="pt-2">
                  <Button size="lg" onClick={() => setEnabled(true)}>
                    <Sparkles className="h-4 w-4 mr-2" /> Gerar diagnóstico do Buddy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {enabled && isFetching && (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        </div>
      )}

      {enabled && !isFetching && raw && (
        <>
          {/* Hero de storytelling */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="shrink-0 self-center lg:self-start"><BuddyCharacter size="lg" animated /></div>
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-semibold">
                      <Sparkles className="h-3.5 w-3.5" /> Diagnóstico do Buddy
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setForceKey(k => k + 1); refetch(); }} disabled={isFetching}>
                      <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} /> Atualizar
                    </Button>
                  </div>
                  {data.headline && (
                    <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
                      {data.headline}
                    </h2>
                  )}
                  {data.tldr && (
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                      {data.tldr}
                    </p>
                  )}
                  {data.wow_metric && (
                    <div className="mt-2 inline-flex items-center gap-4 rounded-xl border border-primary/30 bg-background/60 backdrop-blur px-4 py-3">
                      <div className="text-3xl sm:text-4xl font-bold text-primary tabular-nums">{data.wow_metric.value}</div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{data.wow_metric.label}</div>
                        {data.wow_metric.context && <div className="text-sm text-foreground/80">{data.wow_metric.context}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* O que celebrar */}
          {data.celebrate && data.celebrate.length > 0 && (
            <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PartyPopper className="h-4 w-4 text-emerald-600" /> O que celebrar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {data.celebrate.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-foreground/90">{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {data.insights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.insights.map((ins, i) => {
                const Icon = dimensionIcon(ins.dimension);
                const sev = severityStyle(ins.severity);
                return (
                  <Card key={i} className={cn('border-border/50 hover:shadow-md transition-shadow ring-1', sev.ring)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <CardTitle className="text-base leading-snug">{ins.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className={cn('text-xs shrink-0', sev.badge)}>{sev.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {ins.situation && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Situação</div>
                          <p className="text-sm text-foreground/90 leading-relaxed">{ins.situation}</p>
                        </div>
                      )}
                      {ins.impact && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Impacto para a instituição</div>
                          <p className="text-sm text-foreground/90 leading-relaxed">{ins.impact}</p>
                        </div>
                      )}
                      {ins.recommendation && (
                        <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                            <Target className="h-3 w-3" /> Recomendação
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">{ins.recommendation}</p>
                        </div>
                      )}
                      {ins.narrative && !ins.situation && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{ins.narrative}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        {ins.cohort && <span>👥 {ins.cohort}</span>}
                        {ins.confidence && <span>· {confidenceLabel[ins.confidence] || `Confiança: ${ins.confidence}`}</span>}
                        {ins.evidence && <span>· {ins.evidence}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ainda não há dados suficientes para gerar insights confiáveis. Tente novamente após novos registros.
              </CardContent>
            </Card>
          )}

          {/* Ações prioritárias */}
          {data.priority_actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Ações prioritárias para os próximos 15 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {data.priority_actions.map((a, i) => {
                    const how = Array.isArray(a.how) ? a.how : (a.how ? [a.how] : []);
                    return (
                      <li key={i} className="flex gap-4 rounded-xl border border-border/60 p-4 hover:border-primary/40 transition-colors">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm sm:text-base leading-snug">{a.title}</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {a.owner && (
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                  <UserCog className="h-3 w-3" /> {a.owner}
                                </Badge>
                              )}
                              {a.timeframe && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Clock className="h-3 w-3" /> {a.timeframe}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {a.why && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium text-foreground/80">Por quê:</span> {a.why}
                            </p>
                          )}
                          {how.length > 0 && (
                            <ul className="text-xs sm:text-sm space-y-1">
                              {how.map((step, j) => (
                                <li key={j} className="flex gap-2 text-foreground/80">
                                  <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {a.cta_label && (
                            <div className="pt-1">
                              <Button size="sm" variant="outline" onClick={() => scrollToTab(a.cta_target)}>
                                {a.cta_label} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )}

          {data.generated_at && (
            <p className="text-xs text-muted-foreground text-center">
              Gerado em {new Date(data.generated_at).toLocaleString('pt-BR')} · atualizado a cada 24h
            </p>
          )}
        </>
      )}
    </div>
  );
}
