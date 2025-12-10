import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, BarChart3, Lightbulb, Link2, Clock, CheckCircle2, Loader2, Database, Timer, Info, Heart, Brain, Moon, Zap } from 'lucide-react';
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
  canUpdate?: boolean;
  hasNewData?: boolean;
  isCooldownActive?: boolean;
  cooldownRemainingMs?: number;
  newEntriesCount?: number;
}

const getTypeIcon = (type: PredictiveInsight['type']) => {
  switch (type) {
    case 'trend': return <TrendingUp className="h-5 w-5" />;
    case 'alert': return <AlertTriangle className="h-5 w-5" />;
    case 'pattern': return <BarChart3 className="h-5 w-5" />;
    case 'recommendation': return <Lightbulb className="h-5 w-5" />;
    case 'correlation': return <Link2 className="h-5 w-5" />;
    default: return <Sparkles className="h-5 w-5" />;
  }
};

const getTypeLabel = (type: PredictiveInsight['type']) => {
  switch (type) {
    case 'trend': return 'Tendência';
    case 'alert': return 'Alerta';
    case 'pattern': return 'Padrão';
    case 'recommendation': return 'Recomendação';
    case 'correlation': return 'Correlação';
    default: return type;
  }
};

const getSeverityConfig = (severity: PredictiveInsight['severity']) => {
  switch (severity) {
    case 'high': return { bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30', emoji: '🔴', label: 'Alta' };
    case 'medium': return { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30', emoji: '🟡', label: 'Média' };
    case 'low': return { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', emoji: '🟢', label: 'Baixa' };
    default: return { bg: 'bg-muted text-muted-foreground', emoji: '⚪', label: severity };
  }
};

const getTypeColor = (type: PredictiveInsight['type']) => {
  switch (type) {
    case 'trend': return 'text-blue-500';
    case 'alert': return 'text-rose-500';
    case 'pattern': return 'text-purple-500';
    case 'recommendation': return 'text-amber-500';
    case 'correlation': return 'text-cyan-500';
    default: return 'text-muted-foreground';
  }
};

const getMetricIcon = (metric: string) => {
  switch (metric?.toLowerCase()) {
    case 'mood': 
    case 'humor': 
      return <Heart className="h-4 w-4 text-pink-500" />;
    case 'anxiety': 
    case 'ansiedade': 
      return <Brain className="h-4 w-4 text-purple-500" />;
    case 'sleep': 
    case 'sono': 
      return <Moon className="h-4 w-4 text-indigo-500" />;
    case 'energy': 
    case 'energia': 
      return <Zap className="h-4 w-4 text-amber-500" />;
    default: 
      return <Sparkles className="h-4 w-4 text-primary" />;
  }
};

const formatTimeRemaining = (ms: number): string => {
  const mins = Math.ceil(ms / 60000);
  return mins <= 1 ? 'menos de 1 min' : `${mins} min`;
};

// Normalize confidence to 0-100 (handles both 0-1 and 0-100 inputs)
const normalizeConfidence = (confidence: number): number => {
  if (confidence > 1) {
    return Math.min(100, Math.round(confidence));
  }
  return Math.round(confidence * 100);
};

export const PredictiveInsightsPanel: React.FC<PredictiveInsightsPanelProps> = ({
  predictions, forecast, generatedAt, isGenerating, hasSufficientData, onGenerate,
  canUpdate = true, hasNewData = false, isCooldownActive = false, cooldownRemainingMs = 0, newEntriesCount = 0
}) => {
  const [timeRemaining, setTimeRemaining] = useState(cooldownRemainingMs);

  useEffect(() => {
    setTimeRemaining(cooldownRemainingMs);
    if (cooldownRemainingMs > 0 && isCooldownActive) {
      const interval = setInterval(() => setTimeRemaining(p => { const n = p - 1000; if (n <= 0) { clearInterval(interval); return 0; } return n; }), 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownRemainingMs, isCooldownActive]);

  const getButtonConfig = () => {
    if (isGenerating) return { text: 'Gerando...', icon: Loader2, disabled: true, variant: 'default' as const, tooltip: 'Análise em andamento' };
    if (!hasSufficientData) return { text: 'Dados insuficientes', icon: Database, disabled: true, variant: 'secondary' as const, tooltip: 'Necessário 7+ dias de registros' };
    if (!predictions.length) return { text: 'Gerar Análise', icon: Sparkles, disabled: false, variant: 'default' as const, tooltip: 'Gerar primeira análise' };
    if (hasNewData) return { text: `Atualizar (${newEntriesCount} novos)`, icon: RefreshCw, disabled: false, variant: 'default' as const, tooltip: `${newEntriesCount} novos registros`, badge: 'new' };
    if (isCooldownActive && timeRemaining > 0) return { text: `Aguarde ${formatTimeRemaining(timeRemaining)}`, icon: Timer, disabled: true, variant: 'secondary' as const, tooltip: 'Aguardando cooldown' };
    return { text: 'Atualizar', icon: RefreshCw, disabled: false, variant: 'outline' as const, tooltip: 'Gerar nova análise' };
  };

  const btnCfg = getButtonConfig();
  const BtnIcon = btnCfg.icon;

  if (!hasSufficientData) {
    return (<Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><Database className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-muted-foreground text-center max-w-md">Necessário pelo menos <strong>7 dias</strong> de dados para gerar insights.</p></CardContent></Card>);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Inteligência Medcos</h3>
            {predictions.length > 0 && !hasNewData && (<Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/10"><CheckCircle2 className="h-3 w-3" />Atualizado</Badge>)}
            {hasNewData && (<Badge className="gap-1 bg-primary text-primary-foreground"><Database className="h-3 w-3" />{newEntriesCount} novos</Badge>)}
          </div>
          {generatedAt && (<p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Última análise: {formatDistanceToNow(new Date(generatedAt), { addSuffix: true, locale: ptBR })}</p>)}
        </div>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><div><Button onClick={onGenerate} disabled={btnCfg.disabled || !canUpdate} variant={btnCfg.variant} className="gap-2 relative"><BtnIcon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />{btnCfg.text}{btnCfg.badge === 'new' && <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />}</Button></div></TooltipTrigger><TooltipContent>{btnCfg.tooltip}</TooltipContent></Tooltip></TooltipProvider>
      </div>

      {isCooldownActive && timeRemaining > 0 && !hasNewData && predictions.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1"><p className="text-xs text-muted-foreground">Próxima atualização em {formatTimeRemaining(timeRemaining)}</p><Progress value={((cooldownRemainingMs - timeRemaining) / cooldownRemainingMs) * 100} className="h-1 mt-1" /></div>
          <TooltipProvider><Tooltip><TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent className="max-w-xs">Intervalo mínimo entre análises para evitar uso desnecessário de IA.</TooltipContent></Tooltip></TooltipProvider>
        </div>
      )}

      {!predictions.length && !isGenerating ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><Sparkles className="h-12 w-12 text-primary/50 mb-4" /><p className="text-muted-foreground text-center">Clique em <strong>"Gerar Análise"</strong> para obter insights.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {predictions.map((p, i) => {
            const severityCfg = getSeverityConfig(p.severity);
            const confidence = normalizeConfidence(p.confidence);
            
            return (
              <Card key={i} className="overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${severityCfg.bg}`}>
                        <span className={getTypeColor(p.type)}>{getTypeIcon(p.type)}</span>
                      </div>
                      <div>
                        <Badge variant="secondary" className="text-xs mb-1">{getTypeLabel(p.type)}</Badge>
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          {getMetricIcon(p.metric)}
                          {p.title}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${severityCfg.bg}`}>
                      {severityCfg.emoji} {severityCfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  
                  <div className="h-px bg-border" />
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Visual confidence bar */}
                    <div className="flex items-center gap-2">
                      <Progress value={confidence} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground font-medium">{confidence}%</span>
                    </div>
                    
                    {/* Timeframe badge */}
                    {p.timeframe_days && (
                      <Badge variant="outline" className="gap-1 text-xs bg-blue-50 text-blue-600 border-blue-200">
                        📅 Próximos {p.timeframe_days} dias
                      </Badge>
                    )}
                  </div>
                  
                  {p.action_items?.length > 0 && (
                    <>
                      <div className="h-px bg-border" />
                      <div>
                        <p className="text-xs font-medium mb-2 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-amber-500" />
                          Ações sugeridas:
                        </p>
                        <ul className="space-y-1">
                          {p.action_items.map((a, j) => (
                            <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {predictions.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" /><p>Insights gerados por IA servem como suporte, não como diagnósticos definitivos.</p>
        </div>
      )}
    </div>
  );
};
