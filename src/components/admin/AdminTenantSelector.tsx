import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAdminTenant } from '@/contexts/AdminTenantContext';

export const AdminTenantSelector = () => {
  const { selectedTenantId, setSelectedTenantId, tenants, loading } = useAdminTenant();

  if (loading) {
    return null;
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  const getBadgeVariant = (slug: string) => {
    if (slug === 'alopsi') return 'default';
    if (slug === 'medcos') return 'secondary';
    return 'outline';
  };

  const getBadgeColor = (slug: string) => {
    if (slug === 'alopsi') return 'bg-green-100 text-green-700 hover:bg-green-100';
    if (slug === 'medcos') return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
    return '';
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            {selectedTenantId === 'all' ? (
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="bg-muted">
                  Todos os Sites
                </Badge>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Badge 
                  variant={getBadgeVariant(selectedTenant?.slug || '')}
                  className={getBadgeColor(selectedTenant?.slug || '')}
                >
                  {selectedTenant?.name}
                </Badge>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex flex-col gap-1">
              <span className="font-medium">🌐 Todos os Sites</span>
              <span className="text-xs text-muted-foreground">Estatísticas agregadas</span>
            </div>
          </SelectItem>
          
          <div className="my-1 border-t" />
          
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex flex-col gap-1">
                <span className="font-medium flex items-center gap-2">
                  {tenant.slug === 'alopsi' && '🟢'}
                  {tenant.slug === 'medcos' && '🔵'}
                  {tenant.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tenant.slug === 'alopsi' && '✓ Site principal'}
                  {tenant.slug === 'medcos' && '✓ Site parceiro'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
