import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, Zap, Target, Tag, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattedAIContent } from './FormattedAIContent';

interface StructuredInsightViewProps {
  content: string;
  className?: string;
}

interface InsightJson {
  summary?: string;
  positive_patterns?: string[];
  attention_points?: string[];
  possible_triggers?: string[];
  suggested_actions?: string[];
  detected_themes?: string[];
  risk_level?: string;
  confidence?: string;
}

const RISK_LABEL: Record<string, string> = {
  low: 'Risco baixo',
  attention: 'Atenção',
  medium: 'Risco médio',
  high: 'Risco alto',
  critical: 'Risco crítico',
};

const RISK_CLASSES: Record<string, string> = {
  low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  attention: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  medium: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  high: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  critical: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  low: 'Confiança baixa',
  medium: 'Confiança média',
  high: 'Confiança alta',
};

function tryParse(content: string): InsightJson | null {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const hasKnown =
        'summary' in parsed ||
        'positive_patterns' in parsed ||
        'attention_points' in parsed ||
        'possible_triggers' in parsed ||
        'suggested_actions' in parsed;
      if (hasKnown) return parsed as InsightJson;
    }
  } catch {
    return null;
  }
  return null;
}

interface SectionProps {
  title: string;
  items?: string[];
  icon: React.ReactNode;
  accent: string; // e.g. 'text-emerald-600'
  numbered?: boolean;
}

const Section = ({ title, items, icon, accent, numbered }: SectionProps) => {
  if (!items || items.length === 0) return null;
  const ListTag = numbered ? 'ol' : 'ul';
  return (
    <section className="space-y-2">
      <h4 className={cn('text-sm font-semibold flex items-center gap-2', accent)}>
        <span className="inline-flex items-center justify-center">{icon}</span>
        {title}
      </h4>
      <ListTag
        className={cn(
          'space-y-1.5 ml-1',
          numbered ? 'list-decimal ml-5 marker:text-primary marker:font-semibold' : 'list-none'
        )}
      >
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              'text-sm leading-relaxed text-foreground/90',
              !numbered &&
                "pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55rem] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:opacity-60"
            )}
          >
            {item}
          </li>
        ))}
      </ListTag>
    </section>
  );
};

export const StructuredInsightView = ({ content, className }: StructuredInsightViewProps) => {
  const data = tryParse(content);

  if (!data) {
    return <FormattedAIContent content={content} className={className} />;
  }

  const riskKey = (data.risk_level || '').toLowerCase();
  const confKey = (data.confidence || '').toLowerCase();

  return (
    <div className={cn('space-y-5', className)}>
      {(data.risk_level || data.confidence) && (
        <div className="flex flex-wrap gap-2">
          {data.risk_level && (
            <Badge variant="outline" className={cn('border', RISK_CLASSES[riskKey] || 'bg-muted')}>
              {RISK_LABEL[riskKey] || data.risk_level}
            </Badge>
          )}
          {data.confidence && (
            <Badge variant="outline" className="border bg-muted/40 text-foreground/80">
              <Info className="h-3 w-3 mr-1" />
              {CONFIDENCE_LABEL[confKey] || data.confidence}
            </Badge>
          )}
        </div>
      )}

      {data.summary && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground/90">{data.summary}</p>
        </div>
      )}

      <Section
        title="Padrões positivos"
        items={data.positive_patterns}
        icon={<Sparkles className="h-4 w-4" />}
        accent="text-emerald-600 dark:text-emerald-400"
      />

      <Section
        title="Pontos de atenção"
        items={data.attention_points}
        icon={<AlertCircle className="h-4 w-4" />}
        accent="text-amber-600 dark:text-amber-400"
      />

      <Section
        title="Possíveis gatilhos"
        items={data.possible_triggers}
        icon={<Zap className="h-4 w-4" />}
        accent="text-orange-600 dark:text-orange-400"
      />

      <Section
        title="Ações sugeridas"
        items={data.suggested_actions}
        icon={<Target className="h-4 w-4" />}
        accent="text-primary"
        numbered
      />

      {data.detected_themes && data.detected_themes.length > 0 && (
        <section className="space-y-2 pt-1">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
            <Tag className="h-4 w-4" />
            Temas detectados
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.detected_themes.map((theme, i) => (
              <Badge key={i} variant="secondary" className="font-normal">
                {theme}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StructuredInsightView;
