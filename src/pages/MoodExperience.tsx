import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodExperience } from '@/hooks/useMoodExperience';
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
import { AlertCircle, Heart, User, Calendar, TrendingUp, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const MoodExperience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    demoEntries, 
    canAddMore, 
    entriesLeft, 
    addDemoEntry, 
    getDemoStats,
    isAtLimit 
  } = useMoodExperience();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mood_score: [5],
    energy_level: [3],
    anxiety_level: [3],
    sleep_hours: '',
    sleep_quality: [3],
    journal_text: '',
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = () => {
    if (!canAddMore) {
      toast({
        title: "Limite alcançado",
        description: "Você atingiu o limite de entradas para a experiência demo. Faça login para continuar!",
        variant: "destructive",
      });
      return;
    }

    const success = addDemoEntry({
      date: formData.date,
      mood_score: formData.mood_score[0],
      energy_level: formData.energy_level[0],
      anxiety_level: formData.anxiety_level[0],
      sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : undefined,
      sleep_quality: formData.sleep_quality[0],
      journal_text: formData.journal_text || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    });

    if (success) {
      toast({
        title: "Entrada adicionada!",
        description: `Você tem ${entriesLeft - 1} entradas restantes na experiência demo.`,
      });
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mood_score: [5],
        energy_level: [3],
        anxiety_level: [3],
        sleep_hours: '',
        sleep_quality: [3],
        journal_text: '',
        tags: [],
      });
      setNewTag('');
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

  const stats = getDemoStats();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Experimente o Diário Emocional
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Teste nossa ferramenta de acompanhamento emocional gratuitamente. 
              Você pode registrar até {entriesLeft} entradas na versão de experiência.
            </p>
          </div>

          {/* Demo Status */}
          <Alert className="border-primary/20 bg-primary/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Experiência:</strong> Você está testando o diário emocional. 
              {canAddMore 
                ? ` Restam ${entriesLeft} entradas. Para acesso completo, `
                : ' Você atingiu o limite de entradas. Para continuar, '
              }
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary" 
                onClick={() => navigate('/auth')}
              >
                faça login ou cadastre-se gratuitamente
              </Button>.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Entry Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {canAddMore ? 'Como você está se sentindo hoje?' : 'Limite de Entradas Atingido'}
                </CardTitle>
                <CardDescription>
                  {canAddMore 
                    ? 'Registre seus sentimentos e emoções do dia'
                    : 'Para continuar usando o diário emocional, faça login ou cadastre-se'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {canAddMore ? (
                  <>
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
                        placeholder="Como foi seu dia? O que você aprendeu? Como se sentiu..."
                        className="min-h-24"
                      />
                    </div>

                    <Button onClick={handleSubmit} className="w-full">
                      Registrar Entrada ({entriesLeft} restantes)
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      Você atingiu o limite de 3 entradas na experiência demo.
                    </p>
                    <div className="space-y-2">
                      <Button onClick={() => navigate('/auth')} className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Fazer Login / Cadastro
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        100% gratuito • Sem limite de entradas • Análises avançadas
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Demo Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Suas Estatísticas Demo
                </CardTitle>
                <CardDescription>
                  Veja como seria seu acompanhamento emocional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{stats.avgMood}</div>
                        <div className="text-sm text-muted-foreground">Humor Médio</div>
                      </div>
                      <div className="text-center p-4 bg-secondary/5 rounded-lg">
                        <div className="text-2xl font-bold text-secondary">{stats.totalEntries}</div>
                        <div className="text-sm text-muted-foreground">Entradas</div>
                      </div>
                      <div className="text-center p-4 bg-accent/5 rounded-lg">
                        <div className="text-2xl font-bold text-accent">{stats.avgEnergy}</div>
                        <div className="text-sm text-muted-foreground">Energia Média</div>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-lg">
                        <div className="text-2xl font-bold">{stats.avgAnxiety}</div>
                        <div className="text-sm text-muted-foreground">Ansiedade Média</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Últimas Entradas</h4>
                      {demoEntries.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {new Date(entry.date).toLocaleDateString('pt-BR')}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${
                              entry.mood_score >= 7 ? 'bg-green-500' : 
                              entry.mood_score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Humor: {entry.mood_score}/10 • Energia: {entry.energy_level}/5
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Adicione sua primeira entrada para ver as estatísticas
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Na versão completa você terá:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Entradas ilimitadas</li>
                    <li>• Gráficos e análises avançadas</li>
                    <li>• Histórico completo</li>
                    <li>• Insights personalizados</li>
                    <li>• Integração com consultas</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => navigate('/auth')}
                  >
                    Liberar Versão Completa Grátis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodExperience;