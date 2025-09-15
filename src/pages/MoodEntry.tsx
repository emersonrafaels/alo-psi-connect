import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MoodEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createEntry, updateEntry, entries } = useMoodEntries();
  const { toast } = useToast();

  const editDate = searchParams.get('date');
  const isEdit = !!editDate;
  const existingEntry = isEdit ? entries.find(e => e.date === editDate) : null;

  const [formData, setFormData] = useState({
    date: editDate || new Date().toISOString().split('T')[0],
    mood_score: [existingEntry?.mood_score || 5],
    energy_level: [existingEntry?.energy_level || 3],
    anxiety_level: [existingEntry?.anxiety_level || 3],
    sleep_hours: existingEntry?.sleep_hours?.toString() || '',
    sleep_quality: [existingEntry?.sleep_quality || 3],
    journal_text: existingEntry?.journal_text || '',
    tags: existingEntry?.tags || [],
  });

  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  // Redirect non-authenticated users
  useEffect(() => {
    if (!user) {
      navigate('/diario-emocional/experiencia');
    }
  }, [user, navigate]);

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

      let result;
      if (isEdit && existingEntry) {
        result = await updateEntry(existingEntry.id, entryData);
      } else {
        result = await createEntry(entryData);
      }

      if (result) {
        navigate('/diario-emocional');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setSaving(false);
    }
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
                {isEdit ? 'Editar Entrada' : 'Nova Entrada do Diário'}
              </h1>
              <p className="text-muted-foreground">
                {isEdit 
                  ? `Editando entrada de ${new Date(editDate!).toLocaleDateString('pt-BR')}`
                  : 'Registre como você está se sentindo hoje'
                }
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Como você está se sentindo?
              </CardTitle>
              <CardDescription>
                Preencha os campos abaixo para registrar seu estado emocional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Mood Score */}
              <div className="space-y-2">
                <Label>Humor (1-10)</Label>
                <div className="px-3">
                  <Slider
                    value={formData.mood_score}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mood_score: value }))}
                    max={10}
                    min={1}
                    step={1}
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {formData.mood_score[0]}/10 - {
                    formData.mood_score[0] >= 8 ? 'Excelente' :
                    formData.mood_score[0] >= 6 ? 'Bom' :
                    formData.mood_score[0] >= 4 ? 'Regular' : 'Ruim'
                  }
                </div>
              </div>

              {/* Energy Level */}
              <div className="space-y-2">
                <Label>Nível de Energia (1-5)</Label>
                <div className="px-3">
                  <Slider
                    value={formData.energy_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, energy_level: value }))}
                    max={5}
                    min={1}
                    step={1}
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {formData.energy_level[0]}/5 - {
                    formData.energy_level[0] >= 4 ? 'Alto' :
                    formData.energy_level[0] >= 3 ? 'Médio' : 'Baixo'
                  }
                </div>
              </div>

              {/* Anxiety Level */}
              <div className="space-y-2">
                <Label>Nível de Ansiedade (1-5)</Label>
                <div className="px-3">
                  <Slider
                    value={formData.anxiety_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, anxiety_level: value }))}
                    max={5}
                    min={1}
                    step={1}
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {formData.anxiety_level[0]}/5 - {
                    formData.anxiety_level[0] >= 4 ? 'Alto' :
                    formData.anxiety_level[0] >= 3 ? 'Médio' : 'Baixo'
                  }
                </div>
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
                  <Label>Qualidade do Sono (1-5)</Label>
                  <div className="px-3">
                    <Slider
                      value={formData.sleep_quality}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sleep_quality: value }))}
                      max={5}
                      min={1}
                      step={1}
                    />
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    {formData.sleep_quality[0]}/5
                  </div>
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
                  disabled={saving}
                  className="flex-1 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : (isEdit ? 'Atualizar Entrada' : 'Salvar Entrada')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/diario-emocional')}
                  disabled={saving}
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