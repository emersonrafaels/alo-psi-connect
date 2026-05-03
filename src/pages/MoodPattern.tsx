import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import { useEmotionConfig } from '@/hooks/useEmotionConfig';
import { useTenant } from '@/hooks/useTenant';
import { useUserProfile } from '@/hooks/useUserProfile';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { useMoodThemes } from '@/hooks/useMoodThemes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { EmotionalSummaryCard } from '@/components/mood/EmotionalSummaryCard';
import { RecurringThemes } from '@/components/mood/RecurringThemes';
import { ConsistencyGoalCard } from '@/components/mood/ConsistencyGoalCard';
import { EmotionMultiSelect, loadSelection } from '@/components/mood/EmotionMultiSelect';
import { DynamicTrendChart } from '@/components/mood/DynamicTrendChart';
import { EmotionRankingCard } from '@/components/mood/EmotionRankingCard';
import { EmotionCorrelationMatrix } from '@/components/mood/EmotionCorrelationMatrix';
import { EmotionScatterCard } from '@/components/mood/EmotionScatterCard';
import { type Granularity } from '@/utils/moodSeriesBuilder';
import { exportMoodReportPDF } from '@/utils/moodReportPDF';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseISODateLocal } from '@/lib/utils';

type RangeKey = '7' | '30' | '90';

const MoodPattern = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { profile } = useUserProfile();
  const { entries, loading } = useMoodEntries();
  const { userConfigs } = useEmotionConfig();
  const [range, setRange] = useState<RangeKey>('30');
  const days = Number(range);
  const { data: themes = [] } = useMoodThemes(days);

  const { data: latestInsight } = useQuery({
    queryKey: ['mood-pattern-latest-insight', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_insights_history')
        .select('insight_content, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (!user) {
    navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/experiencia'));
    return null;
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  const periodEntries = entries.filter((e) => parseISODateLocal(e.date) >= since);

  const weeklyAvg = (() => {
    const weeks = new Map<string, { mood: number[]; anxiety: number[]; sleep: number[] }>();
    periodEntries.forEach((e) => {
      const d = parseISODateLocal(e.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      if (!weeks.has(key)) weeks.set(key, { mood: [], anxiety: [], sleep: [] });
      const w = weeks.get(key)!;
      if (typeof e.mood_score === 'number') w.mood.push(e.mood_score);
      if (typeof e.anxiety_level === 'number') w.anxiety.push(e.anxiety_level);
      if (typeof e.sleep_quality === 'number') w.sleep.push(e.sleep_quality);
    });
    return Array.from(weeks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        semana: parseISODateLocal(key).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        humor: v.mood.length ? +(v.mood.reduce((a, b) => a + b, 0) / v.mood.length).toFixed(2) : null,
        ansiedade: v.anxiety.length ? +(v.anxiety.reduce((a, b) => a + b, 0) / v.anxiety.length).toFixed(2) : null,
        sono: v.sleep.length ? +(v.sleep.reduce((a, b) => a + b, 0) / v.sleep.length).toFixed(2) : null,
      }));
  })();

  const handleExport = () => {
    exportMoodReportPDF({
      patientName: profile?.nome || 'Usuário',
      periodDays: days,
      entries: periodEntries,
      themes: themes.map((t) => ({ theme: t.theme, count: t.count, category: t.category })),
      insightContent: latestInsight?.insight_content,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional'))}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl font-bold">Meu padrão emocional</h1>
              <p className="text-muted-foreground text-sm">
                Uma visão consolidada do que tem aparecido com mais frequência.
              </p>
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <TabsList>
                <TabsTrigger value="7">7d</TabsTrigger>
                <TabsTrigger value="30">30d</TabsTrigger>
                <TabsTrigger value="90">90d</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleExport} className="flex items-center gap-2" disabled={periodEntries.length === 0}>
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>

          {loading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando…</CardContent></Card>
          ) : periodEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Sem registros nos últimos {days} dias.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <EmotionalSummaryCard entries={periodEntries} userConfigs={userConfigs} />

              <div className="grid gap-6 md:grid-cols-2">
                <RecurringThemes days={days} />
                <ConsistencyGoalCard entries={entries} />
              </div>

              {weeklyAvg.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Visão semanal</CardTitle>
                    <CardDescription>Média de humor, ansiedade e qualidade do sono por semana.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyAvg}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semana" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="humor" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                          <Line type="monotone" dataKey="ansiedade" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                          <Line type="monotone" dataKey="sono" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {generateChartCaption('mood', weeklyAvg.map((w) => w.humor))}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodPattern;
