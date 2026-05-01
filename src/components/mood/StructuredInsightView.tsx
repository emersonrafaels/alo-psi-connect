import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertTriangle, Lightbulb, Target, Tag } from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { StructuredInsight } from '@/utils/moodInsightHelpers';

interface StructuredInsightViewProps {
  insight: StructuredInsight;
  entriesCount?: number;
}

export const StructuredInsightView = ({ insight, entriesCount }: StructuredInsightViewProps) => {
  const showLowConfidenceNote = insight.confidence === 'very_low' || insight.confidence === 'low';

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h4 className="text-sm font-semibold text-primary">Resumo</h4>
            <ConfidenceBadge confidence={insight.confidence} entriesCount={entriesCount} />
          </div>
          <p className="text-sm leading-relaxed">{insight.summary}</p>
          {showLowConfidenceNote && (
            <p className="text-xs text-muted-foreground italic">
              Ainda há poucos registros para conclusões mais fortes. Continue registrando para enriquecer suas análises.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Padrões positivos & atenção lado a lado */}
      <div className="grid gap-3 md:grid-cols-2">
        {insight.positive_patterns.length > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Pontos positivos
              </h4>
              <ul className="space-y-1.5">
                {insight.positive_patterns.map((p, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span aria-hidden>✅</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {insight.attention_points.length > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Pontos de atenção
              </h4>
              <ul className="space-y-1.5">
                {insight.attention_points.map((p, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span aria-hidden>⚠️</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Temas / gatilhos */}
      {(insight.detected_themes.length > 0 || insight.possible_triggers.length > 0) && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {insight.detected_themes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Temas identificados
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insight.detected_themes.map((t) => (
                    <Badge key={t} variant="secondary" className="capitalize">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {insight.possible_triggers.length > 0 && (
              <>
                {insight.detected_themes.length > 0 && <Separator />}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Possíveis gatilhos
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {insight.possible_triggers.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sugestões */}
      {insight.suggested_actions.length > 0 && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Lightbulb className="h-4 w-4" />
              Sugestões para os próximos dias
            </h4>
            <ol className="space-y-1.5 list-decimal list-inside text-sm">
              {insight.suggested_actions.map((s, i) => (
                <li key={i} className="leading-relaxed">{s}</li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground mt-2 italic">
              As sugestões são informativas e não substituem avaliação de profissionais de saúde.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
