import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Calendar, BarChart3, Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const MoodAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, loading } = useMoodEntries();

  // Redirect non-authenticated users
  if (!user) {
    navigate('/diario-emocional/experiencia');
    return null;
  }

  // Prepare data for charts
  const last30Days = entries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return entryDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      humor: entry.mood_score,
      energia: entry.energy_level,
      ansiedade: entry.anxiety_level,
      sono: entry.sleep_quality || 0,
    }));

  // Calculate averages
  const calculateAverage = (field: keyof typeof entries[0]) => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, entry) => {
      const value = entry[field];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  };

  const averages = {
    mood: calculateAverage('mood_score'),
    energy: calculateAverage('energy_level'),
    anxiety: calculateAverage('anxiety_level'),
    sleep: calculateAverage('sleep_quality'),
  };

  // Mood distribution
  const moodDistribution = [
    { range: '1-2', count: entries.filter(e => e.mood_score <= 2).length, color: '#ef4444' },
    { range: '3-4', count: entries.filter(e => e.mood_score >= 3 && e.mood_score <= 4).length, color: '#f97316' },
    { range: '5-6', count: entries.filter(e => e.mood_score >= 5 && e.mood_score <= 6).length, color: '#eab308' },
    { range: '7-8', count: entries.filter(e => e.mood_score >= 7 && e.mood_score <= 8).length, color: '#84cc16' },
    { range: '9-10', count: entries.filter(e => e.mood_score >= 9).length, color: '#22c55e' },
  ];

  // Weekly trends
  const weeklyTrends = () => {
    const weeks: Record<string, Array<typeof entries[0]>> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(entry);
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8) // Last 8 weeks
      .map(([weekStart, weekEntries]) => ({
        semana: new Date(weekStart).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        humor: Math.round((weekEntries.reduce((acc, e) => acc + e.mood_score, 0) / weekEntries.length) * 10) / 10,
        energia: Math.round((weekEntries.reduce((acc, e) => acc + e.energy_level, 0) / weekEntries.length) * 10) / 10,
        ansiedade: Math.round((weekEntries.reduce((acc, e) => acc + e.anxiety_level, 0) / weekEntries.length) * 10) / 10,
        entradas: weekEntries.length,
      }));
  };

  const weeklyData = weeklyTrends();

  // Most common tags
  const tagFrequency = entries
    .flatMap(entry => entry.tags || [])
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topTags = Object.entries(tagFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/diario-emocional')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Análises do Diário Emocional</h1>
              <p className="text-muted-foreground">
                Insights sobre seu bem-estar baseados em {entries.length} entradas
              </p>
            </div>
          </div>

          {entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Dados insuficientes</h3>
                <p className="text-muted-foreground mb-4">
                  Você precisa de pelo menos algumas entradas para gerar análises.
                </p>
                <Button onClick={() => navigate('/diario-emocional/nova-entrada')}>
                  Criar primeira entrada
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Humor Médio</CardTitle>
                    <Heart className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averages.mood}/10</div>
                    <p className="text-xs text-muted-foreground">
                      {averages.mood >= 7 ? 'Excelente' : averages.mood >= 5 ? 'Bom' : 'Precisa atenção'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Energia Média</CardTitle>
                    <TrendingUp className="h-4 w-4 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averages.energy}/5</div>
                    <p className="text-xs text-muted-foreground">
                      {averages.energy >= 4 ? 'Alta' : averages.energy >= 3 ? 'Média' : 'Baixa'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ansiedade Média</CardTitle>
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averages.anxiety}/5</div>
                    <p className="text-xs text-muted-foreground">
                      {averages.anxiety <= 2 ? 'Baixa' : averages.anxiety <= 3 ? 'Média' : 'Alta'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
                    <Calendar className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{entries.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Registros no total
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Trends Chart */}
              {last30Days.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tendências dos Últimos 30 Dias</CardTitle>
                    <CardDescription>
                      Evolução do seu humor, energia e ansiedade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={last30Days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="humor" stroke="#8884d8" name="Humor" />
                        <Line type="monotone" dataKey="energia" stroke="#82ca9d" name="Energia" />
                        <Line type="monotone" dataKey="ansiedade" stroke="#ffc658" name="Ansiedade" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trends */}
                {weeklyData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tendências Semanais</CardTitle>
                      <CardDescription>Médias por semana</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semana" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="humor" fill="#8884d8" name="Humor" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Mood Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição do Humor</CardTitle>
                    <CardDescription>Frequência por faixa de humor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={moodDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" name="Entradas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Insights and Top Tags */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Tags */}
                {topTags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags Mais Frequentes</CardTitle>
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

                {/* Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Insights Personalizados</CardTitle>
                    <CardDescription>Observações baseadas nos seus dados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {averages.mood >= 7 && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-green-700 dark:text-green-300">
                            🎉 Seu humor tem estado consistentemente bom! Continue com as práticas que estão funcionando.
                          </p>
                        </div>
                      )}
                      
                      {averages.anxiety >= 4 && (
                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <p className="text-orange-700 dark:text-orange-300">
                            ⚠️ Seus níveis de ansiedade estão elevados. Considere técnicas de relaxamento ou conversar com um profissional.
                          </p>
                        </div>
                      )}
                      
                      {entries.length >= 7 && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-blue-700 dark:text-blue-300">
                            📊 Parabéns por manter a consistência! Você já tem {entries.length} entradas registradas.
                          </p>
                        </div>
                      )}
                      
                      {averages.energy <= 2 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-yellow-700 dark:text-yellow-300">
                            💤 Sua energia tem estado baixa. Verifique seus padrões de sono e considere atividades revitalizantes.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodAnalytics;