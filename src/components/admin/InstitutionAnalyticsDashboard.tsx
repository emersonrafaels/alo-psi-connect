import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useInstitutionDashboard } from '@/hooks/useInstitutionDashboard';
import { UsageMetricsPage } from '@/features/institution/metrics/UsageMetricsPage';

interface InstitutionAnalyticsDashboardProps {
  institutionId: string;
}

const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 };

export function InstitutionAnalyticsDashboard({ institutionId }: InstitutionAnalyticsDashboardProps) {
  const { growthData, engagementData } = useInstitutionDashboard(institutionId);

  return (
    <div className="space-y-6">
      <UsageMetricsPage institutionId={institutionId} />

      {(growthData.length > 0 || (engagementData?.top_professionals?.length ?? 0) > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {growthData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Crescimento da rede</CardTitle>
                <CardDescription>Profissionais e alunos adicionados nos últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="professionals_added" stroke="hsl(var(--chart-1))" name="Profissionais" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="students_enrolled" stroke="hsl(var(--chart-2))" name="Alunos" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {(engagementData?.top_professionals?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profissionais mais agendados</CardTitle>
                <CardDescription>Top 5 nos últimos 90 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={engagementData!.top_professionals} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={120} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="appointments" fill="hsl(var(--primary))" name="Agendamentos" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
