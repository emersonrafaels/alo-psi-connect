import { useEffect, useState } from 'react';
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminTenant } from '@/contexts/AdminTenantContext';

interface DashboardStats {
  totalUsers: number;
  totalProfessionals: number;
  activeProfessionals: number;
  totalAppointments: number;
  pendingAppointments: number;
  thisMonthRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { tenantFilter } = useAdminTenant();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar estatísticas do banco aplicando filtro de tenant
        const [
          { count: totalUsers },
          { count: totalProfessionals },
          { count: activeProfessionals },
          { count: totalAppointments },
          { count: pendingAppointments }
        ] = await Promise.all([
          (() => {
            let q = supabase.from('profiles').select('*', { count: 'exact', head: true });
            if (tenantFilter) q = q.eq('tenant_id', tenantFilter);
            return q;
          })(),
          (() => {
            let q = supabase.from('profissionais').select('*, professional_tenants!inner(tenant_id)', { count: 'exact', head: true });
            if (tenantFilter) q = q.eq('professional_tenants.tenant_id', tenantFilter);
            return q;
          })(),
          (() => {
            let q = supabase.from('profissionais').select('*, professional_tenants!inner(tenant_id)', { count: 'exact', head: true }).eq('ativo', true);
            if (tenantFilter) q = q.eq('professional_tenants.tenant_id', tenantFilter);
            return q;
          })(),
          (() => {
            let q = supabase.from('agendamentos').select('*', { count: 'exact', head: true });
            if (tenantFilter) q = q.eq('tenant_id', tenantFilter);
            return q;
          })(),
          (() => {
            let q = supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('status', 'pendente');
            if (tenantFilter) q = q.eq('tenant_id', tenantFilter);
            return q;
          })()
        ]);

        // Calcular receita do mês atual
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        let revenueQuery = supabase
          .from('agendamentos')
          .select('valor')
          .gte('created_at', firstDayOfMonth.toISOString())
          .eq('status', 'confirmado');
        
        if (tenantFilter) {
          revenueQuery = revenueQuery.eq('tenant_id', tenantFilter);
        }
        
        const { data: revenueData } = await revenueQuery;

        const thisMonthRevenue = revenueData?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;

        setStats({
          totalUsers: totalUsers || 0,
          totalProfessionals: totalProfessionals || 0,
          activeProfessionals: activeProfessionals || 0,
          totalAppointments: totalAppointments || 0,
          pendingAppointments: pendingAppointments || 0,
          thisMonthRevenue
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tenantFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral da plataforma AloPsi</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral da plataforma AloPsi</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuários"
          value={stats?.totalUsers || 0}
          description="Pacientes cadastrados"
          icon={Users}
        />

        <StatsCard
          title="Profissionais"
          value={`${stats?.activeProfessionals || 0}/${stats?.totalProfessionals || 0}`}
          description="Ativos / Total"
          icon={UserCheck}
        />

        <StatsCard
          title="Agendamentos"
          value={stats?.totalAppointments || 0}
          description={`${stats?.pendingAppointments || 0} pendentes`}
          icon={Calendar}
        />

        <StatsCard
          title="Receita do Mês"
          value={`R$ ${(stats?.thisMonthRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Faturamento atual"
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métricas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa de Profissionais Ativos</span>
                <span className="font-semibold">
                  {stats?.totalProfessionals ? 
                    Math.round((stats.activeProfessionals / stats.totalProfessionals) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Agendamentos Pendentes</span>
                <span className="font-semibold">
                  {stats?.totalAppointments ? 
                    Math.round((stats.pendingAppointments / stats.totalAppointments) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ticket Médio</span>
                <span className="font-semibold">
                  R$ {stats?.totalAppointments && stats.thisMonthRevenue ? 
                    (stats.thisMonthRevenue / stats.totalAppointments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 
                    '0,00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sistema</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Banco de Dados</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Conectado</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última Atualização</span>
                <span className="text-sm font-medium">
                  {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}