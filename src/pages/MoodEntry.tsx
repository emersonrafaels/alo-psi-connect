import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoodEntries, type MoodEntry } from '@/hooks/useMoodEntries';
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
import { ArrowLeft, Save, Heart, Edit, AlertCircle, Download, Share, Clock, CheckCircle, XCircle, Settings2 } from 'lucide-react';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseISODateLocal, getTodayLocalDateString, normalizeDateForStorage } from '@/lib/utils';

const MoodEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const { getEntryByDate, getEntryById, createOrUpdateEntry } = useMoodEntries();
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
        navigate('/diario-emocional/nova-entrada');
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
      navigate('/diario-emocional/experiencia');
    }
  }, [user, navigate]);

  // COMPORTAMENTO ESTÁTICO - Sem carregamento automático de dados
  useEffect(() => {
    if (!user || loading || !profile) {
      return;
    }
    setInitialized(true);
  }, [user, profile, loading]);

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
        navigate('/diario-emocional');
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
      message += `🕒 Horas de Sono: ${formData.sleep_hours}h\n`;
    }
    
    if (formData.tags.length > 0) {
      message += `🏷️ Tags: ${formData.tags.join(', ')}\n`;
    }
    
    if (formData.journal_text) {
      message += `\n📝 *Reflexões:*\n${formData.journal_text}\n`;
    }
    
    message += `\n_Registrado através do Alô, Psi! 💚_`;
    
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold">
                {isEditMode ? 'Editar Entrada' : 'Nova Entrada do Diário'}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode 
                  ? `Editando entrada de ${new Date(formData.date).toLocaleDateString('pt-BR')}`
                  : 'Registre como você está se sentindo na data selecionada'
                }
              </p>
            </div>
          </div>

              {/* Status Alerts */}
          {isEditMode && (
            <Alert>
              <Edit className="h-4 w-4" />
              <AlertDescription>
                Você está editando uma entrada existente para {new Date(formData.date).toLocaleDateString('pt-BR')}. 
                Suas alterações irão sobrescrever os dados anteriores.
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-save Status */}
          {initialized && (
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' || isAutoSaving ? (
                <>
                  <Clock className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-blue-600">Salvando automaticamente...</span>
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

          {/* Auto-save Status */}
          {initialized && (
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' || isAutoSaving ? (
                <>
                  <Clock className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-blue-600">Salvando automaticamente...</span>
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

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                {isEditMode ? 'Editando seus sentimentos' : 'Como você está se sentindo?'}
              </CardTitle>
              <CardDescription>
                {isEditMode 
                  ? 'Atualize os campos abaixo para modificar seu registro emocional'
                  : 'Preencha os campos abaixo para registrar como você se sente na data selecionada'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Data dos Sentimentos</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={getTodayLocalDateString()}
                  disabled={checkingExisting}
                />
                <p className="text-sm text-muted-foreground">
                  Selecione a data em que você estava se sentindo desta forma
                </p>
                {checkingExisting && (
                  <p className="text-sm text-blue-600">Verificando entrada existente...</p>
                )}
              </div>

              {/* Dynamic Emotions */}
              {activeConfigs.length === 0 ? (
                <div className="p-6 border border-dashed rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">
                    Você ainda não configurou nenhuma emoção para acompanhar.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/diario-emocional/configurar')}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Configurar Emoções
                  </Button>
                </div>
              ) : (
                activeConfigs.map((config) => {
                  const currentValue = formData.emotion_values[config.emotion_type] ?? Math.floor((config.scale_min + config.scale_max) / 2);
                  return (
                    <div key={config.emotion_type} className="space-y-2">
                      <Label>{config.display_name}</Label>
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
                })
              )}

              {/* Sleep */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sleep_hours">Horas de Sono</Label>
                  <Input
                    id="sleep_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.sleep_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, sleep_hours: e.target.value }))}
                    placeholder="Ex: 8"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualidade do Sono</Label>
                  <SleepSlider
                    value={formData.sleep_quality}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sleep_quality: value }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      🏷️ Etiquetas para organizar
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use etiquetas para organizar e encontrar suas entradas mais facilmente. 
                    Marque momentos importantes como: trabalho estressante, dia em família, exercício físico, etc.
                  </p>
                </div>

                {/* Quick Tag Suggestions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Sugestões rápidas:</p>
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
                              title: "Etiqueta adicionada",
                              description: `"${suggestion}" foi adicionado às suas etiquetas`,
                            });
                          }
                        }}
                        disabled={formData.tags.includes(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tag Input */}
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Digite uma categoria personalizada (ex: terapia, meditação...)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Adicionar
                  </Button>
                </div>

                {/* Display Tags */}
                {formData.tags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Suas etiquetas (clique para remover):</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-destructive/20 hover:border-destructive transition-all duration-200 animate-scale-in px-3 py-1.5" 
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

              {/* Journal & Audio */}
              <div className="space-y-3">
                <Label>Reflexões do Dia (opcional)</Label>
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="texto">Texto</TabsTrigger>
                    <TabsTrigger value="audio">Áudio</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="texto" className="space-y-2">
                    <Textarea
                      id="journal"
                      value={formData.journal_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, journal_text: e.target.value }))}
                      placeholder="Como foi seu dia? O que você aprendeu? Como se sentiu? Aconteceu algo especial? Use este espaço para refletir sobre seus sentimentos e experiências..."
                      className="min-h-32"
                    />
                  </TabsContent>
                  
                  <TabsContent value="audio" className="space-y-2">
                    <AudioRecorder
                      userId={user?.id || ''}
                      entryDate={formData.date}
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

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={saving || checkingExisting || isAutoSaving}
                  className="flex-1 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : isAutoSaving ? 'Auto-salvando...' : (isEditMode ? 'Atualizar Entrada' : 'Salvar Entrada')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/diario-emocional')}
                  disabled={saving || checkingExisting}
                >
                  Cancelar
                </Button>
              </div>

              {/* Export and Share */}
              {(isEditMode || Object.keys(formData.emotion_values).length > 0 || formData.journal_text) && (
                <div className="flex gap-3 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    onClick={exportToPDF}
                    className="flex items-center gap-2"
                    disabled={saving || checkingExisting}
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={shareWhatsApp}
                    className="flex items-center gap-2"
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