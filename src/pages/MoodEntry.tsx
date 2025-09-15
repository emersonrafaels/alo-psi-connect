import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMoodEntries, type MoodEntry } from '@/hooks/useMoodEntries';
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
import { ArrowLeft, Save, Heart, Edit, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MoodEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { getEntryByDate, createOrUpdateEntry } = useMoodEntries();
  const { toast } = useToast();

  const editDate = searchParams.get('date');
  
  const [formData, setFormData] = useState({
    date: editDate || new Date().toISOString().split('T')[0],
    mood_score: [5],
    energy_level: [3],
    anxiety_level: [3],
    sleep_hours: '',
    sleep_quality: [3],
    journal_text: '',
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<MoodEntry | null>(null);

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

  // Redirect non-authenticated users
  useEffect(() => {
    if (!user) {
      navigate('/diario-emocional/experiencia');
    }
  }, [user, navigate]);

  // Check for existing entry on date change
  useEffect(() => {
    if (user && formData.date) {
      checkExistingEntry(formData.date);
    }
  }, [formData.date, user]);

  // Handle initial load with edit date
  useEffect(() => {
    if (editDate && user) {
      checkExistingEntry(editDate);
    }
  }, [editDate, user]);

  const handleSubmit = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const entryData = {
        date: formData.date,
        mood_score: formData.mood_score[0],
        energy_level: formData.energy_level[0],
        anxiety_level: formData.anxiety_level[0],
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : undefined,
        sleep_quality: formData.sleep_quality[0],
        journal_text: formData.journal_text || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      const result = await createOrUpdateEntry(entryData);

      if (result) {
        navigate('/diario-emocional');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    // Prevent selecting future dates
    const today = new Date().toISOString().split('T')[0];
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

  if (!user) {
    return null; // Will redirect
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

          {/* Status Alert */}
          {isEditMode && (
            <Alert>
              <Edit className="h-4 w-4" />
              <AlertDescription>
                Você está editando uma entrada existente para {new Date(formData.date).toLocaleDateString('pt-BR')}. 
                Suas alterações irão sobrescrever os dados anteriores.
              </AlertDescription>
            </Alert>
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
                  max={new Date().toISOString().split('T')[0]}
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

              {/* Journal */}
              <div className="space-y-2">
                <Label htmlFor="journal">Reflexões do Dia (opcional)</Label>
                <Textarea
                  id="journal"
                  value={formData.journal_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, journal_text: e.target.value }))}
                  placeholder="Como foi seu dia? O que você aprendeu? Como se sentiu? Aconteceu algo especial? Use este espaço para refletir sobre seus sentimentos e experiências..."
                  className="min-h-32"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={saving || checkingExisting}
                  className="flex-1 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : (isEditMode ? 'Atualizar Entrada' : 'Salvar Entrada')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/diario-emocional')}
                  disabled={saving || checkingExisting}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodEntry;