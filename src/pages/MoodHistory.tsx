import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import { useEmotionConfig } from '@/hooks/useEmotionConfig';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { parseISODateLocal } from '@/lib/utils';
import { getAllEmotions, getEmotionColor, getEmotionLabel, formatValue } from '@/utils/emotionFormatters';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Search, Edit, Trash2, Plus, Sparkles } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useMoodEntryAnalyses, RISK_LEVEL_META } from '@/hooks/useMoodEntryAnalyses';
import { EmotionalSummaryCard } from '@/components/mood/EmotionalSummaryCard';
import { RecurringThemes } from '@/components/mood/RecurringThemes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Sparkle } from 'lucide-react';
import { isPrimaryIndicator } from '@/utils/moodInsightHelpers';

const MoodHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { entries, loading, deleteEntry } = useMoodEntries();
  const { userConfigs } = useEmotionConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const { data: analysesMap } = useMoodEntryAnalyses(entries.map(e => e.id));

  // Redirect non-authenticated users
  if (!user) {
    navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/experiencia'));
    return null;
  }

  // Filter entries based on search term and selected month
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.journal_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMonth = !selectedMonth || 
      entry.date.startsWith(selectedMonth);
    
    return matchesSearch && matchesMonth;
  });

  // Group entries by month
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const monthKey = entry.date.substring(0, 7); // YYYY-MM
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(entry);
    return groups;
  }, {} as Record<string, typeof entries>);

  const handleDelete = async (entryId: string) => {
    await deleteEntry(entryId);
  };

  const getPrimaryEmotion = (entry: any) => {
    const emotions = getAllEmotions(entry, userConfigs);
    // Try to find mood first, otherwise use first emotion
    const moodEmotion = emotions.find(e => e.key === 'mood');
    return moodEmotion || emotions[0];
  };

  const formatDate = (dateString: string) => {
    return parseISODateLocal(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonth = (monthKey: string) => {
    return parseISODateLocal(monthKey + '-01').toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional'))}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Histórico do Diário</h1>
              <p className="text-muted-foreground">
                {entries.length} entrada{entries.length !== 1 ? 's' : ''} registrada{entries.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button 
            onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/nova-entrada'))}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Entrada
            </Button>
          </div>

          {/* Resumo emocional */}
          {entries.length > 0 && (
            <>
              <EmotionalSummaryCard entries={entries} userConfigs={userConfigs} />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/padrao'))}
                  className="flex items-center gap-2"
                >
                  <Sparkle className="h-4 w-4" />
                  Ver meu padrão emocional
                </Button>
              </div>
              <RecurringThemes days={30} />
            </>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Buscar nas reflexões e tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mês</label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries */}
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma entrada encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedMonth 
                    ? 'Tente ajustar os filtros ou'
                    : 'Você ainda não tem entradas registradas.'
                  }
                </p>
                  <Button onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/nova-entrada'))}>
                    Criar primeira entrada
                  </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEntries)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([monthKey, monthEntries]) => (
                  <Card key={monthKey}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {formatMonth(monthKey)}
                      </CardTitle>
                      <CardDescription>
                        {monthEntries.length} entrada{monthEntries.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {monthEntries
                          .sort((a, b) => parseISODateLocal(b.date).getTime() - parseISODateLocal(a.date).getTime())
                          .map((entry) => (
                            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                              {/* Entry Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {(() => {
                                    const primary = getPrimaryEmotion(entry);
                                    const scale = userConfigs.find(c => c.emotion_type === primary?.key)?.scale_max || 10;
                                    return primary ? (
                                      <>
                                        <div className={`w-4 h-4 rounded-full ${getEmotionColor(primary.value, scale)}`} />
                                        <div>
                                          <h4 className="font-medium">{formatDate(entry.date)}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {primary.emoji} {primary.name}: {formatValue(primary.value)}/{scale} ({getEmotionLabel(primary.value, scale)})
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <div>
                                        <h4 className="font-medium">{formatDate(entry.date)}</h4>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', `/diario-emocional/nova-entrada?date=${entry.date}`))}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. A entrada do dia {formatDate(entry.date)} será permanentemente excluída.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* AI Analysis: risk badge + buddy message */}
                              {(() => {
                                const analysis = analysesMap?.get(entry.id);
                                if (!analysis) return null;
                                const meta = analysis.risk_level ? RISK_LEVEL_META[analysis.risk_level] : null;
                                return (
                                  <div className="space-y-2 border-t pt-3">
                                    {meta && (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className={meta.badgeClass}>
                                          <Sparkles className="h-3 w-3 mr-1" />
                                          {meta.emoji} Análise Medcos Track: {meta.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">via {analysis.source}</span>
                                      </div>
                                    )}
                                    {analysis.buddy_message && (
                                      <div className="bg-primary/5 border-l-4 border-primary/40 rounded-md p-3">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3" /> Mensagem do Buddy
                                        </p>
                                        <p className="text-sm italic">{analysis.buddy_message}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Entry Details - Indicadores principais + emoções complementares */}
                              {(() => {
                                const emotions = getAllEmotions(entry, userConfigs);
                                const displayEmotions = emotions.filter(e => e.value > 0);
                                if (displayEmotions.length === 0) return null;

                                const renderEmotion = (emotion: typeof displayEmotions[number]) => {
                                  const scale = userConfigs.find(c => c.emotion_type === emotion.key)?.scale_max || 5;
                                  return (
                                    <div key={emotion.key} className="flex items-center gap-2">
                                      <span className="text-lg">{emotion.emoji}</span>
                                      <div>
                                        <div className="text-muted-foreground text-xs">{emotion.name}</div>
                                        <div className="font-medium">{formatValue(emotion.value)}/{scale}</div>
                                      </div>
                                    </div>
                                  );
                                };

                                const primary = displayEmotions.filter(e => isPrimaryIndicator(e.key));
                                const complementary = displayEmotions.filter(e => !isPrimaryIndicator(e.key));

                                return (
                                  <div className="space-y-3">
                                    {primary.length > 0 && (
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                                        {primary.map(renderEmotion)}
                                      </div>
                                    )}
                                    {complementary.length > 0 && (
                                      <Collapsible>
                                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                          <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
                                          Ver dimensões emocionais ({complementary.length})
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-2">
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                                            {complementary.map(renderEmotion)}
                                          </div>
                                        </CollapsibleContent>
                                      </Collapsible>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Horas e qualidade do sono */}
                              {(entry.sleep_hours || entry.sleep_quality) && (
                                <div className="flex gap-4 text-sm border-t pt-3 flex-wrap">
                                  {entry.sleep_hours && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">😴 Horas de sono:</span>
                                      <span className="font-medium">{entry.sleep_hours}h</span>
                                    </div>
                                  )}
                                  {entry.sleep_quality && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">⭐ Qualidade do sono:</span>
                                      <span className="font-medium">{entry.sleep_quality}/5</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tags */}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {entry.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Journal Text */}
                              {entry.journal_text && (
                                <div className="bg-muted/30 rounded-md p-3">
                                  <p className="text-sm text-muted-foreground mb-1">Reflexões:</p>
                                  <p className="text-sm">{entry.journal_text}</p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodHistory;