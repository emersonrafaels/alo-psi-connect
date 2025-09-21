import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, AlertCircle, User, UserCheck } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAIInsights';

interface MoodEntry {
  date: string;
  mood_score: number;
  energy_level: number;
  anxiety_level: number;
  sleep_hours: number;
  sleep_quality: number;
  journal_text?: string;
  tags?: string[];
}

interface AIInsightsCardProps {
  moodEntries: MoodEntry[];
  className?: string;
}

export const AIInsightsCard = ({ moodEntries, className }: AIInsightsCardProps) => {
  const {
    insights,
    loading,
    error,
    currentUsage,
    limit,
    limitReached,
    generateInsights,
    clearInsights,
    isGuest
  } = useAIInsights();

  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerateInsights = async () => {
    await generateInsights(moodEntries);
    setHasGenerated(true);
  };

  const handleClearInsights = () => {
    clearInsights();
    setHasGenerated(false);
  };

  const remainingUses = Math.max(0, limit - currentUsage);
  const canGenerate = !limitReached && remainingUses > 0 && moodEntries.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Insights de IA</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isGuest ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Guest
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Logado
              </Badge>
            )}
            <Badge variant="secondary">
              {remainingUses}/{limit} restantes
            </Badge>
          </div>
        </div>
        <CardDescription>
          Obtenha análises personalizadas dos seus dados emocionais usando inteligência artificial.
          {isGuest && ' Faça login para ter mais insights mensais!'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage Information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isGuest ? 'Insights por sessão' : 'Insights este mês'}: {currentUsage}/{limit}
          </span>
          {isGuest && (
            <span className="text-xs">Limite reinicia ao limpar navegador</span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentUsage / limit) * 100}%` }}
          />
        </div>

        {/* Error Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Limit Reached Message */}
        {limitReached && !error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isGuest 
                ? `Você atingiu o limite de ${limit} insights por sessão. Faça login para ter ${limit * 2} insights mensais!`
                : `Você atingiu o limite de ${limit} insights por mês. Aguarde o próximo mês para gerar novos insights.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* No Data Message */}
        {moodEntries.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você precisa ter dados no seu diário emocional para gerar insights.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateInsights}
            disabled={!canGenerate || loading}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Gerando...' : 'Gerar Insights'}
          </Button>

          {hasGenerated && insights && (
            <Button
              variant="outline"
              onClick={handleClearInsights}
              className="flex items-center gap-2"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Insights Display */}
        {insights && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Seus Insights Personalizados</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {insights}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Insights gerados por IA • Não substitui orientação profissional
              </div>
            </div>
          </>
        )}

        {/* Suggestions for Improvement */}
        {!insights && !loading && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">💡 Dicas para melhores insights:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Tenha pelo menos 3-5 entradas no diário</li>
              <li>• Inclua anotações pessoais nas suas entradas</li>
              <li>• Use tags para categorizar seus sentimentos</li>
              <li>• Seja consistente com os dados de sono e humor</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};