import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ComparisonTooltipProps {
  currentValue: number;
  previousValue: number;
  label: string;
  periodLabel?: string;
  invertBetter?: boolean;
  format?: (v: number) => string;
  children: React.ReactNode;
}

export function ComparisonTooltip({
  currentValue,
  previousValue,
  label,
  periodLabel,
  invertBetter = false,
  format: fmt = (v) => v.toFixed(1),
  children,
}: ComparisonTooltipProps) {
  const delta = currentValue - previousValue;
  const isPositive = delta > 0;
  const isBetter = invertBetter ? !isPositive : isPositive;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="w-[260px] p-0 border-border/60 shadow-lg">
        <div className="px-3 py-2 border-b border-border/40 bg-muted/50 rounded-t-md">
          <p className="font-semibold text-xs">{label}</p>
          {periodLabel && <p className="text-[10px] text-muted-foreground mt-0.5">{periodLabel}</p>}
        </div>
        <div className="px-3 py-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Atual:</span>
            <span className="font-medium">{fmt(currentValue)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Anterior:</span>
            <span className="font-medium">{fmt(previousValue)}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-border/30">
            <span className="text-muted-foreground">Variação:</span>
            <span className={`font-semibold ${isBetter ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {delta > 0 ? '+' : ''}{fmt(delta)}
            </span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
