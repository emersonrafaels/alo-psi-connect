import { HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FieldWithTooltipProps {
  htmlFor?: string;
  label: string;
  tooltip: string;
  required?: boolean;
  children?: React.ReactNode;
}

export const FieldWithTooltip = ({ 
  htmlFor, 
  label, 
  tooltip, 
  required = false,
  children 
}: FieldWithTooltipProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {children}
    </div>
  );
};
