import { useState } from 'react';
import { InstitutionMoodAggregates } from '@/components/institutional/InstitutionMoodAggregates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  LineChart as LineChartIcon,
  Layers,
  Sparkles,
  ChevronDown,
  BarChart3,
  Calendar,
  Lightbulb,
  Activity,
  HelpCircle,
  ClipboardList,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInstitutionWellbeing } from '@/hooks/useInstitutionWellbeing';
import { usePredictiveInsights } from '@/hooks/usePredictiveInsights';
import { LGPDNotice } from './LGPDNotice';
import { WellbeingTimelineCharts } from './WellbeingTimelineCharts';
import { WellbeingInsights } from './WellbeingInsights';
import { WellbeingLayeredChart } from './WellbeingLayeredChart';
import { PredictiveInsightsPanel } from './PredictiveInsightsPanel';
import { WellbeingMetricDialog, type WellbeingMetricType } from './WellbeingMetricDialog';

interface InstitutionWellbeingDashboardProps {
  institutionId: string;
  onNavigateToTriage?: () => void;
}

const metricOptions = {
  mood: { label: 'Humor médio', key: 'avg_mood' as const, color: 'hsl(var(--chart-2))' },
  anxiety: { label: 'Ansiedade média', key: 'avg_anxiety' as const, color: 'hsl(var(--chart-3))' },
  energy: { label: 'Energia média', key: 'avg_energy' as const, color: 'hsl(var(--chart-4))' },
  sleep: { label: 'Sono médio', key: 'avg_sleep' as const, color: 'hsl(var(--chart-5))' },
};

type MetricKey = keyof typeof metricOptions;

