import React from 'react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface FieldWithTooltipProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
}

export const FieldWithTooltip = ({ label, tooltip, children }: FieldWithTooltipProps) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-2">
      {label}
      <Tooltip>
        <TooltipTrigger 
          type="button" 
          className="cursor-help" 
          onClick={(e) => e.preventDefault()}
        >
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </Label>
    {children}
  </div>
);
