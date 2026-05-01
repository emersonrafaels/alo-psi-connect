import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { CONFIDENCE_META, type InsightConfidence } from '@/utils/moodInsightHelpers';

interface ConfidenceBadgeProps {
  confidence: InsightConfidence;
  entriesCount?: number;
}

export const ConfidenceBadge = ({ confidence, entriesCount }: ConfidenceBadgeProps) => {
  const meta = CONFIDENCE_META[confidence];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${meta.badgeClass} flex items-center gap-1 cursor-help`}>
            <Info className="h-3 w-3" />
            Confiança: {meta.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{meta.description}</p>
          {typeof entriesCount === 'number' && (
            <p className="text-xs mt-1 text-muted-foreground">Baseado em {entriesCount} registro{entriesCount !== 1 ? 's' : ''}.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