export const InstitutionWellbeingDashboard = ({ institutionId, onNavigateToTriage }: InstitutionWellbeingDashboardProps) => {
  const [periodDays, setPeriodDays] = useState(90);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [lgpdOpen, setLgpdOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('mood');
  const [openMetric, setOpenMetric] = useState<WellbeingMetricType | null>(null);
  const { data: metrics, isLoading } = useInstitutionWellbeing(institutionId, periodDays);

  const activeNotes = metrics?.activeNotes || [];

  const {
    predictions,
    forecast,
    generatedAt,
    isGenerating,
    hasSufficientData,
    generatePredictions,
  } = usePredictiveInsights(
    institutionId,
    metrics?.daily_entries || [],
    metrics,
    activeNotes.map(n => ({ title: n.title, content: n.content, note_type: n.note_type, start_date: n.start_date, end_date: n.end_date }))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics || metrics.total_entries === 0) {
    const hasDataElsewhere = metrics?.availableDataRange;
    return (
      <div className="space-y-6">
        <LGPDNotice />
        <Card>
          <CardContent className="py-12 text-center">
            {hasDataElsewhere ? (
              <>
                <Calendar className="h-12 w-12 mx-auto text-amber-500/70 mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum registro no período selecionado</p>
                <p className="text-muted-foreground mb-4">
                  Existem registros entre{' '}
                  <span className="font-medium text-foreground">
                    {new Date(hasDataElsewhere.oldest + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>{' '}
                  e{' '}
                  <span className="font-medium text-foreground">
                    {new Date(hasDataElsewhere.newest + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </p>
                <button
                  onClick={() => setPeriodDays(9999)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Ver todo o período
                </button>
              </>
            ) : (
              <>
                <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
                <p className="text-muted-foreground">
                  Ainda não há registros de diários emocionais dos alunos vinculados.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const MetricTooltip = ({ text }: { text: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  );

  const trendLabel =
    metrics.mood_trend === 'up' ? 'Em melhora' : metrics.mood_trend === 'down' ? 'Em queda' : 'Estável';
  const changePct = metrics.period_comparison?.change_percent ?? 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* LGPD colapsável no topo */}
        <Collapsible open={lgpdOpen} onOpenChange={setLgpdOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <span>Como protegemos a privacidade dos alunos</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${lgpdOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <LGPDNotice />
          </CollapsibleContent>
        </Collapsible>

        {/* 1. HEADER — período apenas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Diário Emocional dos Alunos</h2>
            <p className="text-sm text-muted-foreground">Visão institucional agregada e protegida por privacidade.</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={periodDays.toString()} onValueChange={(v) => setPeriodDays(Number(v))}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
                <SelectItem value="9999">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2. RESUMO ANONIMIZADO */}
        <InstitutionMoodAggregates institutionId={institutionId} />

        {/* 3. ALERTA ACIONÁVEL */}
        {metrics.students_with_low_mood > 0 ? (
          <Alert variant="destructive" className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-700 dark:text-orange-400">Atenção Necessária</AlertTitle>
            <AlertDescription className="text-orange-600/80 dark:text-orange-300/80">
              <div className="space-y-3">
                <div>
                  <strong>{metrics.students_with_low_mood}</strong> aluno{metrics.students_with_low_mood > 1 ? 's' : ''} reportaram humor abaixo de 3 nos últimos {periodDays} dias.
                  <br />
                  <span className="text-sm">Considere ações de acolhimento e suporte emocional.</span>
                </div>
                {onNavigateToTriage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-500/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/40"
                    onClick={onNavigateToTriage}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Ver triagem
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 dark:text-green-400">Tudo bem por aqui</AlertTitle>
            <AlertDescription className="text-green-600/80 dark:text-green-300/80">
              Nenhum alerta identificado. Os indicadores de bem-estar estão dentro dos parâmetros saudáveis.
            </AlertDescription>
          </Alert>
        )}

        {/* 4. CONTEXTO INSTITUCIONAL */}
        {activeNotes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeNotes.map(note => {
              const typeConfig: Record<string, { icon: string; bg: string; border: string }> = {
                event: { icon: '📅', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800' },
                alert: { icon: '🚨', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800' },
                reminder: { icon: '🔔', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800' },
                info: { icon: 'ℹ️', bg: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-800' },
              };
              const config = typeConfig[note.note_type] || typeConfig.info;
              const dateRange = note.start_date && note.end_date
                ? `${new Date(note.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(note.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}`
                : '';
              return (
                <div key={note.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${config.bg} ${config.border}`}>
                  <span>{config.icon}</span>
                  <span className="font-medium">{note.title}</span>
                  {dateRange && <span className="text-muted-foreground text-xs">({dateRange})</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* 5. ENGAJAMENTO DO PERÍODO */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Engajamento</CardTitle>
            </div>
            <CardDescription>Quantos alunos estão usando o diário?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-2 mb-6">
              <button type="button" onClick={() => setOpenMetric('participants')} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left focus:outline-none focus:ring-2 focus:ring-ring">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.students_with_entries}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Participantes
                    <MetricTooltip text="Quantidade de alunos que registraram pelo menos um diário emocional no período selecionado." />
                  </p>
                </div>
              </button>

              <button type="button" onClick={() => setOpenMetric('entries')} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left focus:outline-none focus:ring-2 focus:ring-ring">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.total_entries}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Registros
                    <MetricTooltip text="Total de diários emocionais preenchidos por todos os alunos no período. Quanto mais registros, mais confiável a análise." />
                  </p>
                </div>
              </button>
            </div>

            {metrics.daily_entries && metrics.daily_entries.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Registros por dia</p>
                <ChartContainer config={{ count: { label: "Diários", color: "hsl(var(--primary))" } }} className="h-[200px] w-full">
                  <BarChart data={metrics.daily_entries.map(e => ({
                    date: new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    count: e.entries_count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={3} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. EVOLUÇÃO EMOCIONAL */}
        {metrics.daily_entries && metrics.daily_entries.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>Evolução emocional</CardTitle>
                  </div>
                  <CardDescription>O clima está melhorando ou piorando?</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted">
                    {getTrendIcon(metrics.mood_trend)}
                    <span className="text-sm font-medium">{trendLabel}</span>
                    <Badge variant="outline" className="ml-1 text-xs">
                      {changePct > 0 ? '+' : ''}{changePct}%
                    </Badge>
                  </div>
                  <Select value={selectedMetric} onValueChange={(v: MetricKey) => setSelectedMetric(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mood">Humor médio</SelectItem>
                      <SelectItem value="anxiety">Ansiedade média</SelectItem>
                      <SelectItem value="energy">Energia média</SelectItem>
                      <SelectItem value="sleep">Sono médio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ value: { label: metricOptions[selectedMetric].label, color: metricOptions[selectedMetric].color } }} className="h-[240px] w-full">
                <BarChart data={metrics.daily_entries.map(e => {
                  const raw = e[metricOptions[selectedMetric].key];
                  return {
                    date: new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    value: raw ? Number(Number(raw).toFixed(1)) : 0
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 5]} />
                  {selectedMetric === 'mood' && (
                    <ReferenceLine y={3} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: "Alerta", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                  )}
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={metricOptions[selectedMetric].color} radius={3} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* 7. INSIGHTS INTELIGENTES */}
        {metrics.insights && metrics.insights.length > 0 && (
          <Card>
            <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      <CardTitle>Insights Inteligentes</CardTitle>
                      <Badge variant="secondary" className="ml-2">
                        {metrics.insights.length}
                      </Badge>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${insightsOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <CardDescription>O que o sistema já percebeu por você.</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <WellbeingInsights insights={metrics.insights} />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* 8. ANÁLISE VISUAL */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              <CardTitle>Análise visual</CardTitle>
            </div>
            <CardDescription>Explore a evolução do bem-estar em diferentes recortes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="charts" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid mb-4">
                <TabsTrigger value="charts" className="gap-2">
                  <LineChartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Evolução</span>
                </TabsTrigger>
                <TabsTrigger value="layered" className="gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Multi-Camadas</span>
                </TabsTrigger>
                <TabsTrigger value="predictive" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Inteligência MEDCOS</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="charts" className="mt-0">
                <WellbeingTimelineCharts
                  dailyEntries={metrics.daily_entries || []}
                  periodDays={periodDays}
                  onPeriodChange={setPeriodDays}
                  avgMood={metrics.avg_mood_score}
                  avgAnxiety={metrics.avg_anxiety_level}
                />
              </TabsContent>

              <TabsContent value="layered" className="mt-0">
                <WellbeingLayeredChart
                  dailyEntries={metrics.daily_entries || []}
                  predictions={forecast}
                  avgMood={metrics.avg_mood_score}
                  avgAnxiety={metrics.avg_anxiety_level}
                />
              </TabsContent>

              <TabsContent value="predictive" className="mt-0">
                <PredictiveInsightsPanel
                  predictions={predictions}
                  forecast={forecast}
                  generatedAt={generatedAt}
                  isGenerating={isGenerating}
                  hasSufficientData={hasSufficientData}
                  onGenerate={generatePredictions}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <WellbeingMetricDialog
          type={openMetric}
          open={!!openMetric}
          onOpenChange={(o) => !o && setOpenMetric(null)}
          metrics={metrics}
          periodDays={periodDays}
        />
      </div>
    </TooltipProvider>
  );
};
