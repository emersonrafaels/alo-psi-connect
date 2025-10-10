import { useEffect, useState } from 'react';
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminTenant } from '@/contexts/AdminTenantContext';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

        // Calcular receita mensal
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let revenueQuery = supabase
          .from('agendamentos')
          .select('valor')
          .eq('payment_status', 'paid')
          .gte('created_at', startOfMonth.toISOString());
        
        if (tenantFilter) {
          revenueQuery = revenueQuery.eq('tenant_id', tenantFilter);
        }
        
        const { data: revenueData } = await revenueQuery;
        
        const thisMonthRevenue = revenueData?.reduce((sum, apt) => 
          sum + (parseFloat(apt.valor?.toString() || '0')), 0
        ) || 0;

        setStats({
          totalUsers: totalUsers || 0,
          totalProfessionals: totalProfessionals || 0,
          activeProfessionals: activeProfessionals || 0,
          totalAppointments: totalAppointments || 0,
          pendingAppointments: pendingAppointments || 0,
          thisMonthRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tenantFilter]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Visão geral da plataforma
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral da plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total de Usuários"
          value={stats?.totalUsers || 0}
          description="usuários cadastrados"
          icon={Users}
        />
        <StatsCard
          title="Profissionais"
          value={stats?.totalProfessionals || 0}
          description={`${stats?.activeProfessionals || 0} ativos`}
          icon={UserCheck}
        />
        <StatsCard
          title="Consultas"
          value={stats?.totalAppointments || 0}
          description={`${stats?.pendingAppointments || 0} pendentes`}
          icon={Calendar}
        />
        <StatsCard
          title="Receita Mensal"
          value={`R$ ${stats?.thisMonthRevenue.toFixed(2) || '0,00'}`}
          description="este mês"
          icon={DollarSign}
        />
        <StatsCard
          title="Taxa de Conversão"
          value="0%"
          description="vs. mês anterior"
          icon={TrendingUp}
        />
        <StatsCard
          title="Usuários Ativos"
          value="0"
          description="últimos 7 dias"
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade recente registrada.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API</span>
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
    </AdminLayout>
  );
}
