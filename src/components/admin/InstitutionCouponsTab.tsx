import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstitutionCoupons } from '@/hooks/useInstitutionCoupons';
import { LayoutGrid, Table as TableIcon, TrendingUp, Ticket, Search } from 'lucide-react';
import { CouponsCardView } from './coupons/CouponsCardView';
import { CouponsTableView } from './coupons/CouponsTableView';
import { CouponsAnalyticsView } from './coupons/CouponsAnalyticsView';

interface Props {
  institutionId: string;
  institutionName: string;
  tenantId?: string;
}

type ViewMode = 'cards' | 'table' | 'analytics';
type StatusFilter = 'all' | 'active' | 'inactive' | 'expired';

const getStatusFilter = (coupon: any, filter: StatusFilter): boolean => {
  if (filter === 'all') return true;
  
  const now = new Date();
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
  const isExpired = validUntil && validUntil < now;
  const isMaxedOut = coupon.maximum_uses && coupon.current_usage_count >= coupon.maximum_uses;
  
  if (filter === 'active') return coupon.is_active && !isExpired && !isMaxedOut;
  if (filter === 'inactive') return !coupon.is_active;
  if (filter === 'expired') return isExpired || isMaxedOut;
  
  return false;
};

export const InstitutionCouponsTab = ({ institutionId, institutionName, tenantId }: Props) => {
  const { coupons, couponUsage, isLoading } = useInstitutionCoupons(institutionId, tenantId);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      const matchesSearch = 
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = getStatusFilter(coupon, filterStatus);
      
      return matchesSearch && matchesStatus;
    });
  }, [coupons, filterStatus, searchQuery]);

  const couponStats = useMemo(() => {
    const activeCoupons = coupons.filter(c => getStatusFilter(c, 'active'));
    const totalUsages = couponUsage.length;
    const totalDiscountGiven = couponUsage.reduce((sum, usage) => sum + Number(usage.discount_amount || 0), 0);
    
    return {
      totalActive: activeCoupons.length,
      totalUsages,
      totalDiscountGiven,
      avgDiscountPerUse: totalUsages > 0 ? totalDiscountGiven / totalUsages : 0,
    };
  }, [coupons, couponUsage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cupons Promocionais</h2>
          <p className="text-muted-foreground">
            Gerencie e acompanhe os cupons de {institutionName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'cards' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('cards')}
            title="Visualização em Cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
            title="Visualização em Tabela"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('analytics')}
            title="Analytics"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por código ou nome..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cupons</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conteúdo baseado na visualização */}
      {viewMode === 'cards' && <CouponsCardView coupons={filteredCoupons} />}
      {viewMode === 'table' && <CouponsTableView coupons={filteredCoupons} />}
      {viewMode === 'analytics' && (
        <CouponsAnalyticsView 
          coupons={coupons} 
          couponUsage={couponUsage}
          stats={couponStats}
        />
      )}

      {/* Empty state */}
      {!isLoading && filteredCoupons.length === 0 && viewMode !== 'analytics' && (
        <Card className="py-16">
          <CardContent className="text-center">
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cupom encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro cupom para começar'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
