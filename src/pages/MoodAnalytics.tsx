import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import { useEmotionConfig } from '@/hooks/useEmotionConfig';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { AIInsightsCard } from '@/components/AIInsightsCard';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { EmotionalSummaryCard } from '@/components/mood/EmotionalSummaryCard';
import { EmotionMultiSelect, loadSelection } from '@/components/mood/EmotionMultiSelect';
import { DynamicTrendChart } from '@/components/mood/DynamicTrendChart';
import { EmotionRankingCard } from '@/components/mood/EmotionRankingCard';
import { EmotionCorrelationMatrix } from '@/components/mood/EmotionCorrelationMatrix';
import { EmotionScatterCard } from '@/components/mood/EmotionScatterCard';
import { filterEntriesByDays, type Granularity } from '@/utils/moodSeriesBuilder';
import { generateDistributionCaption } from '@/utils/moodInsightHelpers';

const STORAGE_KEY = 'mood-dashboard:selected-emotions';

const MoodAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { entries, loading } = useMoodEntries();
  const { userConfigs } = useEmotionConfig();

  const enabledConfigs = useMemo(() => userConfigs.filter((c) => c.is_enabled), [userConfigs]);

  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [selected, setSelected] = useState<string[]>([]);

  // Initialize selection from storage or defaults
  useEffect(() => {
    if (enabledConfigs.length === 0 || selected.length > 0) return;
    const fallback = enabledConfigs.slice(0, 3).map((c) => c.emotion_type);
    const saved = loadSelection(STORAGE_KEY, fallback).filter((k) =>
      enabledConfigs.some((c) => c.emotion_type === k)
    );
    setSelected(saved.length > 0 ? saved : fallback);
  }, [enabledConfigs, selected.length]);

  if (!user) {
    navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/experiencia'));
    return null;
  }

  const days = Number(range);
  const periodEntries = useMemo(() => filterEntriesByDays(entries, days), [entries, days]);

  const moodDistribution = [
    { range: '1', count: entries.filter((e) => e.mood_score === 1).length, label: '😢' },
    { range: '2', count: entries.filter((e) => e.mood_score === 2).length, label: '😔' },
    { range: '3', count: entries.filter((e) => e.mood_score === 3).length, label: '😐' },
    { range: '4', count: entries.filter((e) => e.mood_score === 4).length, label: '😊' },
    { range: '5', count: entries.filter((e) => e.mood_score === 5).length, label: '🤩' },
  ];

  const tagFrequency = entries
    .flatMap((entry) => entry.tags || [])
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topTags = Object.entries(tagFrequency).sort(([, a], [, b]) => b - a).slice(0, 5);

  const toggleEmotion = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
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
              <h1 className="text-2xl font-bold">Dashboard do seu bem-estar</h1>
              <p className="text-muted-foreground text-sm">
                {entries.length} entradas registradas. Escolha emoções, compare e descubra padrões.
              </p>
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as '7' | '30' | '90')}>
              <TabsList>
                <TabsTrigger value="7">7d</TabsTrigger>
                <TabsTrigger value="30">30d</TabsTrigger>
                <TabsTrigger value="90">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Resumo */}
          {entries.length > 0 && (
            <EmotionalSummaryCard entries={entries} userConfigs={userConfigs} />
          )}

          {entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Dados insuficientes</h3>
                <p className="text-muted-foreground mb-4">
                  Você precisa de pelo menos algumas entradas para gerar análises.
                </p>
                <Button onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/nova-entrada'))}>
                  Criar primeira entrada
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Multi-select */}
              {enabledConfigs.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Emoções no gráfico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmotionMultiSelect
                      configs={enabledConfigs}
                      selected={selected}
                      onChange={setSelected}
                      storageKey={STORAGE_KEY}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Trend chart */}
              <DynamicTrendChart
                entries={periodEntries}
                configs={enabledConfigs}
                selected={selected}
                days={days}
                granularity={granularity}
                onGranularityChange={setGranularity}
              />

              {/* Ranking + Correlation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmotionRankingCard
                  entries={entries}
                  configs={enabledConfigs}
                  days={days}
                  selected={selected}
                  onToggle={toggleEmotion}
                />
                <EmotionCorrelationMatrix
                  entries={periodEntries}
                  configs={enabledConfigs}
                  selected={selected}
                />
              </div>

              {/* Scatter */}
              <EmotionScatterCard entries={periodEntries} configs={enabledConfigs} />

              {/* Distribution + Tags */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição do Humor</CardTitle>
                    <CardDescription>Frequência por faixa de humor (todas entradas)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={moodDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Entradas" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground italic">
                      {generateDistributionCaption(Object.fromEntries(moodDistribution.map((m) => [Number(m.range), m.count])))}
                    </p>
                  </CardContent>
                </Card>

                {topTags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags mais frequentes</CardTitle>
                      <CardDescription>Temas que mais aparecem nas suas entradas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {topTags.map(([tag, count]) => (
                          <div key={tag} className="flex justify-between items-center">
                            <span className="font-medium">{tag}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${(count / topTags[0][1]) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* AI Insights */}
              <AIInsightsCard
                moodEntries={entries.map((entry) => ({
                  date: entry.date,
                  mood_score: entry.mood_score || 0,
                  energy_level: entry.energy_level || 0,
                  anxiety_level: entry.anxiety_level || 0,
                  sleep_hours: entry.sleep_hours || 0,
                  sleep_quality: entry.sleep_quality || 0,
                  journal_text: entry.journal_text,
                  tags: entry.tags,
                }))}
                className="col-span-full"
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodAnalytics;
