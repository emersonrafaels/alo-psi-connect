import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Link2,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { PredictiveInsight, ForecastPoint } from '@/hooks/usePredictiveInsights';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PredictiveInsightsPanelProps {
  predictions: PredictiveInsight[];
  forecast: ForecastPoint[];
  generatedAt?: string;
  isGenerating: boolean;
  hasSufficientData: boolean;
  onGenerate: () => void;
}

const getTypeIcon = (type: PredictiveInsight['type']) => {
  switch (type) {
    case 'trend':
      return <TrendingUp className="h-5 w-5" />;
    case 'alert':
      return <AlertTriangle className="h-5 w-5" />;
    case 'pattern':
      return <BarChart3 className="h-5 w-5" />;
    case 'recommendation':
      return <Lightbulb className="h-5 w-5" />;
    case 'correlation':
      return <Link2 className="h-5 w-5" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
};

const getTypeLabel = (type: PredictiveInsight['type']) => {
  switch (type) {
    case 'trend':
      return 'Tendência';
    case 'alert':
      return 'Alerta';
    case 'pattern':
      return 'Padrão';
    case 'recommendation':
      return 'Recomendação';
    case 'correlation':
      return 'Correlação';
    default:
      return type;
  }
};

const getSeverityColor = (severity: PredictiveInsight['severity']) => {
  switch (severity) {
    case 'high':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    case 'medium':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'low':
      return 'bg-primary/10 text-primary border-primary/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getTypeColor = (type: PredictiveInsight['type']) => {
  switch (type) {
    case 'trend':
      return 'text-blue-500';
    case 'alert':
      return 'text-orange-500';
    case 'pattern':
      return 'text-purple-500';
    case 'recommendation':
      return 'text-green-500';
    case 'correlation':
      return 'text-cyan-500';
    default:
      return 'text-muted-foreground';
  }
};

export const PredictiveInsightsPanel = ({
  predictions,
  forecast,
  generatedAt,
  isGenerating,
  hasSufficientData,
  onGenerate,
}: PredictiveInsightsPanelProps) => {
  const timeAgo = generatedAt
    ? formatDistanceToNow(new Date(generatedAt), { addSuffix: true, locale: ptBR })
    : null;

  if (!hasSufficientData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium mb-2">Dados insuficientes</p>
          <p className="text-muted-foreground text-sm">
            São necessários ao menos 3 dias de dados para gerar análises preditivas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">Gerando Análise Preditiva...</CardTitle>
          </div>
          <CardDescription>
            A IA está analisando os padrões de bem-estar dos alunos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Insights Preditivos (ML)</CardTitle>
            {predictions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {predictions.length} insight{predictions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {timeAgo && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Gerado {timeAgo}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {predictions.length > 0 ? 'Atualizar' : 'Gerar Análise'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Previsões e padrões identificados por inteligência artificial
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {predictions.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-primary/30 mb-4" />
            <p className="text-muted-foreground mb-4">
              Clique em "Gerar Análise" para obter insights preditivos baseados em Machine Learning
            </p>
            <Button onClick={onGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar Análise Preditiva
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predictions.map((insight, index) => (
              <Card key={index} className={`border ${getSeverityColor(insight.severity)}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-2 rounded-lg bg-background ${getTypeColor(insight.type)}`}>
                      {getTypeIcon(insight.type)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(insight.type)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{insight.confidence}%</span>
                        <Progress value={insight.confidence} className="h-1 w-12" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>

                  {insight.timeframe_days && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Próximos {insight.timeframe_days} dias
                    </div>
                  )}

                  {insight.action_items && insight.action_items.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-2 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Ações Sugeridas:
                      </p>
                      <ul className="space-y-1">
                        {insight.action_items.map((action, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* AI Notice */}
        <Alert className="mt-4">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Estes insights são gerados por inteligência artificial com base nos dados disponíveis.
            Sempre valide as recomendações com profissionais qualificados antes de tomar decisões.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
