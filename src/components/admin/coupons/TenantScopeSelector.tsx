import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  selectedTenantId: string | null;
  tenants: Array<{ id: string; name: string; slug: string }>;
  onChange: (tenantId: string | null) => void;
}

export const TenantScopeSelector = ({ selectedTenantId, tenants, onChange }: Props) => {
  const isAllSelected = selectedTenantId === null;
  
  return (
    <div className="space-y-2">
      {/* Opção: Todos os Sites */}
      <label 
        className={cn(
          "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
          isAllSelected 
            ? "border-primary bg-primary/5 ring-1 ring-primary" 
            : "hover:bg-muted/50"
        )}
        onClick={() => onChange(null)}
      >
        <div className={cn(
          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
          isAllSelected ? "border-primary" : "border-muted-foreground"
        )}>
          {isAllSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
        </div>
        <Globe className={cn("h-4 w-4", isAllSelected ? "text-primary" : "text-muted-foreground")} />
        <span className="font-medium">Todos os Sites</span>
        <Badge variant="secondary" className="ml-auto">Global</Badge>
      </label>
      
      {/* Opções: Cada Tenant */}
      {tenants.map((t) => {
        const isSelected = selectedTenantId === t.id;
        return (
          <label 
            key={t.id} 
            className={cn(
              "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
              isSelected 
                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                : "hover:bg-muted/50"
            )}
            onClick={() => onChange(t.id)}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              isSelected ? "border-primary" : "border-muted-foreground"
            )}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <Building2 className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
            <span className="font-medium">{t.name}</span>
            <Badge variant="outline" className="ml-auto">{t.slug}</Badge>
          </label>
        );
      })}
    </div>
  );
};
