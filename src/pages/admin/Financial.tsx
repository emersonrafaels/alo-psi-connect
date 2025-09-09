import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/StatsCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, CreditCard, PieChart, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialData {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  paidAppointments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  recentTransactions: Array<{
    id: string;
    nome_paciente: string;
    valor: number;
    payment_status: string;
    data_consulta: string;
    professional_name: string;
  }>;
}

const Financial = () => {
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['admin-financial'],
    queryFn: async () => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Buscar agendamentos com informações financeiras
      const { data: appointments, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          nome_paciente,
          valor,
          payment_status,
          status,
          data_consulta,
          created_at,
          profissionais!inner(display_name)
        `)
        .not('valor', 'is', null);

      if (error) throw error;

      // Calcular estatísticas - incluir agendamentos confirmados como receita válida
      const totalRevenue = appointments
        ?.filter(apt => apt.payment_status === 'paid' || apt.status === 'confirmado')
        ?.reduce((sum, apt) => sum + (apt.valor || 0), 0) || 0;

      const thisMonthRevenue = appointments
        ?.filter(apt => 
          (apt.payment_status === 'paid' || apt.status === 'confirmado') &&
          new Date(apt.data_consulta) >= thisMonthStart &&
          new Date(apt.data_consulta) <= thisMonthEnd
        )
        ?.reduce((sum, apt) => sum + (apt.valor || 0), 0) || 0;

      const lastMonthRevenue = appointments
        ?.filter(apt => 
          (apt.payment_status === 'paid' || apt.status === 'confirmado') &&
          new Date(apt.data_consulta) >= lastMonthStart &&
          new Date(apt.data_consulta) <= lastMonthEnd
        )
        ?.reduce((sum, apt) => sum + (apt.valor || 0), 0) || 0;

      const paidAppointments = appointments?.filter(apt => apt.payment_status === 'paid' || apt.status === 'confirmado').length || 0;
      const pendingPayments = appointments?.filter(apt => apt.payment_status === 'pending_payment').length || 0;
      const failedPayments = appointments?.filter(apt => apt.payment_status === 'failed').length || 0;
      // Note: refunded não existe no enum atual, mas mantemos para futuro
      const refundedPayments = 0;

      // Transações recentes (últimos 10)
      const recentTransactions = appointments
        ?.map(apt => ({
          id: apt.id,
          nome_paciente: apt.nome_paciente,
          valor: apt.valor || 0,
          payment_status: apt.payment_status,
          data_consulta: apt.data_consulta,
          professional_name: apt.profissionais?.display_name || 'N/A'
        }))
        ?.sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime())
        ?.slice(0, 10) || [];

      return {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        paidAppointments,
        pendingPayments,
        failedPayments,
        refundedPayments,
        recentTransactions
      } as FinancialData;
    }
  });

  const getPaymentStatusLabel = (status: string) => {
    const labels = {
      'pending_payment': 'Pendente',
      'paid': 'Pago',
      'failed': 'Falhou',
      'refunded': 'Reembolsado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPaymentStatusVariant = (status: string) => {
    const variants = {
      'pending_payment': 'secondary',
      'paid': 'default',
      'failed': 'destructive',
      'refunded': 'outline'
    } as const;
    return variants[status as keyof typeof variants] || 'secondary';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">
              Acompanhe a performance financeira da plataforma
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const monthlyGrowth = calculateGrowth(
    financialData?.thisMonthRevenue || 0,
    financialData?.lastMonthRevenue || 0
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Acompanhe a performance financeira da plataforma
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Receita Total"
            value={`R$ ${(financialData?.totalRevenue || 0).toFixed(2)}`}
            icon={DollarSign}
            description="Receita total acumulada"
          />
          
          <StatsCard
            title="Receita Mensal"
            value={`R$ ${(financialData?.thisMonthRevenue || 0).toFixed(2)}`}
            icon={TrendingUp}
            description={`${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}% vs mês anterior`}
          />
          
          <StatsCard
            title="Pagamentos Confirmados"
            value={financialData?.paidAppointments?.toString() || '0'}
            icon={CreditCard}
            description="Agendamentos pagos"
          />
          
          <StatsCard
            title="Pagamentos Pendentes"
            value={financialData?.pendingPayments?.toString() || '0'}
            icon={Calendar}
            description="Aguardando pagamento"
          />
        </div>

        {/* Resumo de Pagamentos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Status dos Pagamentos
              </CardTitle>
              <CardDescription>
                Distribuição dos status de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pagos</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{financialData?.paidAppointments || 0}</Badge>
                    <span className="text-sm text-muted-foreground">
                      R$ {(financialData?.totalRevenue || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pendentes</span>
                  <Badge variant="secondary">{financialData?.pendingPayments || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Falhas</span>
                  <Badge variant="destructive">{financialData?.failedPayments || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reembolsos</span>
                  <Badge variant="outline">{financialData?.refundedPayments || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparativo Mensal
              </CardTitle>
              <CardDescription>
                Receita do mês atual vs anterior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mês Atual</span>
                  <span className="text-lg font-semibold">
                    R$ {(financialData?.thisMonthRevenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mês Anterior</span>
                  <span className="text-lg font-semibold">
                    R$ {(financialData?.lastMonthRevenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Crescimento</span>
                  <Badge variant={monthlyGrowth >= 0 ? "default" : "destructive"}>
                    {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas 10 transações registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData?.recentTransactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{transaction.nome_paciente}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.professional_name} • {formatDate(transaction.data_consulta)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">R$ {transaction.valor.toFixed(2)}</p>
                    <Badge variant={getPaymentStatusVariant(transaction.payment_status)}>
                      {getPaymentStatusLabel(transaction.payment_status)}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {(!financialData?.recentTransactions || financialData.recentTransactions.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhuma transação encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Financial;