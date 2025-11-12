import { useEditorMetrics } from '@/hooks/useEditorMetrics';
import { Clock, CheckCircle2, AlertCircle, XCircle, TrendingUp, FileText, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface EditorMetricsProps {
  title: string;
  excerpt: string;
  content: string;
}

export const EditorMetrics = ({ title, excerpt, content }: EditorMetricsProps) => {
  const {
    titleLength,
    excerptLength,
    contentWords,
    contentCharacters,
    readTimeMinutes,
    titleStatus,
    excerptStatus,
    contentStatus
  } = useEditorMetrics({ title, excerpt, content });

  const StatusIcon = ({ status }: { status: 'good' | 'warning' | 'error' }) => {
    if (status === 'good') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="h-4 w-4 text-orange-500" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-4">
      {/* Read Time Card */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo de Leitura</p>
                <p className="text-2xl font-bold text-primary">{readTimeMinutes} min</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Title Metrics Card */}
      <Card className={`border-2 ${titleStatus === 'good' ? 'border-green-500/20' : titleStatus === 'warning' ? 'border-orange-500/20' : 'border-destructive/20'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4" />
              Título
            </CardTitle>
            <StatusIcon status={titleStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{titleLength} caracteres</span>
            <Badge variant={titleStatus === 'good' ? 'default' : 'secondary'} className="text-xs">
              {titleLength}/60
            </Badge>
          </div>
          <Progress value={Math.min((titleLength / 60) * 100, 100)} className="h-2" />
          {titleStatus === 'error' && titleLength > 60 && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Título muito longo para SEO
            </p>
          )}
          {titleStatus === 'warning' && titleLength < 30 && (
            <p className="text-xs text-orange-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Título poderia ser mais descritivo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Excerpt Metrics Card */}
      <Card className={`border-2 ${excerptStatus === 'good' ? 'border-green-500/20' : excerptStatus === 'warning' ? 'border-orange-500/20' : 'border-destructive/20'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resumo
            </CardTitle>
            <StatusIcon status={excerptStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{excerptLength} caracteres</span>
            <Badge variant={excerptStatus === 'good' ? 'default' : 'secondary'} className="text-xs">
              {excerptLength}/160
            </Badge>
          </div>
          <Progress value={Math.min((excerptLength / 160) * 100, 100)} className="h-2" />
          {excerptStatus === 'error' && excerptLength > 160 && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Resumo muito longo para meta description
            </p>
          )}
          {excerptStatus === 'warning' && (
            <p className="text-xs text-orange-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Recomendado: 120-160 caracteres
            </p>
          )}
        </CardContent>
      </Card>

      {/* Content Metrics Card */}
      <Card className={`border-2 ${contentStatus === 'good' ? 'border-green-500/20' : contentStatus === 'warning' ? 'border-orange-500/20' : 'border-destructive/20'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conteúdo
            </CardTitle>
            <StatusIcon status={contentStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Palavras</p>
              <p className="text-2xl font-bold">{contentWords}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Caracteres</p>
              <p className="text-2xl font-bold">{contentCharacters.toLocaleString()}</p>
            </div>
          </div>
          {contentStatus === 'warning' && (
            <p className="text-xs text-orange-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Recomendado: mínimo 300 palavras para SEO
            </p>
          )}
          {contentStatus === 'good' && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Excelente comprimento para SEO
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
