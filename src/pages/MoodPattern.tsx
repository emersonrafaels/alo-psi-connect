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
import { ArrowLeft, Download, Calendar, Sparkles, BarChart3 } from 'lucide-react';
import { EmotionalSummaryCard } from '@/components/mood/EmotionalSummaryCard';
import { RecurringThemes } from '@/components/mood/RecurringThemes';
import { ConsistencyGoalCard } from '@/components/mood/ConsistencyGoalCard';
import { PatternNarrativeCard } from '@/components/mood/PatternNarrativeCard';
import { WeekdayHeatmapCard } from '@/components/mood/WeekdayHeatmapCard';
import { ConsistencyCalendar } from '@/components/mood/ConsistencyCalendar';
import { TagImpactCard } from '@/components/mood/TagImpactCard';
import { exportMoodReportPDF } from '@/utils/moodReportPDF';
import { useState } from 'react';
import { FormattedAIContent } from '@/components/ai/FormattedAIContent';
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
                Sua história emocional contada pelos seus próprios registros.
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

              <PatternNarrativeCard entries={entries} userConfigs={userConfigs} days={days} />

              <div className="grid gap-6 lg:grid-cols-2">
                <WeekdayHeatmapCard entries={periodEntries} userConfigs={userConfigs} />
                <ConsistencyCalendar entries={entries} days={days} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <RecurringThemes days={days} />
                <ConsistencyGoalCard entries={entries} />
              </div>

              <TagImpactCard entries={periodEntries} />

              {latestInsight?.insight_content && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Última análise da IA
                    </CardTitle>
                    <CardDescription>
                      {latestInsight.created_at &&
                        new Date(latestInsight.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormattedAIContent content={latestInsight.insight_content} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/analises'))
                      }
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Explorar mais Análises
                    </Button>
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
