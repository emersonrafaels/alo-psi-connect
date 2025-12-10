import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Brain,
  Moon,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  FileText,
} from 'lucide-react';
import { useInstitutionWellbeing } from '@/hooks/useInstitutionWellbeing';
import { LGPDNotice } from './LGPDNotice';

interface InstitutionWellbeingDashboardProps {
  institutionId: string;
}

export const InstitutionWellbeingDashboard = ({ institutionId }: InstitutionWellbeingDashboardProps) => {
  const { data: metrics, isLoading } = useInstitutionWellbeing(institutionId);

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
    return (
      <div className="space-y-6">
        <LGPDNotice />
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
            <p className="text-muted-foreground">
              Ainda não há registros de diários emocionais dos alunos vinculados.
            </p>
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

  return (
    <div className="space-y-6">
      <LGPDNotice />

      {/* Alertas */}
      {metrics.students_with_low_mood > 0 && (
        <Alert variant="destructive" className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-700 dark:text-orange-400">Atenção</AlertTitle>
          <AlertDescription className="text-orange-600/80 dark:text-orange-300/80">
            <strong>{metrics.students_with_low_mood}</strong> aluno(s) reportaram humor abaixo de 3 nos últimos 30 dias.
            <br />
            <span className="text-sm">
              Considere ações de acolhimento e suporte emocional.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas de Participação */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alunos Participantes</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.students_with_entries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Com registros nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.total_entries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Diários emocionais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Bem-Estar */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Humor Médio</CardTitle>
            <Heart className={`h-5 w-5 ${getMoodColor(metrics.avg_mood_score).replace('bg-', 'text-')}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {metrics.avg_mood_score?.toFixed(1) || 'N/A'}
              </div>
              <Badge variant="outline" className="text-xs">
                {getMoodLabel(metrics.avg_mood_score)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(metrics.mood_trend)}
              <span className="text-xs text-muted-foreground">
                {metrics.period_comparison.change_percent > 0 ? '+' : ''}
                {metrics.period_comparison.change_percent}% vs período anterior
              </span>
            </div>
            <Progress
              value={(metrics.avg_mood_score || 0) * 20}
              className={`h-1.5 mt-2 ${getMoodColor(metrics.avg_mood_score)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nível de Ansiedade</CardTitle>
            <Brain className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avg_anxiety_level?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média dos registros (1-5)
            </p>
            <Progress
              value={(metrics.avg_anxiety_level || 0) * 20}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Qualidade do Sono</CardTitle>
            <Moon className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avg_sleep_quality?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média dos registros (1-5)
            </p>
            <Progress
              value={(metrics.avg_sleep_quality || 0) * 20}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nível de Energia</CardTitle>
            <Zap className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avg_energy_level?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média dos registros (1-5)
            </p>
            <Progress
              value={(metrics.avg_energy_level || 0) * 20}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
          <CardDescription>Últimos 30 dias comparados ao período anterior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className={`p-3 rounded-full ${metrics.mood_trend === 'up' ? 'bg-green-100 dark:bg-green-900/30' : metrics.mood_trend === 'down' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'}`}>
                {getTrendIcon(metrics.mood_trend)}
              </div>
              <div>
                <p className="font-medium">Tendência de Humor</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.mood_trend === 'up' ? 'Em melhora' : metrics.mood_trend === 'down' ? 'Em queda' : 'Estável'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Engajamento</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.students_with_entries} alunos registrando
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className={`p-3 rounded-full ${metrics.students_with_low_mood > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <AlertTriangle className={`h-4 w-4 ${metrics.students_with_low_mood > 0 ? 'text-orange-500' : 'text-green-500'}`} />
              </div>
              <div>
                <p className="font-medium">Alertas</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.students_with_low_mood > 0
                    ? `${metrics.students_with_low_mood} precisam de atenção`
                    : 'Nenhum alerta'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
