import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Lock, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

interface InstitutionMoodAggregatesProps {
  institutionId: string;
}

interface AggregateData {
  available: boolean;
  reason?: string;
  min_required?: number;
  current?: number;
  unique_users?: number;
  total_entries?: number;
  avg_mood?: number;
  avg_energy?: number;
  avg_anxiety?: number;
  avg_sleep_hours?: number;
  avg_sleep_quality?: number;
  risk_distribution?: Record<string, number>;
}

const RISK_LABELS: Record<string, { label: string; color: string }> = {
  healthy: { label: 'Saudável', color: 'bg-emerald-500' },
  attention: { label: 'Atenção', color: 'bg-yellow-500' },
  alert: { label: 'Alerta', color: 'bg-orange-500' },
  critical: { label: 'Crítico', color: 'bg-red-500' },
};

export function InstitutionMoodAggregates({ institutionId }: InstitutionMoodAggregatesProps) {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const { data, isLoading } = useQuery<AggregateData>({
    queryKey: ['institution-mood-aggregates', institutionId, period],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_institution_mood_aggregates', {
        p_institution_id: institutionId,
        p_period_days: Number(period),
      });
      if (error) throw error;
      return data as AggregateData;
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" />
            Bem-estar do diário emocional
          </CardTitle>
          <CardDescription>
            Dados agregados e anonimizados (mínimo de 5 alunos por período).
          </CardDescription>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="7">7d</TabsTrigger>
            <TabsTrigger value="30">30d</TabsTrigger>
            <TabsTrigger value="90">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !data?.available ? (
          <div className="text-center py-6 space-y-2">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">Dados ainda não disponíveis</p>
            <p className="text-xs text-muted-foreground">
              É necessário pelo menos {data?.min_required || 5} alunos com registros no período para preservar a privacidade individual.
              Atualmente: {data?.current ?? 0}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {data.unique_users} alunos · {data.total_entries} registros
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Humor', value: data.avg_mood, max: 5 },
                { label: 'Energia', value: data.avg_energy, max: 5 },
                { label: 'Ansiedade', value: data.avg_anxiety, max: 5 },
                { label: 'Horas de sono', value: data.avg_sleep_hours, suffix: 'h' },
                { label: 'Qualidade do sono', value: data.avg_sleep_quality, max: 5 },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                  <div className="text-2xl font-bold">
                    {m.value != null ? Number(m.value).toFixed(1) : '—'}
                    {m.suffix && <span className="text-sm font-normal">{m.suffix}</span>}
                    {m.max && <span className="text-sm text-muted-foreground font-normal">/{m.max}</span>}
                  </div>
                </div>
              ))}
            </div>
            {data.risk_distribution && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Distribuição de risco</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.risk_distribution).map(([level, count]) => {
                    const meta = RISK_LABELS[level] || { label: level, color: 'bg-muted' };
                    return (
                      <Badge key={level} variant="outline" className="gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${meta.color}`} />
                        {meta.label}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
