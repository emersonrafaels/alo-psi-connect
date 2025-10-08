import { useEditorMetrics } from '@/hooks/useEditorMetrics';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface EditorMetricsProps {
  title: string;
  excerpt: string;
  content: string;
}

export const EditorMetrics = ({ title, excerpt, content }: EditorMetricsProps) => {
  const metrics = useEditorMetrics({ title, excerpt, content });

  const StatusIcon = ({ status }: { status: 'good' | 'warning' | 'error' }) => {
    if (status === 'good') return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    return <AlertCircle className="h-3 w-3 text-red-500" />;
  };

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    if (status === 'good') return 'text-green-600 dark:text-green-400';
    if (status === 'warning') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (status: 'good' | 'warning' | 'error') => {
    if (status === 'good') return 'bg-green-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between text-sm">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Métricas do Post
        </h3>
        <Badge variant="secondary">
          ~{metrics.readTimeMinutes} min de leitura
        </Badge>
      </div>

      {/* Title Metrics */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <StatusIcon status={metrics.titleStatus} />
            <span className="text-muted-foreground">Título</span>
          </div>
          <span className={cn("font-medium", getStatusColor(metrics.titleStatus))}>
            {metrics.titleLength}/60
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all", getProgressColor(metrics.titleStatus))}
            style={{ width: `${Math.min((metrics.titleLength / 60) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Excerpt Metrics */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <StatusIcon status={metrics.excerptStatus} />
            <span className="text-muted-foreground">Resumo</span>
          </div>
          <span className={cn("font-medium", getStatusColor(metrics.excerptStatus))}>
            {metrics.excerptLength}/160
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all", getProgressColor(metrics.excerptStatus))}
            style={{ width: `${Math.min((metrics.excerptLength / 160) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Content Metrics */}
      <div className="flex items-center justify-between text-xs pt-2 border-t">
        <div className="flex items-center gap-1">
          <StatusIcon status={metrics.contentStatus} />
          <span className="text-muted-foreground">Conteúdo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("font-medium", getStatusColor(metrics.contentStatus))}>
            {metrics.contentWords} palavras
          </span>
          <span className="text-muted-foreground">
            {metrics.contentCharacters} caracteres
          </span>
        </div>
      </div>

      {/* SEO Warnings */}
      {(metrics.titleStatus !== 'good' || metrics.excerptStatus !== 'good' || metrics.contentStatus !== 'good') && (
        <div className="pt-2 border-t space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Recomendações SEO:</p>
          {metrics.titleStatus === 'error' && metrics.titleLength === 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">• Adicione um título</p>
          )}
          {metrics.titleStatus === 'error' && metrics.titleLength > 60 && (
            <p className="text-xs text-red-600 dark:text-red-400">• Título muito longo (máx 60 caracteres)</p>
          )}
          {metrics.titleStatus === 'warning' && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">• Título curto (ideal: 30-60 caracteres)</p>
          )}
          {metrics.excerptStatus === 'warning' && metrics.excerptLength === 0 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">• Adicione um resumo para melhor compartilhamento</p>
          )}
          {metrics.excerptStatus === 'error' && (
            <p className="text-xs text-red-600 dark:text-red-400">• Resumo muito longo (máx 160 caracteres)</p>
          )}
          {metrics.contentStatus === 'warning' && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">• Conteúdo curto (mínimo recomendado: 300 palavras)</p>
          )}
        </div>
      )}
    </div>
  );
};
