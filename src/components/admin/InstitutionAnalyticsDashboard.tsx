import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Users, Calendar, XCircle } from 'lucide-react';
import { useInstitutionDashboard } from '@/hooks/useInstitutionDashboard';

interface InstitutionAnalyticsDashboardProps {
  institutionId: string;
}

export function InstitutionAnalyticsDashboard({ institutionId }: InstitutionAnalyticsDashboardProps) {
  const { growthData, engagementData, alerts, isLoading } = useInstitutionDashboard(institutionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' };
      case 'medium':
        return { variant: 'default' as const, icon: AlertTriangle, color: 'text-yellow-600' };
      case 'low':
        return { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' };
      default:
        return { variant: 'default' as const, icon: AlertTriangle, color: 'text-gray-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção de Alertas */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Alertas e Notificações
          </h3>
          {alerts.map((alert, idx) => {
            const config = getSeverityConfig(alert.severity);
            const Icon = config.icon;
            return (
              <Alert key={idx} variant={config.variant}>
                <Icon className={`h-4 w-4 ${config.color}`} />
                <AlertDescription>
                  {alert.message}
                  {alert.count > 1 && ` (${alert.count})`}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* KPIs de Engajamento */}
      {engagementData && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{engagementData.total_appointments}</div>
              <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {engagementData.active_rate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Agendamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${engagementData.cancellation_rate > 20 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {engagementData.cancellation_rate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {engagementData.cancelled_appointments} de {engagementData.total_appointments} agendamentos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico de Evolução Temporal */}
      {growthData && growthData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução de Profissionais e Alunos (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="professionals_added" 
                  stroke="#8b5cf6" 
                  name="Profissionais Adicionados"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="students_enrolled" 
                  stroke="#3b82f6" 
                  name="Alunos Matriculados"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Top Profissionais */}
      {engagementData?.top_professionals && engagementData.top_professionals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 5 Profissionais Mais Agendados (últimos 90 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData.top_professionals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#8b5cf6" name="Agendamentos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há dados */}
      {(!growthData || growthData.length === 0) && (!engagementData || engagementData.total_appointments === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <TrendingUp className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Dados insuficientes para análise
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  À medida que sua instituição crescer e houver mais atividade, 
                  este dashboard exibirá métricas e insights detalhados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
