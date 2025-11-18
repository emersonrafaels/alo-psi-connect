import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstitutionCoupon } from '@/hooks/useInstitutionCoupons';
import { 
  Ticket, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  coupons: InstitutionCoupon[];
  couponUsage: any[];
  stats: {
    totalActive: number;
    totalUsages: number;
    totalDiscountGiven: number;
    avgDiscountPerUse: number;
  };
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export const CouponsAnalyticsView = ({ coupons, couponUsage, stats }: Props) => {
  // Dados para gráfico de uso ao longo do tempo (últimos 30 dias)
  const usageOverTimeData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const usagesOnDate = couponUsage.filter(usage => {
        const usageDate = format(parseISO(usage.used_at), 'yyyy-MM-dd');
        return usageDate === dateStr;
      });

      return {
        date: format(date, 'dd/MMM', { locale: ptBR }),
        usos: usagesOnDate.length
      };
    });
  }, [couponUsage]);

  // Top 5 cupons mais usados
  const topCouponsData = useMemo(() => {
    return [...coupons]
      .sort((a, b) => b.current_usage_count - a.current_usage_count)
      .slice(0, 5)
      .map(coupon => ({
        name: coupon.code,
        usos: coupon.current_usage_count
      }));
  }, [coupons]);

  // Distribuição por tipo de desconto
  const discountTypeData = useMemo(() => {
    const percentage = coupons.filter(c => c.discount_type === 'percentage').length;
    const fixed = coupons.filter(c => c.discount_type === 'fixed_amount').length;

    return [
      { name: 'Percentual', value: percentage },
      { name: 'Valor Fixo', value: fixed }
    ];
  }, [coupons]);

  // Performance por público-alvo
  const audiencePerformanceData = useMemo(() => {
    const byAudience: Record<string, { usos: number, desconto: number }> = {};

    coupons.forEach(coupon => {
      const audience = coupon.target_audience;
      const usages = couponUsage.filter(u => u.coupon_id === coupon.id);
      
      if (!byAudience[audience]) {
        byAudience[audience] = { usos: 0, desconto: 0 };
      }
      
      byAudience[audience].usos += usages.length;
      byAudience[audience].desconto += usages.reduce((sum, u) => sum + Number(u.discount_amount || 0), 0);
    });

    const labels: Record<string, string> = {
      all: 'Todos',
      institution_students: 'Alunos',
      other_patients: 'Outros'
    };

    return Object.entries(byAudience).map(([audience, data]) => ({
      name: labels[audience] || audience,
      usos: data.usos,
      desconto: Math.round(data.desconto)
    }));
  }, [coupons, couponUsage]);

  // Alertas
  const alerts = useMemo(() => {
    const now = new Date();
    const result: { type: 'warning' | 'error' | 'success' | 'info'; message: string }[] = [];

    // Cupons próximos a expirar
    const expiringCoupons = coupons.filter(c => {
      if (!c.valid_until || !c.is_active) return false;
      const daysUntilExpiry = (new Date(c.valid_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    });

    if (expiringCoupons.length > 0) {
      result.push({
        type: 'warning',
        message: `${expiringCoupons.length} cupom(ns) expira(m) nos próximos 7 dias`
      });
    }

    // Cupons próximos do limite
    const nearLimitCoupons = coupons.filter(c => {
      if (!c.maximum_uses || !c.is_active) return false;
      return (c.current_usage_count / c.maximum_uses) > 0.8;
    });

    if (nearLimitCoupons.length > 0) {
      result.push({
        type: 'error',
        message: `${nearLimitCoupons.length} cupom(ns) próximo(s) do limite de uso (>80%)`
      });
    }

    // Cupons com alta taxa de conversão
    const highPerformingCoupons = coupons.filter(c => {
      return c.current_usage_count >= 10 && c.is_active;
    });

    if (highPerformingCoupons.length > 0) {
      result.push({
        type: 'success',
        message: `${highPerformingCoupons.length} cupom(ns) com alta taxa de uso (≥10 usos)`
      });
    }

    // Cupons inativos há muito tempo
    const inactiveCoupons = coupons.filter(c => !c.is_active).length;
    if (inactiveCoupons > 0) {
      result.push({
        type: 'info',
        message: `${inactiveCoupons} cupom(ns) inativo(s) na base`
      });
    }

    return result;
  }, [coupons]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <Ticket className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalActive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {coupons.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Desconto Total</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {stats.totalDiscountGiven.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              concedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Desconto Médio</CardTitle>
            <Percent className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {stats.avgDiscountPerUse.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              por uso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Uso ao longo do tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Uso ao Longo do Tempo</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="usos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 cupons */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Cupons Mais Usados</CardTitle>
            <CardDescription>Por número de usos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCouponsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="usos" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Desconto</CardTitle>
            <CardDescription>Distribuição de cupons</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={discountTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {discountTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance por público */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Público-Alvo</CardTitle>
            <CardDescription>Usos e descontos concedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={audiencePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="usos" fill={COLORS[0]} name="Usos" />
                <Bar dataKey="desconto" fill={COLORS[1]} name="Desconto (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas e Insights</CardTitle>
            <CardDescription>Ações recomendadas para otimizar seus cupons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  {alert.type === 'warning' && <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />}
                  {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                  {alert.type === 'info' && <Ticket className="h-5 w-5 text-blue-500 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                  <Badge variant={
                    alert.type === 'warning' ? 'outline' :
                    alert.type === 'error' ? 'destructive' :
                    alert.type === 'success' ? 'default' :
                    'secondary'
                  }>
                    {alert.type === 'warning' ? 'Atenção' :
                     alert.type === 'error' ? 'Urgente' :
                     alert.type === 'success' ? 'Sucesso' :
                     'Info'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
