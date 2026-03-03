import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Heart,
  Brain,
  Moon,
  Zap,
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
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInstitutionWellbeing, type ActiveInstitutionNote } from '@/hooks/useInstitutionWellbeing';
import { usePredictiveInsights } from '@/hooks/usePredictiveInsights';
import { LGPDNotice } from './LGPDNotice';
import { WellbeingTimelineCharts } from './WellbeingTimelineCharts';
import { WellbeingInsights } from './WellbeingInsights';
import { WellbeingLayeredChart } from './WellbeingLayeredChart';
import { PredictiveInsightsPanel } from './PredictiveInsightsPanel';

interface InstitutionWellbeingDashboardProps {
  institutionId: string;
}

export const InstitutionWellbeingDashboard = ({ institutionId }: InstitutionWellbeingDashboardProps) => {
  const [periodDays, setPeriodDays] = useState(90);
  const [insightsOpen, setInsightsOpen] = useState(true);
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
    // Check if there's data available in another period
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

  const getMoodColor = (score: number | null) => {
    if (score === null) return 'bg-muted';
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMoodLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 4) return 'Bom';
    if (score >= 3) return 'Moderado';
    return 'Baixo';
  };

  // Calculate overall status
  const getOverallStatus = () => {
    if (metrics.students_with_low_mood > 0 || (metrics.avg_mood_score && metrics.avg_mood_score < 2.5)) {
      return { status: 'alert', label: 'Alerta', variant: 'destructive' as const };
    }
    if (metrics.avg_mood_score && metrics.avg_mood_score < 3.5) {
      return { status: 'warning', label: 'Atenção Necessária', variant: 'secondary' as const };
    }
    return { status: 'good', label: 'Bem-estar Saudável', variant: 'default' as const };
  };

  const overallStatus = getOverallStatus();

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

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-8">
      {/* Header with Period Selector and Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant={overallStatus.variant} className="text-sm px-3 py-1">
            {overallStatus.status === 'good' && '✅ '}
            {overallStatus.status === 'warning' && '⚠️ '}
            {overallStatus.status === 'alert' && '🔴 '}
            {overallStatus.label}
          </Badge>
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

      {/* Status Cards - Condicional (antes do LGPD Notice) */}
      {metrics.students_with_low_mood > 0 ? (
        <Alert variant="destructive" className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-700 dark:text-orange-400">Atenção Necessária</AlertTitle>
          <AlertDescription className="text-orange-600/80 dark:text-orange-300/80">
            <strong>{metrics.students_with_low_mood}</strong> aluno(s) reportaram humor abaixo de 3 nos últimos {periodDays} dias.
            <br />
            <span className="text-sm">
              Considere ações de acolhimento e suporte emocional.
            </span>
          </AlertDescription>
        </Alert>
      ) : overallStatus.status === 'good' ? (
        <Alert className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-400">Tudo Bem por Aqui! ✨</AlertTitle>
          <AlertDescription className="text-green-600/80 dark:text-green-300/80">
            Nenhum alerta identificado. Os indicadores de bem-estar estão dentro dos parâmetros saudáveis.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* LGPD Notice - Colapsável */}
      <LGPDNotice />

      {/* Contexto Institucional - Notas Ativas */}
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

      {/* Seção: Visão Geral */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Visão Geral</CardTitle>
          </div>
          <CardDescription>
            {periodDays >= 9999 && metrics.daily_entries && metrics.daily_entries.length > 0
              ? `Participação e engajamento considerando todo o período (primeiro diário emocional registrado em ${new Date(metrics.daily_entries[0].date + 'T12:00:00').toLocaleDateString('pt-BR')})`
              : `Participação e engajamento nos últimos ${periodDays} dias`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.students_with_entries}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">Participantes <MetricTooltip text="Quantidade de alunos que registraram pelo menos um diário emocional no período selecionado." /></p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.total_entries}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">Registros <MetricTooltip text="Total de diários emocionais preenchidos por todos os alunos no período. Quanto mais registros, mais confiável a análise." /></p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className={`p-3 rounded-full ${metrics.mood_trend === 'up' ? 'bg-green-100 dark:bg-green-900/30' : metrics.mood_trend === 'down' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'}`}>
                {getTrendIcon(metrics.mood_trend)}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {metrics.mood_trend === 'up' ? 'Em melhora' : metrics.mood_trend === 'down' ? 'Em queda' : 'Estável'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">Tendência <MetricTooltip text="Compara a média de humor da primeira metade do período com a segunda metade. 'Em melhora' significa que o humor médio subiu, 'Em queda' que diminuiu." /></p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className={`p-3 rounded-full ${metrics.students_with_low_mood > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <AlertTriangle className={`h-5 w-5 ${metrics.students_with_low_mood > 0 ? 'text-orange-500' : 'text-green-500'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.students_with_low_mood}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">Alertas <MetricTooltip text="Número de alunos com humor médio abaixo de 3 (em uma escala de 1 a 5). Esses alunos podem precisar de acolhimento." /></p>
              </div>
            </div>
          </div>

          {/* Gráficos inline */}
          {metrics.daily_entries && metrics.daily_entries.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm font-medium mb-2">Registros por dia</p>
                <ChartContainer config={{ count: { label: "Diários", color: "hsl(var(--primary))" } }} className="h-[180px] w-full">
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
              <div>
                <p className="text-sm font-medium mb-2">Humor médio por dia</p>
                <ChartContainer config={{ mood: { label: "Humor médio", color: "hsl(var(--chart-2))" } }} className="h-[180px] w-full">
                  <BarChart data={metrics.daily_entries.map(e => ({
                    date: new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    mood: e.avg_mood ? Number(e.avg_mood.toFixed(1)) : 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 5]} />
                    <ReferenceLine y={3} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: "Alerta", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="mood" fill="hsl(var(--chart-2))" radius={3} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção: Métricas de Bem-Estar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Métricas de Bem-Estar</CardTitle>
          </div>
          <CardDescription>Indicadores agregados do período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">Humor Médio <MetricTooltip text="Média geral de como os alunos avaliaram seu humor (1=muito mal, 5=muito bem). Acima de 3.5 é considerado saudável." /></span>
                <Heart className={`h-5 w-5 ${getMoodColor(metrics.avg_mood_score).replace('bg-', 'text-')}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {metrics.avg_mood_score?.toFixed(1) || 'N/A'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {getMoodLabel(metrics.avg_mood_score)}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(metrics.mood_trend)}
                <span className="text-xs text-muted-foreground">
                  {metrics.period_comparison.change_percent > 0 ? '+' : ''}
                  {metrics.period_comparison.change_percent}%
                </span>
              </div>
              <Progress
                value={(metrics.avg_mood_score || 0) * 20}
                className={`h-1.5 mt-2 ${getMoodColor(metrics.avg_mood_score)}`}
              />
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">Ansiedade <MetricTooltip text="Nível médio de ansiedade reportado (1=tranquilo, 5=muito ansioso). Valores acima de 3.5 merecem atenção." /></span>
                <Brain className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-2xl font-bold">
                {metrics.avg_anxiety_level?.toFixed(1) || 'N/A'}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Média (1-5)
              </p>
              <Progress
                value={(metrics.avg_anxiety_level || 0) * 20}
                className="h-1.5 mt-2"
              />
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">Qualidade do Sono <MetricTooltip text="Como os alunos avaliaram seu sono (1=péssimo, 5=ótimo). Sono ruim costuma afetar humor e concentração." /></span>
                <Moon className="h-5 w-5 text-indigo-500" />
              </div>
              <span className="text-2xl font-bold">
                {metrics.avg_sleep_quality?.toFixed(1) || 'N/A'}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Média (1-5)
              </p>
              <Progress
                value={(metrics.avg_sleep_quality || 0) * 20}
                className="h-1.5 mt-2"
              />
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">Energia <MetricTooltip text="Nível médio de energia dos alunos (1=sem energia, 5=muita energia). Valores baixos podem indicar cansaço ou desmotivação." /></span>
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              <span className="text-2xl font-bold">
                {metrics.avg_energy_level?.toFixed(1) || 'N/A'}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Média (1-5)
              </p>
              <Progress
                value={(metrics.avg_energy_level || 0) * 20}
                className="h-1.5 mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção: Insights Inteligentes - Recolhível */}
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
                <CardDescription>Padrões identificados automaticamente</CardDescription>
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

      {/* Seção: Análise Visual */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            <CardTitle>Análise Visual</CardTitle>
          </div>
          <CardDescription>Visualize a evolução do bem-estar ao longo do tempo</CardDescription>
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
    </div>
    </TooltipProvider>
  );
};
