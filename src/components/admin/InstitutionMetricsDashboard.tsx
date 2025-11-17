import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetricsCard } from '@/components/admin/config/MetricsCard';
import { UsageChart } from '@/components/admin/config/UsageChart';
import { useInstitutionMetrics } from '@/hooks/useInstitutionMetrics';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Ticket, 
  TrendingUp, 
  DollarSign,
  RefreshCw,
  Search,
  Download,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const InstitutionMetricsDashboard = () => {
  const {
    metrics,
    isLoading,
    aggregatedStats,
    typeDistribution,
    partnershipDistribution,
    topByUsers,
    topByProfessionals,
    topByCoupons,
    couponUsageRate,
    refreshMetrics,
    isRefreshing,
  } = useInstitutionMetrics();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'name' | 'users' | 'professionals' | 'coupons'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredMetrics = metrics
    .filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || m.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && m.is_active) ||
        (statusFilter === 'inactive' && !m.is_active);
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'users':
          comparison = a.total_users - b.total_users;
          break;
        case 'professionals':
          comparison = a.total_professionals - b.total_professionals;
          break;
        case 'coupons':
          comparison = a.total_active_coupons - b.total_active_coupons;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Tipo', 'Status', 'Parceria', 'Usuários', 'Profissionais', 'Cupons Ativos', 'Usos de Cupons', 'Descontos (R$)'];
    const rows = filteredMetrics.map(m => [
      m.name,
      m.type === 'public' ? 'Pública' : 'Privada',
      m.is_active ? 'Ativa' : 'Inativa',
      m.has_partnership ? 'Sim' : 'Não',
      m.total_users,
      m.total_professionals,
      m.total_active_coupons,
      m.total_coupon_uses,
      m.total_discount_given.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `metricas-instituicoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Métricas Institucionais
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Análise consolidada de todas as instituições educacionais
          </p>
        </div>
        <Button
          onClick={() => refreshMetrics()}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricsCard
          title="Instituições Ativas"
          value={aggregatedStats.totalActiveInstitutions}
          description="Total de instituições"
          icon={Building2}
        />
        <MetricsCard
          title="Total de Usuários"
          value={aggregatedStats.totalUsers.toLocaleString('pt-BR')}
          description="Em todas as instituições"
          icon={Users}
        />
        <MetricsCard
          title="Total de Profissionais"
          value={aggregatedStats.totalProfessionals.toLocaleString('pt-BR')}
          description="Vinculados às instituições"
          icon={GraduationCap}
        />
        <MetricsCard
          title="Cupons Ativos"
          value={aggregatedStats.totalActiveCoupons.toLocaleString('pt-BR')}
          description="Disponíveis para uso"
          icon={Ticket}
        />
        <MetricsCard
          title="Usos de Cupons"
          value={aggregatedStats.totalCouponUses.toLocaleString('pt-BR')}
          description="Total de utilizações"
          icon={TrendingUp}
        />
        <MetricsCard
          title="Descontos Concedidos"
          value={`R$ ${aggregatedStats.totalDiscountsGiven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Valor total economizado"
          icon={DollarSign}
        />
      </div>

      {/* Gráficos de Distribuição */}
      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          title="Instituições por Tipo"
          description="Distribuição entre públicas e privadas"
          data={typeDistribution}
          type="pie"
          dataKey="value"
          xAxisKey="name"
        />
        <UsageChart
          title="Status de Parcerias"
          description="Instituições com e sem parceria"
          data={partnershipDistribution}
          type="pie"
          dataKey="value"
          xAxisKey="name"
        />
      </div>

      {/* Rankings */}
      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          title="Top 10 por Usuários"
          description="Instituições com mais usuários cadastrados"
          data={topByUsers}
          type="bar"
          dataKey="value"
          xAxisKey="name"
          height={400}
        />
        <UsageChart
          title="Top 10 por Profissionais"
          description="Instituições com mais profissionais vinculados"
          data={topByProfessionals}
          type="bar"
          dataKey="value"
          xAxisKey="name"
          height={400}
        />
      </div>

      {/* Análise de Cupons */}
      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          title="Top 10 por Cupons Ativos"
          description="Instituições com mais cupons disponíveis"
          data={topByCoupons}
          type="bar"
          dataKey="value"
          xAxisKey="name"
          height={400}
        />
        <UsageChart
          title="Taxa de Uso de Cupons (%)"
          description="Efetividade dos cupons por instituição"
          data={couponUsageRate}
          type="area"
          dataKey="rate"
          xAxisKey="name"
          height={400}
        />
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhamento por Instituição</CardTitle>
              <CardDescription>
                Visualize todas as métricas detalhadas por instituição
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar instituição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="public">Pública</SelectItem>
                <SelectItem value="private">Privada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    Nome {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('users')}
                  >
                    Usuários {sortField === 'users' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('professionals')}
                  >
                    Profissionais {sortField === 'professionals' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('coupons')}
                  >
                    Cupons {sortField === 'coupons' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Descontos (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma instituição encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMetrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-medium">
                        {metric.name}
                        {metric.has_partnership && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Parceria
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={metric.type === 'public' ? 'default' : 'outline'}>
                          {metric.type === 'public' ? 'Pública' : 'Privada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={metric.is_active ? 'default' : 'secondary'}>
                          {metric.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{metric.total_users}</TableCell>
                      <TableCell className="text-right">{metric.total_professionals}</TableCell>
                      <TableCell className="text-right">
                        {metric.total_active_coupons}
                        {metric.total_coupon_uses > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({metric.total_coupon_uses} usos)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {metric.total_discount_given.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          <div className="mt-4 text-sm text-muted-foreground">
            Exibindo {filteredMetrics.length} de {metrics.length} instituições
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
