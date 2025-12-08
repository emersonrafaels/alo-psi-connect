import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinkRequestsMetrics } from '@/hooks/useAdminInstitutionLinkRequests';
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
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Percent, Timer, Calendar,
  Building2, CheckCircle, XCircle, Clock, BarChart3
} from 'lucide-react';

interface LinkRequestsMetricsDashboardProps {
  tenantId?: string;
}

const COLORS = ['#22c55e', '#ef4444', '#eab308', '#3b82f6', '#8b5cf6'];

export function LinkRequestsMetricsDashboard({ tenantId }: LinkRequestsMetricsDashboardProps) {
  const { data: metrics, isLoading, error } = useLinkRequestsMetrics(tenantId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Erro ao carregar métricas. Tente novamente mais tarde.
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Aprovadas', value: metrics.approvedRequests, color: '#22c55e' },
    { name: 'Rejeitadas', value: metrics.rejectedRequests, color: '#ef4444' },
    { name: 'Pendentes', value: metrics.pendingRequests, color: '#eab308' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total de Solicitações</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{metrics.totalRequests}</div>
            <p className="text-xs text-blue-600">Últimos 12 meses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Taxa de Aprovação</CardTitle>
            <Percent className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{metrics.approvalRate}%</div>
            <Progress value={metrics.approvalRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Tempo Médio Resposta</CardTitle>
            <Timer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{metrics.avgResponseTimeHours}h</div>
            <p className="text-xs text-orange-600">Média de processamento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-800">{metrics.requestsThisWeek}</span>
              {metrics.weeklyChange !== 0 && (
                <Badge 
                  variant={metrics.weeklyChange > 0 ? 'default' : 'secondary'}
                  className={metrics.weeklyChange > 0 ? 'bg-green-600' : 'bg-red-600 text-white'}
                >
                  {metrics.weeklyChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(metrics.weeklyChange)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-purple-600">vs semana anterior: {metrics.requestsLastWeek}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Solicitações nos últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  name="Total"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  name="Aprovadas"
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rejected" 
                  name="Rejeitadas"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Distribuição por Status
            </CardTitle>
            <CardDescription>
              Visão geral das solicitações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Aprovadas ({metrics.approvedRequests})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Rejeitadas ({metrics.rejectedRequests})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Pendentes ({metrics.pendingRequests})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Instituições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Top 10 Instituições Mais Solicitadas
          </CardTitle>
          <CardDescription>
            Ranking de instituições por número de solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.topInstitutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação registrada ainda
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.topInstitutions.map((inst, index) => (
                <div key={inst.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{inst.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{inst.totalRequests} solicitações</Badge>
                        <Badge variant="default" className="bg-green-600">
                          {inst.approvalRate}% aprovação
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={(inst.totalRequests / metrics.topInstitutions[0].totalRequests) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Aprovações vs Rejeições por Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Aprovações vs Rejeições por Mês
          </CardTitle>
          <CardDescription>
            Comparativo mensal de decisões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" name="Aprovadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejeitadas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pendentes" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
