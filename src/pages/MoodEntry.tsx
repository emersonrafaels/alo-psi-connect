import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoodEntries, type MoodEntry } from '@/hooks/useMoodEntries';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAutoSave } from '@/hooks/useAutoSave';
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
import { ArrowLeft, Save, Heart, Edit, AlertCircle, Download, Share, Clock, CheckCircle, XCircle } from 'lucide-react';
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

  const editDate = searchParams.get('date');
  const [selectedTab, setSelectedTab] = useState('texto');
  
  const [formData, setFormData] = useState({
    date: getTodayLocalDateString(), // Always start with today, will be updated by useEffect
    mood_score: [5],
    energy_level: [3],
    anxiety_level: [3],
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

  // Persistência local para rascunhos
  const [localDraft, setLocalDraft, clearLocalDraft] = useLocalStorage(`mood-entry-draft-${user?.id}`, null);

  // Função para auto-save
  const autoSaveEntry = useCallback(async (data: any) => {
    if (!user || !profile || !data.date) return;
    
    try {
      const entryData = {
        date: normalizeDateForStorage(data.date),
        mood_score: data.mood_score[0],
        energy_level: data.energy_level[0],
        anxiety_level: data.anxiety_level[0],
        sleep_hours: data.sleep_hours ? parseFloat(data.sleep_hours) : undefined,
        sleep_quality: data.sleep_quality[0],
        journal_text: data.journal_text || undefined,
        audio_url: data.audio_url || undefined,
        tags: data.tags.length > 0 ? data.tags : undefined,
      };

      const result = await createOrUpdateEntry(entryData);
      if (result) {
        // Limpar rascunho local após salvamento bem-sucedido
        clearLocalDraft();
        return result;
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    }
  }, [user, profile, createOrUpdateEntry, clearLocalDraft]);

  // Auto-save hook
  const { isSaving: isAutoSaving, saveStatus, forceSave } = useAutoSave(formData, {
    enabled: initialized && !checkingExisting && formData.date !== '',
    delay: 3000, // 3 segundos de delay
    onSave: autoSaveEntry,
    onSuccess: () => {
      console.log('Auto-save successful');
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
      // Salvar no localStorage como backup em caso de erro
      setLocalDraft(formData);
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
        setFormData({
          date: existingEntry.date,
          mood_score: [existingEntry.mood_score],
          energy_level: [existingEntry.energy_level],
          anxiety_level: [existingEntry.anxiety_level],
          sleep_hours: existingEntry.sleep_hours?.toString() || '',
          sleep_quality: [existingEntry.sleep_quality || 3],
          journal_text: existingEntry.journal_text || '',
          audio_url: existingEntry.audio_url || '',
          tags: existingEntry.tags || [],
        });
        setCurrentEntry(existingEntry);
        setIsEditMode(true);
      } else {
        // Reset form for new entry
        setFormData({
          date: date,
          mood_score: [5],
          energy_level: [3],
          anxiety_level: [3],
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
        setFormData({
          date: existingEntry.date,
          mood_score: [existingEntry.mood_score],
          energy_level: [existingEntry.energy_level],
          anxiety_level: [existingEntry.anxiety_level],
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

  // Recuperar rascunho local no carregamento
  useEffect(() => {
    if (localDraft && !initialized && user) {
      console.log('Recuperando rascunho local:', localDraft);
      setFormData(localDraft);
      toast({
        title: "Rascunho recuperado",
        description: "Suas alterações não salvas foram recuperadas.",
      });
    }
  }, [localDraft, initialized, user, toast]);

  // Salvar rascunho local a cada mudança
  useEffect(() => {
    if (initialized && user && formData.date) {
      setLocalDraft(formData);
    }
  }, [formData, initialized, user, setLocalDraft]);

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

  // Main initialization and data loading effect - Wait for both user and profile
  useEffect(() => {
    if (!user || loading || !profile) {
      console.log('MoodEntry: Waiting for dependencies:', { 
        user: !!user, 
        loading, 
        profile: !!profile 
      });
      return;
    }

    const entryId = searchParams.get('id');
    const urlDate = searchParams.get('date');
    
    if (entryId) {
      // Load by ID (priority method - more reliable)
      console.log('MoodEntry: Loading entry by ID:', entryId);
      loadEntryById(entryId);
    } else {
      // Load by date (fallback method)
      const targetDate = urlDate || getTodayLocalDateString();
      console.log('MoodEntry: Loading data for date:', targetDate, 'Profile ID:', profile.id);
      checkExistingEntry(targetDate);
    }
    
    setInitialized(true);
  }, [user, profile, loading, searchParams]);

  // Handle user-initiated date changes (when user changes date in the UI)
  useEffect(() => {
    if (!user || !profile || !initialized) return;
    
    // Only trigger for user changes, not initial load or URL-based dates
    if (!editDate && formData.date !== getTodayLocalDateString()) {
      console.log('User changed date to:', formData.date);
      checkExistingEntry(formData.date);
    }
  }, [formData.date, user, profile, initialized, editDate]);

  const handleSubmit = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await forceSave(); // Forçar auto-save imediato
      
      toast({
        title: "Sucesso",
        description: "Entrada salva com sucesso!",
      });
      
      // Limpar rascunho local após salvamento manual bem-sucedido
      clearLocalDraft();
      
      navigate('/diario-emocional');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar entrada. Tente novamente.",
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
        id: `temp-${Date.now()}`, // ID temporário para a entrada
        date: formData.date,
        mood_score: formData.mood_score[0],
        energy_level: formData.energy_level[0],
        anxiety_level: formData.anxiety_level[0],
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
    const moodEmoji = ['😢', '😞', '😐', '😊', '😃', '🤩', '😍', '🥰', '😁', '🌟'][formData.mood_score[0] - 1] || '😊';
    
    let message = `*Meu Diário Emocional - ${date}* ${moodEmoji}\n\n`;
    message += `💭 Humor: ${formData.mood_score[0]}/10\n`;
    message += `⚡ Energia: ${formData.energy_level[0]}/5\n`;
    message += `😰 Ansiedade: ${formData.anxiety_level[0]}/5\n`;
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Carregando perfil...' : 'Preparando entrada de humor...'}
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

              {/* Mood Score */}
              <div className="space-y-2">
                <Label>Humor</Label>
                <MoodSlider
                  value={formData.mood_score}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mood_score: value }))}
                />
              </div>

              {/* Energy Level */}
              <div className="space-y-2">
                <Label>Nível de Energia</Label>
                <EnergySlider
                  value={formData.energy_level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, energy_level: value }))}
                />
              </div>

              {/* Anxiety Level */}
              <div className="space-y-2">
                <Label>Nível de Ansiedade</Label>
                <AnxietySlider
                  value={formData.anxiety_level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, anxiety_level: value }))}
                />
              </div>

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
              <div className="space-y-2">
                <Label>Tags (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ex: trabalho, exercício, família"
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
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
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
                        
                        // Auto-save after transcription
                        setTimeout(() => {
                          forceSave();
                        }, 1000);
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
              {(isEditMode || formData.mood_score[0] || formData.journal_text) && (
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