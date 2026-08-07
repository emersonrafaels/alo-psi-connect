import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoodEntries, type MoodEntry } from '@/hooks/useMoodEntries';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEmotionConfig } from '@/hooks/useEmotionConfig';
import { DynamicEmotionSlider } from '@/components/DynamicEmotionSlider';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MoodSlider } from '@/components/ui/mood-slider';
import { EnergySlider } from '@/components/ui/energy-slider';
import { AnxietySlider } from '@/components/ui/anxiety-slider';
import { SleepSlider } from '@/components/ui/sleep-slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Heart, Edit, Download, Share, Clock, CheckCircle, XCircle, Settings2, Sparkles, CalendarDays, NotebookPen, Brain } from 'lucide-react';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseISODateLocal, getTodayLocalDateString, normalizeDateForStorage } from '@/lib/utils';
import { EntryComparisonCard } from '@/components/mood/EntryComparisonCard';

const MoodEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const { tenant } = useTenant();
  const { entries: allEntries, getEntryByDate, getEntryById, createOrUpdateEntry } = useMoodEntries();
  const { toast } = useToast();
  const { activeConfigs, loading: configsLoading } = useEmotionConfig();

  const editDate = searchParams.get('date');
  const [selectedTab, setSelectedTab] = useState('texto');
  
  const [formData, setFormData] = useState({
    date: getTodayLocalDateString(),
    emotion_values: {} as Record<string, number>,
    sleep_hours: '',
    sleep_quality: [3],
    journal_text: '',
    audio_url: '',
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<MoodEntry | null>(null);
  const [initialized, setInitialized] = useState(false);

  const emotionCount = Object.keys(formData.emotion_values).length;
  const hasJournal = Boolean(formData.journal_text.trim());
  const moodValue = formData.emotion_values.mood ?? 3;
  const moodLabel = moodValue >= 4 ? 'Mais leve' : moodValue >= 3 ? 'Equilibrado' : 'Mais desafiador';

  // Persistência local DESABILITADA - comportamento estático
  const [localDraft, setLocalDraft, clearLocalDraft] = [null, () => {}, () => {}];

  // Função de salvamento manual direto
  const saveEntry = useCallback(async (data: typeof formData) => {
    if (!user || !profile || !data.date) {
      console.error('❌ Save failed: Missing required data', { 
        hasUser: !!user, 
        hasProfile: !!profile, 
        hasDate: !!data.date 
      });
      throw new Error('Dados insuficientes para salvar');
    }
    
    console.log('💾 Saving entry...', {
      date: data.date,
      emotionValues: data.emotion_values,
      tags: data.tags,
      hasJournal: !!data.journal_text,
      hasAudio: !!data.audio_url
    });
    
    try {
      const entryData = {
        date: normalizeDateForStorage(data.date),
        // Manter compatibilidade retroativa com campos antigos - usar null em vez de undefined
        mood_score: data.emotion_values['mood'] ?? null,
        energy_level: data.emotion_values['energy'] ?? null,
        anxiety_level: data.emotion_values['anxiety'] ?? null,
        // Dados principais - usar null em vez de undefined
        sleep_hours: data.sleep_hours ? parseFloat(data.sleep_hours) : null,
        sleep_quality: data.sleep_quality[0] ?? null,
        journal_text: data.journal_text || null,
        audio_url: data.audio_url || null,
        tags: data.tags && data.tags.length > 0 ? data.tags : null,
        // Salvar todas as emoções dinâmicas
        emotion_values: data.emotion_values,
      };

      console.log('📤 Sending to database:', entryData);

      const result = await createOrUpdateEntry(entryData);
      
      if (result) {
        console.log('✅ Entry saved successfully:', result);
        clearLocalDraft();
        return result;
      } else {
        console.error('❌ Save returned no result');
        throw new Error('Falha ao salvar entrada');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      throw error;
    }
  }, [user, profile, createOrUpdateEntry, clearLocalDraft]);

  // Auto-save hook ainda disponível para futuro uso, mas desabilitado
  const { isSaving: isAutoSaving, saveStatus } = useAutoSave(formData, {
    enabled: false, // DISABLED
    delay: 3000,
    onSave: saveEntry,
    onSuccess: () => {
      console.log('Auto-save successful');
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
    }
  });

  // Check for existing entry when date changes
  const checkExistingEntry = async (date: string) => {
    if (!user) return;
    
    setCheckingExisting(true);
    try {
      const existingEntry = await getEntryByDate(date);
      
      if (existingEntry) {
        // Load existing data into form
        const emotionValues = existingEntry.emotion_values || {
          mood: existingEntry.mood_score,
          energy: existingEntry.energy_level,
          anxiety: existingEntry.anxiety_level,
        };
        
        setFormData({
          date: existingEntry.date,
          emotion_values: emotionValues,
          sleep_hours: existingEntry.sleep_hours?.toString() || '',
          sleep_quality: [existingEntry.sleep_quality || 3],
          journal_text: existingEntry.journal_text || '',
          audio_url: existingEntry.audio_url || '',
          tags: existingEntry.tags || [],
        });
        setCurrentEntry(existingEntry);
        setIsEditMode(true);
      } else {
        // Reset form for new entry - initialize with default values for active emotions
        const initialEmotionValues: Record<string, number> = {};
        activeConfigs.forEach(config => {
          initialEmotionValues[config.emotion_type] = Math.floor((config.scale_min + config.scale_max) / 2);
        });
        
        setFormData({
          date: date,
          emotion_values: initialEmotionValues,
          sleep_hours: '',
          sleep_quality: [3],
          journal_text: '',
          audio_url: '',
          tags: [],
        });
        setCurrentEntry(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Error checking existing entry:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  // Load entry by ID (priority method)
  const loadEntryById = async (id: string) => {
    if (!user) return;
    
    setCheckingExisting(true);
    try {
      const existingEntry = await getEntryById(id);
      
      if (existingEntry) {
        // Load existing data into form
        const emotionValues = existingEntry.emotion_values || {
          mood: existingEntry.mood_score,
          energy: existingEntry.energy_level,
          anxiety: existingEntry.anxiety_level,
        };
        
        setFormData({
          date: existingEntry.date,
          emotion_values: emotionValues,
          sleep_hours: existingEntry.sleep_hours?.toString() || '',
          sleep_quality: [existingEntry.sleep_quality || 3],
          journal_text: existingEntry.journal_text || '',
          audio_url: existingEntry.audio_url || '',
          tags: existingEntry.tags || [],
        });
        setCurrentEntry(existingEntry);
        setIsEditMode(true);
      } else {
        toast({
          title: "Entrada não encontrada",
          description: "A entrada solicitada não foi encontrada ou você não tem permissão para acessá-la.",
          variant: "destructive",
        });
        navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/nova-entrada'));
      }
    } catch (error) {
      console.error('Error loading entry by ID:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a entrada.",
        variant: "destructive",
      });
    } finally {
      setCheckingExisting(false);
    }
  };

  // localStorage DESABILITADO - comportamento estático
  // Sem recuperação automática de rascunhos

  // COMPORTAMENTO ESTÁTICO - Sem recuperação automática de rascunhos
  // COMPORTAMENTO ESTÁTICO - Sem salvamento local automático  
  // COMPORTAMENTO ESTÁTICO - Sem auto-save após transcrição

  // Avisar antes de sair da página com dados não salvos
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving' || isAutoSaving) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações sendo salvas. Tem certeza que deseja sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus, isAutoSaving]);

  // Redirect non-authenticated users
  useEffect(() => {
    if (!user) {
      navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/experiencia'));
    }
  }, [user, navigate]);

  // COMPORTAMENTO ESTÁTICO - Sem carregamento automático de dados
  useEffect(() => {
    if (!user || loading || !profile || configsLoading) {
      return;
    }
    // Inicializar emotion_values com defaults se estiver vazio
    if (Object.keys(formData.emotion_values).length === 0 && activeConfigs.length > 0) {
      const initialEmotionValues: Record<string, number> = {};
      activeConfigs.forEach(config => {
        initialEmotionValues[config.emotion_type] = Math.floor((config.scale_min + config.scale_max) / 2);
      });
      setFormData(prev => ({
        ...prev,
        emotion_values: initialEmotionValues,
      }));
    }
    setInitialized(true);
  }, [user, profile, loading, configsLoading, activeConfigs]);

  // COMPORTAMENTO ESTÁTICO - Sem recarregamento por mudança de data

  const handleSubmit = async () => {
    if (!user) {
      console.error('❌ Cannot save: No user logged in');
      return;
    }

    console.log('🚀 Handle submit initiated');
    
    setSaving(true);
    
    // Mostrar feedback visual imediato
    toast({
      title: "Salvando...",
      description: "Aguarde enquanto salvamos sua entrada.",
    });
    
    try {
      console.log('📝 Current form data:', formData);
      
      // Salvamento direto sem depender do auto-save
      const result = await saveEntry(formData);
      
      console.log('✅ Save completed successfully:', result);
      
      toast({
        title: "✅ Sucesso",
        description: "Entrada salva com sucesso!",
      });
      
      // Limpar rascunho local após salvamento manual bem-sucedido
      clearLocalDraft();
      
      // Pequeno delay para garantir que o usuário veja a confirmação
      setTimeout(() => {
        navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional'));
      }, 500);
      
    } catch (error) {
      console.error('❌ Error saving entry:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar entrada. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    // Prevent selecting future dates
    const today = getTodayLocalDateString();
    if (newDate > today) {
      toast({
        title: "Data inválida",
        description: "Você não pode registrar sentimentos para datas futuras.",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({ ...prev, date: newDate }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const exportToPDF = async () => {
    try {
      const { generateProfessionalPDF, downloadPDF } = await import('@/utils/pdfGenerator');
      
      // Converter formData para o formato DemoMoodEntry
      const moodEntry = {
        id: `temp-${Date.now()}`,
        date: formData.date,
        mood_score: formData.emotion_values['mood'] || 5,
        energy_level: formData.emotion_values['energy'] || 3,
        anxiety_level: formData.emotion_values['anxiety'] || 3,
        sleep_hours: formData.sleep_hours && !isNaN(parseInt(formData.sleep_hours)) ? parseInt(formData.sleep_hours) : undefined,
        sleep_quality: formData.sleep_quality[0],
        journal_text: formData.journal_text || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      // Gerar PDF profissional
      const pdf = generateProfessionalPDF(moodEntry, undefined, {
        includeLogo: true,
        includeStats: false,
        includeGraphs: false
      });

      // Download do PDF
      downloadPDF(pdf, 'diario-emocional');
      
      toast({
        title: "PDF exportado com sucesso!",
        description: "Seu diário emocional foi salvo em PDF.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro ao tentar exportar o PDF.",
        variant: "destructive",
      });
    }
  };

  const shareWhatsApp = () => {
    const date = parseISODateLocal(formData.date).toLocaleDateString('pt-BR');
    const moodValue = formData.emotion_values['mood'] || 5;
    const moodEmoji = ['😢', '😞', '😐', '😊', '😃', '🤩', '😍', '🥰', '😁', '🌟'][moodValue - 1] || '😊';
    
    let message = `*Meu Diário Emocional - ${date}* ${moodEmoji}\n\n`;
    
    // Add dynamic emotions
    activeConfigs.forEach(config => {
      const value = formData.emotion_values[config.emotion_type];
      if (value !== undefined) {
        const emoji = config.emoji_set[value.toString()] || '';
        message += `${emoji} ${config.display_name}: ${value}/${config.scale_max}\n`;
      }
    });
    
    message += `💤 Qualidade do Sono: ${formData.sleep_quality[0]}/5\n`;
    
    if (formData.sleep_hours) {
      message += `🕒 Horas de sono: ${formData.sleep_hours}h\n`;
    }
    
    if (formData.tags.length > 0) {
      message += `🏷️ Tags: ${formData.tags.join(', ')}\n`;
    }
    
    if (formData.journal_text) {
      message += `\n📝 *Reflexões:*\n${formData.journal_text}\n`;
    }
    
    message += `\n_Registrado através do Rede Bem Estar 💚_`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!user) {
    return null; // Will redirect
  }

  if (loading || !profile || configsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Carregando perfil...' : configsLoading ? 'Carregando configurações...' : 'Preparando entrada de humor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.14),_transparent_26%),linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)]">
      <Header />
      <main className="container mx-auto px-4 py-8 lg:py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-br from-primary/10 via-background/90 to-accent/10 p-6 shadow-[0_20px_60px_-24px_hsl(var(--primary)/0.35)] backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-sm font-medium text-primary shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Diário emocional moderno
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {isEditMode ? 'Editar entrada' : 'Registrar seu estado do dia'}
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    {isEditMode
                      ? `Atualize sua entrada de ${new Date(formData.date).toLocaleDateString('pt-BR')} com mais clareza e carinho.`
                      : 'Capture seus sentimentos com uma experiência mais leve, visual e inspirada em uma rotina de autocuidado.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full border border-primary/10 bg-background/70 px-3 py-1.5">
                    <CalendarDays className="mr-2 h-3.5 w-3.5" />
                    {new Date(formData.date).toLocaleDateString('pt-BR')}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full border border-primary/10 bg-background/70 px-3 py-1.5">
                    <Brain className="mr-2 h-3.5 w-3.5" />
                    {emotionCount} emoções registradas
                  </Badge>
                  <Badge variant="secondary" className="rounded-full border border-primary/10 bg-background/70 px-3 py-1.5">
                    <NotebookPen className="mr-2 h-3.5 w-3.5" />
                    {hasJournal ? 'Reflexões prontas' : 'Sem reflexões ainda'}
                  </Badge>
                </div>
              </div>

              <div className="rounded-3xl border border-primary/10 bg-background/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-muted-foreground">Resumo da sua entrada</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-foreground">{moodLabel}</p>
                    <p className="text-sm text-muted-foreground">Nível atual: {moodValue}/5</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(buildTenantPath(tenant?.slug, '/diario-emocional'))}
              className="flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 transition-all hover:-translate-y-0.5 hover:bg-accent/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            {initialized && (
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground shadow-sm">
                {saveStatus === 'saving' || isAutoSaving ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-primary">Salvando automaticamente...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Rascunho salvo automaticamente</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Erro no auto-save. Dados salvos localmente.</span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {isEditMode && (
            <Alert className="rounded-2xl border-primary/20 bg-primary/5">
              <Edit className="h-4 w-4" />
              <AlertDescription>
                Você está editando uma entrada existente para {new Date(formData.date).toLocaleDateString('pt-BR')}. Suas alterações irão sobrescrever os dados anteriores.
              </AlertDescription>
            </Alert>
          )}

          {currentEntry && (() => {
            const previous = allEntries
              .filter((e) => e.date < currentEntry.date)
              .sort((a, b) => b.date.localeCompare(a.date))[0];
            if (!previous) return null;
            return <EntryComparisonCard current={currentEntry as any} previous={previous as any} />;
          })()}

          <Card className="overflow-hidden border-0 shadow-[0_24px_70px_-30px_hsl(var(--primary)/0.35)]">
            <div className="border-b bg-gradient-to-r from-primary/10 via-background to-accent/10 p-6 lg:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Heart className="h-5 w-5 text-primary" />
                    {isEditMode ? 'Editando seus sentimentos' : 'Como você está se sentindo?'}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {isEditMode
                      ? 'Atualize os campos abaixo para modificar seu registro emocional e manter o seu histórico mais completo.'
                      : 'Preencha os campos abaixo para registrar como você se sente na data selecionada com uma experiência mais acolhedora.'}
                  </CardDescription>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1.5 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  {isEditMode ? 'Modo edição' : 'Modo novo registro'}
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-background to-muted/40 p-4 sm:p-5">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-foreground">
                    Data dos Sentimentos
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    max={getTodayLocalDateString()}
                    disabled={checkingExisting}
                    className="h-11 rounded-2xl border-border/70 bg-background/90"
                  />
                  <p className="text-sm text-muted-foreground">
                    Selecione a data em que você estava se sentindo desta forma.
                  </p>
                  {checkingExisting && (
                    <p className="text-sm font-medium text-primary">Verificando entrada existente...</p>
                  )}
                </div>
              </div>

              {activeConfigs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-primary/20 bg-primary/5 p-6 text-center">
                  <p className="mb-4 text-muted-foreground">
                    Você ainda não configurou nenhuma emoção para acompanhar.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/configurar'))}
                    className="rounded-full"
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Configurar Emoções
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeConfigs.map((config) => {
                    const currentValue = formData.emotion_values[config.emotion_type] ?? Math.floor((config.scale_min + config.scale_max) / 2);
                    return (
                      <div key={config.emotion_type} className="rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4">
                        <div className="mb-2 flex justify-end">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:px-3 sm:py-1.5">
                            {currentValue}/{config.scale_max}
                          </span>
                        </div>
                        <DynamicEmotionSlider
                          emotionConfig={config}
                          value={[currentValue]}
                          onValueChange={(value: number[]) =>
                            setFormData(prev => ({
                              ...prev,
                              emotion_values: {
                                ...prev.emotion_values,
                                [config.emotion_type]: value[0],
                              },
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm">
                  <Label htmlFor="sleep_hours" className="text-sm font-semibold text-foreground">
                    Horas de sono
                  </Label>
                  <Input
                    id="sleep_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.sleep_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, sleep_hours: e.target.value }))}
                    placeholder="Ex: 8"
                    className="mt-2 h-11 rounded-2xl border-border/70 bg-background/90"
                  />
                </div>
                <div className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm">
                  <Label className="text-sm font-semibold text-foreground">Qualidade do Sono</Label>
                  <div className="mt-4">
                    <SleepSlider
                      value={formData.sleep_quality}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sleep_quality: value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold text-foreground">
                      Etiquetas para organizar
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use etiquetas para organizar e encontrar suas entradas mais facilmente. Marque momentos importantes como trabalho, família, exercício ou lazer.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Sugestões rápidas</p>
                  <div className="flex flex-wrap gap-2">
                    {['Trabalho', 'Família', 'Exercício', 'Amigos', 'Estudo', 'Lazer'].map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!formData.tags.includes(suggestion)) {
                            setFormData(prev => ({
                              ...prev,
                              tags: [...prev.tags, suggestion]
                            }));
                            toast({
                              title: 'Etiqueta adicionada',
                              description: `"${suggestion}" foi adicionado às suas etiquetas`,
                            });
                          }
                        }}
                        disabled={formData.tags.includes(suggestion)}
                        className="rounded-full px-3 py-1.5 text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Digite uma categoria personalizada"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="h-11 rounded-2xl border-border/70 bg-background/90"
                  />
                  <Button type="button" onClick={addTag} variant="outline" className="rounded-2xl px-4">
                    Adicionar
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Suas etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer rounded-full border border-primary/10 bg-background/80 px-3 py-1.5 transition-all hover:-translate-y-0.5 hover:bg-destructive/10"
                          onClick={() => removeTag(tag)}
                          title="Clique para remover esta etiqueta"
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm">
                <Label className="text-sm font-semibold text-foreground">Reflexões do Dia (opcional)</Label>
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-3 w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/70 p-1">
                    <TabsTrigger value="texto" className="rounded-xl">Texto</TabsTrigger>
                    <TabsTrigger value="audio" className="rounded-xl">Áudio</TabsTrigger>
                  </TabsList>

                  <TabsContent value="texto" className="mt-3 space-y-2">
                    <Textarea
                      id="journal"
                      value={formData.journal_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, journal_text: e.target.value }))}
                      placeholder="Como foi seu dia? O que você aprendeu? Como se sentiu?"
                      className="min-h-32 rounded-2xl border-border/70 bg-background/90"
                    />
                  </TabsContent>

                  <TabsContent value="audio" className="mt-3 space-y-2">
                    <AudioRecorder
                      userId={user?.id || ''}
                      entryDate={formData.date}
                      tenantId={tenant?.id}
                      existingAudioUrl={formData.audio_url || undefined}
                      onAudioUploaded={(audioUrl) => setFormData(prev => ({ ...prev, audio_url: audioUrl }))}
                      onTranscriptionComplete={(transcription, reflection) => {
                        setFormData(prev => ({ ...prev, journal_text: reflection }));
                        setSelectedTab('texto');
                        console.log('🎤 Transcription completed, text updated');
                      }}
                      className="w-full"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row">
                <Button
                  onClick={handleSubmit}
                  disabled={saving || checkingExisting || isAutoSaving}
                  className="flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : isAutoSaving ? 'Auto-salvando...' : (isEditMode ? 'Atualizar Entrada' : 'Salvar Entrada')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional'))}
                  disabled={saving || checkingExisting}
                  className="rounded-2xl px-4 py-2.5"
                >
                  Cancelar
                </Button>
              </div>

              {(isEditMode || Object.keys(formData.emotion_values).length > 0 || formData.journal_text) && (
                <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={exportToPDF}
                    className="flex items-center justify-center gap-2 rounded-2xl"
                    disabled={saving || checkingExisting}
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareWhatsApp}
                    className="flex items-center justify-center gap-2 rounded-2xl"
                    disabled={saving || checkingExisting}
                  >
                    <Share className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodEntry;