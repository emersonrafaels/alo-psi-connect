import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WebhookField {
  key: string;
  variable: string;
  label: string;
  description: string;
  category: 'appointment' | 'patient' | 'professional' | 'payment' | 'system';
  required?: boolean;
}

interface WebhookFieldItemProps {
  field: WebhookField;
  checked: boolean;
  onToggle: (key: string) => void;
  disabled?: boolean;
}

export const WebhookFieldItem = ({ field, checked, onToggle, disabled }: WebhookFieldItemProps) => {
  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
        checked ? "bg-accent/50 border-primary/50" : "bg-background hover:bg-accent/20",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center space-x-2">
        {!disabled && (
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        )}
        <Checkbox
          checked={checked}
          onCheckedChange={() => !disabled && onToggle(field.key)}
          disabled={disabled}
          className="mt-0.5"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium leading-none">{field.label}</p>
          {field.required && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Obrigatório
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{field.variable}</code>
      </div>
    </div>
  );
};
