import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import { useMoodEntryAnalyses, RISK_LEVEL_META } from '@/hooks/useMoodEntryAnalyses';
import { useEmotionConfig } from '@/hooks/useEmotionConfig';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar, Plus, TrendingUp, BarChart3, Share2, Mail, Download, Settings, ExternalLink, ChevronRight, Sparkles, MessageCircle, CheckCircle2, Pencil, Flame, ArrowUpRight, ArrowDownRight, Minus, BookHeart, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { shareWhatsApp, shareTelegram, shareEmail, copyToClipboard } from '@/utils/shareHelpers';
import { useShareConfig } from '@/hooks/useShareConfig';
import { generateProfessionalPDF, downloadPDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { getTodayLocalDateString, parseISODateLocal } from '@/lib/utils';
import { calculateAverage, getEmotionValue, getAllEmotions } from '@/utils/emotionFormatters';
import { MoodEntryDetailModal } from '@/components/mood/MoodEntryDetailModal';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import { currentStreak, lastSevenDays, averageOf, compareTrend, shiftDate } from '@/features/mood-diary/home/diaryStats';

const MoodDiary = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { tenant } = useTenant();
  const { entries, loading: entriesLoading } = useMoodEntries();
  const entryIds = entries.map(e => e.id);
  const { data: analysesMap } = useMoodEntryAnalyses(entryIds);
  const { userConfigs, activeConfigs } = useEmotionConfig();
  const { toast } = useToast();
  const [selectedStatEmotion, setSelectedStatEmotion] = useState('mood');
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const { getShareConfig } = useShareConfig();

  // Redirect non-authenticated users to experience page
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/experiencia'));
    }
  }, [user, authLoading, navigate, tenant]);

  const handleShare = async (platform: string, entry?: any) => {
    const shareData = entry || (entries.length > 0 ? entries[0] : null);
    
    if (!shareData) {
      toast({
        title: "Nenhuma entrada encontrada",
        description: "Adicione uma entrada primeiro para compartilhar.",
        variant: "destructive",
      });
      return;
    }

    const stats = {
      totalEntries: entries.length,
      avgMood: calculateAverage(entries.map(e => e.mood_score)),
      avgEnergy: calculateAverage(entries.map(e => e.energy_level)),
      avgAnxiety: calculateAverage(entries.map(e => e.anxiety_level)),
    };

    const shareConfig = getShareConfig();
    const emotionConfigs = userConfigs.map(c => ({ emotion_type: c.emotion_type, display_name: c.display_name }));

    try {
      switch (platform) {
        case 'whatsapp':
          shareWhatsApp(shareData, stats, shareConfig, emotionConfigs);
          break;
        case 'telegram':
          shareTelegram(shareData, stats, shareConfig, emotionConfigs);
          break;
        case 'email':
          shareEmail(shareData, stats, shareConfig, emotionConfigs);
          break;
        case 'copy':
          const success = await copyToClipboard(shareData, stats, shareConfig, emotionConfigs);
          if (success) {
            toast({
              title: "Copiado!",
              description: "Conteúdo copiado para a área de transferência.",
            });
          }
          break;
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    if (entries.length === 0) {
      toast({
        title: "Nenhuma entrada encontrada",
        description: "Adicione uma entrada primeiro para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    const recentEntry = entries[0];
    const stats = {
      totalEntries: entries.length,
      avgMood: calculateAverage(entries.map(e => e.mood_score)),
      avgEnergy: calculateAverage(entries.map(e => e.energy_level)),
      avgAnxiety: calculateAverage(entries.map(e => e.anxiety_level)),
    };

    const emotionConfigs = userConfigs.map(c => ({ emotion_type: c.emotion_type, display_name: c.display_name }));

    try {
      const pdf = generateProfessionalPDF(recentEntry as any, stats, {
        includeLogo: true, 
        includeStats: true, 
        includeGraphs: false 
      }, emotionConfigs);
      downloadPDF(pdf, 'diario-emocional');
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "Seu relatório foi baixado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || entriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const today = getTodayLocalDateString();
  const todayEntry = entries.find(entry => entry.date === today);
  const slug = tenant?.slug || 'alopsi';
  const go = (path: string) => navigate(buildTenantPath(slug, path));

  const recentEntries = entries.slice(0, 7);
  const entryDates = entries.map(e => e.date);
  const streak = currentStreak(entryDates, today);
  const week = lastSevenDays(entryDates, today);
  const weekCount = week.filter(d => d.filled).length;

  // Legacy field mapping for backward compatibility
  const legacyFieldMap: Record<string, string> = {
    mood: 'mood_score',
    energy: 'energy_level',
    anxiety: 'anxiety_level',
  };
  const selectedConfig = activeConfigs.find(c => c.emotion_type === selectedStatEmotion);
  const selectedScaleMax = selectedConfig?.scale_max || 5;
  const valueFor = (entry: MoodEntry) =>
    getEmotionValue(entry, selectedStatEmotion, legacyFieldMap[selectedStatEmotion] as any) as number | null;
  const weekStart = shiftDate(today, -6);
  const prevStart = shiftDate(today, -13);
  const thisWeekEntries = entries.filter(e => e.date >= weekStart && e.date <= today);
  const prevWeekEntries = entries.filter(e => e.date >= prevStart && e.date < weekStart);
  const avgSelected = averageOf(thisWeekEntries.map(valueFor));
  const avgPrevious = averageOf(prevWeekEntries.map(valueFor));
  const trend = compareTrend(avgSelected, avgPrevious);
  const sparkValues = week.map(d => {
    const e = entries.find(x => x.date === d.date);
    return e ? valueFor(e) : null;
  });

  const todayLabel = parseISODateLocal(today).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayAnalysis = todayEntry ? analysesMap?.get(todayEntry.id) : null;
  const todayMeta = todayAnalysis?.risk_level ? RISK_LEVEL_META[todayAnalysis.risk_level] : null;

  const openWhatsApp = () => {
    const number = tenant?.diary_whatsapp_number || tenant?.contact_whatsapp || '5511937074332';
    const message = tenant?.diary_whatsapp_message || 'Olá, quero registrar meu diário emocional';
    window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const moodDot = (entry: MoodEntry) => {
    const emotions = getAllEmotions(entry, userConfigs);
    const mood = emotions.find(e => e.key === 'mood') || emotions[0];
    if (!mood) return 'bg-muted';
    return mood.value >= 4 ? 'bg-success' : mood.value >= 2.5 ? 'bg-chart-3' : 'bg-destructive';
  };

  const Sparkline = () => {
    const pts = sparkValues
      .map((v, i) => (v === null ? null : { x: (i / 6) * 100, y: 28 - ((v - 1) / Math.max(selectedScaleMax - 1, 1)) * 24 }))
      .filter(Boolean) as { x: number; y: number }[];
    if (pts.length < 2) return null;
    return (
      <svg viewBox="0 0 100 32" className="w-full h-10" preserveAspectRatio="none" aria-hidden>
        <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" className="stroke-primary" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.6" className="fill-primary" />)}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-28 md:pb-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary capitalize">{todayLabel}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Diário Emocional</h1>
              <p className="text-muted-foreground">Um minuto por dia para entender como você está.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={openWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-2" /> Pelo WhatsApp
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go('/diario-emocional/configurar')}>
                <Settings className="h-4 w-4 mr-2" /> Configurar emoções
              </Button>
            </div>
          </div>

          {/* Today */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
            <CardContent className="p-6 md:p-8">
              {todayEntry ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <h2 className="text-xl font-semibold">Seu dia já está registrado</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAllEmotions(todayEntry, userConfigs).map(emotion => (
                      <span key={emotion.key} className="rounded-full bg-background/80 border px-3 py-1 text-sm">
                        <span className="text-muted-foreground">{emotion.name}</span>{' '}
                        <strong>{Math.round(emotion.value)}</strong>
                      </span>
                    ))}
                  </div>
                  {todayEntry.journal_text && (
                    <p className="text-sm text-muted-foreground italic line-clamp-2">"{todayEntry.journal_text}"</p>
                  )}
                  {todayMeta && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={todayMeta.badgeClass}>
                        {todayMeta.emoji} Análise Bem Estar: {todayMeta.label}
                      </Badge>
                      {todayAnalysis?.source === 'evolution_api' && (
                        <Badge variant="outline" className="text-xs">via Diário Emocional - WhatsApp</Badge>
                      )}
                    </div>
                  )}
                  {todayAnalysis?.buddy_message && (
                    <div className="flex gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <Sparkles className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground italic">{todayAnalysis.buddy_message}</p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap pt-1">
                    <Button onClick={() => go(`/diario-emocional/nova-entrada?date=${today}`)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar registro de hoje
                    </Button>
                    <Button variant="outline" onClick={() => go('/diario-emocional/analises')}>
                      <BarChart3 className="h-4 w-4 mr-2" /> Ver análise
                    </Button>
                    <Button variant="ghost" onClick={() => go('/diario-emocional/nova-entrada')}>
                      <Plus className="h-4 w-4 mr-2" /> Outra data
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-semibold">Como você está se sentindo hoje?</h2>
                    <p className="text-muted-foreground">
                      {streak > 0
                        ? `Você está há ${streak} ${streak === 1 ? 'dia' : 'dias'} registrando. Continue a sequência!`
                        : 'Registre seu dia e acompanhe sua evolução emocional.'}
                    </p>
                  </div>
                  <Button size="lg" className="h-12 px-8 text-base" onClick={() => go('/diario-emocional/nova-entrada')}>
                    <Plus className="h-5 w-5 mr-2" /> Registrar meu dia
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats strip */}
          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <Card className="min-w-[240px] snap-start">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sua semana</span>
                  <span className="text-sm font-semibold">{weekCount}/7</span>
                </div>
                <div className="flex justify-between gap-1">
                  {week.map(d => (
                    <div key={d.date} className="flex flex-col items-center gap-1">
                      <div className={`h-7 w-7 rounded-full border-2 ${d.filled ? 'bg-primary border-primary' : d.date === today ? 'border-primary border-dashed' : 'border-muted bg-muted/40'}`} />
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {parseISODateLocal(d.date).toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[200px] snap-start">
              <CardContent className="p-5 flex items-center gap-4 h-full">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{streak}</div>
                  <p className="text-sm text-muted-foreground">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</p>
                  <p className="text-xs text-muted-foreground">{entries.length} registros no total</p>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[240px] snap-start">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Select value={selectedStatEmotion} onValueChange={setSelectedStatEmotion}>
                    <SelectTrigger className="h-auto w-auto inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-3 py-1 text-sm font-medium border-none shadow-none focus:ring-1 focus:ring-primary/30 [&>svg]:h-3 [&>svg]:w-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeConfigs.map(config => (
                        <SelectItem key={config.emotion_type} value={config.emotion_type}>
                          {config.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">média 7 dias</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{avgSelected === null ? 'N/A' : Math.round(avgSelected)}</span>
                  {avgSelected !== null && <span className="text-muted-foreground">/{selectedScaleMax}</span>}
                  {trend && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend === 'down' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                      {trend === 'up' ? 'subiu' : trend === 'down' ? 'caiu' : 'igual'} vs. semana anterior
                    </span>
                  )}
                </div>
                <Sparkline />
              </CardContent>
            </Card>
          </div>

          {/* Recent entries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Registros recentes</CardTitle>
                <CardDescription>Toque em um registro para ver os detalhes</CardDescription>
              </div>
              {entries.length > 5 && (
                <Button variant="ghost" size="sm" onClick={() => go('/diario-emocional/historico')}>
                  Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookHeart className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-medium">Seu diário ainda está em branco</p>
                  <p className="text-sm text-muted-foreground">O primeiro registro leva menos de um minuto.</p>
                  <Button onClick={() => go('/diario-emocional/nova-entrada')}>
                    <Plus className="h-4 w-4 mr-2" /> Fazer meu primeiro registro
                  </Button>
                </div>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-1">
                  {recentEntries.slice(0, 5).map(entry => {
                    const tags: string[] = Array.isArray((entry as any).tags) ? (entry as any).tags : [];
                    return (
                      <li key={entry.id} className="ml-4">
                        <span className={`absolute -left-[5px] mt-5 h-2.5 w-2.5 rounded-full ring-4 ring-card ${moodDot(entry)}`} />
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(entry)}
                          className="w-full text-left p-3 rounded-lg hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring space-y-1.5"
                        >
                          <p className="text-sm font-medium capitalize">
                            {parseISODateLocal(entry.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            {getAllEmotions(entry, userConfigs).map(emotion => (
                              <span key={emotion.key} className="text-xs rounded-md bg-muted px-2 py-0.5 text-foreground">
                                {emotion.name} <strong>{Math.round(emotion.value)}</strong>
                              </span>
                            ))}
                          </div>
                          {entry.journal_text && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{entry.journal_text}</p>
                          )}
                          {tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {tags.slice(0, 4).map(t => (
                                <Badge key={t} variant="outline" className="text-[10px] text-foreground">#{t}</Badge>
                              ))}
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => go('/diario-emocional/historico')}>
                  <Calendar className="h-4 w-4" /> <span className="text-xs">Histórico</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => go('/diario-emocional/padrao')}>
                  <TrendingUp className="h-4 w-4" /> <span className="text-xs">Meu padrão</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => go('/diario-emocional/analises')}>
                  <BarChart3 className="h-4 w-4" /> <span className="text-xs">Análises</span>
                </Button>
              </div>

              {entries.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  <span className="text-xs text-muted-foreground mr-1">Compartilhar:</span>
                  <Button size="sm" variant="ghost" onClick={() => handleShare('whatsapp')}><Share2 className="h-3.5 w-3.5 mr-1" />WhatsApp</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleShare('telegram')}><Share2 className="h-3.5 w-3.5 mr-1" />Telegram</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleShare('email')}><Mail className="h-3.5 w-3.5 mr-1" />Email</Button>
                  <Button size="sm" variant="ghost" onClick={exportToPDF}><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto">
              <Lock className="h-4 w-4 text-primary" />
              Seus dados são protegidos pela LGPD.
              <span className="text-primary font-medium">Saiba mais</span>
              <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
                <p>
                  Seus dados do diário emocional são <strong>criptografados e protegidos</strong>. Quando compartilhados com instituições parceiras, são sempre <strong>anonimizados e agregados</strong>, impossibilitando a identificação individual.
                </p>
                <p>Você tem total controle sobre seus dados e pode solicitar exclusão a qualquer momento.</p>
                <Link to={buildTenantPath(slug, '/politica-privacidade')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Ver Política de Privacidade
                </Link>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>

      {!todayEntry && (
        <div className="md:hidden fixed bottom-4 left-4 right-20 z-40">
          <Button size="lg" className="w-full h-12 shadow-lg" onClick={() => go('/diario-emocional/nova-entrada')}>
            <Plus className="h-5 w-5 mr-2" /> Registrar meu dia
          </Button>
        </div>
      )}

      <MoodEntryDetailModal
        entry={selectedEntry}
        analysis={selectedEntry ? analysesMap?.get(selectedEntry.id) ?? null : null}
        open={!!selectedEntry}
        onOpenChange={(o) => !o && setSelectedEntry(null)}
        userConfigs={userConfigs}
      />
      <Footer />
    </div>
  );
};

export default MoodDiary;
