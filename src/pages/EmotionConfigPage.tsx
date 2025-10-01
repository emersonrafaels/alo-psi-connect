import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Settings2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useEmotionConfig } from '@/hooks/useEmotionConfig';
import { DynamicEmotionSlider } from '@/components/DynamicEmotionSlider';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmotionConfigPage = () => {
  const navigate = useNavigate();
  const {
    userConfigs,
    activeConfigs,
    availableEmotions,
    loading,
    currentTemplate,
    addEmotion,
    addCustomEmotion,
    removeEmotion,
    toggleEmotion,
    applyTemplate,
  } = useEmotionConfig();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, number>>({});
  const [customEmotionName, setCustomEmotionName] = useState('');
  const [customScale, setCustomScale] = useState<{ min: number; max: number }>({ min: 1, max: 10 });

  const handleAddEmotion = async (emotionType: string) => {
    try {
      await addEmotion(emotionType);
      toast.success('Emoção adicionada com sucesso!');
      setAddDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar emoção');
    }
  };

  const handleRemoveEmotion = async (emotionType: string) => {
    try {
      await removeEmotion(emotionType);
      toast.success('Emoção removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover emoção');
    }
  };

  const handleToggleEmotion = async (emotionType: string) => {
    try {
      await toggleEmotion(emotionType);
      toast.success('Configuração atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleApplyTemplate = async (category: 'basic' | 'advanced' | 'wellbeing' | 'professional') => {
    try {
      await applyTemplate(category);
      toast.success('Template aplicado com sucesso!');
    } catch (error) {
      toast.error('Erro ao aplicar template');
    }
  };

  const handleAddCustomEmotion = async () => {
    if (!customEmotionName.trim()) {
      toast.error('Digite um nome para a emoção');
      return;
    }

    if (customEmotionName.length > 30) {
      toast.error('Nome muito longo (máximo 30 caracteres)');
      return;
    }

    try {
      // Generate basic emoji set and color scheme
      const emojiSet: Record<string, string> = {};
      const colorScheme: Record<string, string> = {};
      
      for (let i = customScale.min; i <= customScale.max; i++) {
        emojiSet[i.toString()] = i <= Math.floor((customScale.max + customScale.min) / 2) ? '😔' : '😊';
        colorScheme[i.toString()] = i <= Math.floor((customScale.max + customScale.min) / 2) ? '#ef4444' : '#22c55e';
      }

      await addCustomEmotion(customEmotionName, customScale.min, customScale.max, emojiSet, colorScheme);
      toast.success('Emoção personalizada criada!');
      setCustomEmotionName('');
      setCustomScale({ min: 1, max: 10 });
      setAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar emoção personalizada');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basic: 'Básico',
      advanced: 'Avançado',
      wellbeing: 'Bem-estar',
      professional: 'Completo',
      custom: 'Personalizado',
    };
    return labels[category] || category;
  };

  const getTemplateDescription = (template: string) => {
    const descriptions: Record<string, string> = {
      basic: '3 emoções essenciais para começar',
      advanced: '6 emoções para análise mais profunda',
      wellbeing: '6 emoções focadas em bem-estar',
      professional: '12 emoções para análise completa',
      custom: 'Configuração personalizada por você',
    };
    return descriptions[template] || '';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      advanced: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      wellbeing: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
      professional: 'bg-green-500/10 text-green-700 dark:text-green-300',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/diario-emocional')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurar Emoções</h1>
            <p className="text-muted-foreground">Personalize quais emoções você deseja acompanhar</p>
          </div>
        </div>

        {/* Current Template Indicator */}
        {currentTemplate && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Template Atual:</span>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {getCategoryLabel(currentTemplate)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getTemplateDescription(currentTemplate)}
                  </p>
                </div>
                {currentTemplate !== 'custom' && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Templates Rápidos</CardTitle>
            <CardDescription>Escolha um conjunto pré-definido de emoções</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => handleApplyTemplate('basic')}
            >
              <Settings2 className="h-5 w-5 mb-2" />
              <span className="font-medium">Básico</span>
              <span className="text-xs text-muted-foreground">3 emoções</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => handleApplyTemplate('advanced')}
            >
              <Settings2 className="h-5 w-5 mb-2" />
              <span className="font-medium">Avançado</span>
              <span className="text-xs text-muted-foreground">6 emoções</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => handleApplyTemplate('wellbeing')}
            >
              <Settings2 className="h-5 w-5 mb-2" />
              <span className="font-medium">Bem-estar</span>
              <span className="text-xs text-muted-foreground">6 emoções</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => handleApplyTemplate('professional')}
            >
              <Settings2 className="h-5 w-5 mb-2" />
              <span className="font-medium">Completo</span>
              <span className="text-xs text-muted-foreground">12 emoções</span>
            </Button>
          </CardContent>
        </Card>

        {/* Current Emotions */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Suas Emoções</CardTitle>
              <CardDescription>
                {activeConfigs.length} {activeConfigs.length === 1 ? 'emoção ativa' : 'emoções ativas'}
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Emoção</DialogTitle>
                  <DialogDescription>
                    Escolha uma emoção predefinida ou crie uma personalizada
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="predefined" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="predefined">Emoções Predefinidas</TabsTrigger>
                    <TabsTrigger value="custom">Criar Personalizada</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="predefined" className="space-y-4 mt-4">
                    {availableEmotions.map((emotion) => {
                    const previewValue = previewValues[emotion.emotion_type] || Math.floor((emotion.default_scale_min + emotion.default_scale_max) / 2);
                    
                    return (
                      <Card key={emotion.id} className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{emotion.display_name}</h4>
                              <Badge className={getCategoryColor(emotion.category)}>
                                {getCategoryLabel(emotion.category)}
                              </Badge>
                            </div>
                            {emotion.description && (
                              <p className="text-sm text-muted-foreground">{emotion.description}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddEmotion(emotion.emotion_type)}
                          >
                            Adicionar
                          </Button>
                        </div>
                        <DynamicEmotionSlider
                          emotionConfig={{
                            id: emotion.id,
                            emotion_type: emotion.emotion_type,
                            display_name: emotion.display_name,
                            description: emotion.description,
                            scale_min: emotion.default_scale_min,
                            scale_max: emotion.default_scale_max,
                            emoji_set: emotion.default_emoji_set,
                            color_scheme: emotion.default_color_scheme,
                            is_enabled: true,
                            order_position: 0,
                          }}
                          value={[previewValue]}
                          onValueChange={(value) => setPreviewValues({
                            ...previewValues,
                            [emotion.emotion_type]: value[0],
                          })}
                        />
                      </Card>
                    );
                  })}
                    {availableEmotions.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Todas as emoções predefinidas já foram adicionadas!
                      </p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="custom" className="space-y-4 mt-4">
                    <Card className="p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="emotion-name">Nome da Emoção</Label>
                          <Input
                            id="emotion-name"
                            placeholder="Ex: Criatividade, Foco, Relaxamento..."
                            value={customEmotionName}
                            onChange={(e) => setCustomEmotionName(e.target.value)}
                            maxLength={30}
                          />
                          <p className="text-xs text-muted-foreground">
                            {customEmotionName.length}/30 caracteres
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="scale-min">Valor Mínimo</Label>
                            <Input
                              id="scale-min"
                              type="number"
                              min={0}
                              max={9}
                              value={customScale.min}
                              onChange={(e) => setCustomScale({ ...customScale, min: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="scale-max">Valor Máximo</Label>
                            <Input
                              id="scale-max"
                              type="number"
                              min={2}
                              max={10}
                              value={customScale.max}
                              onChange={(e) => setCustomScale({ ...customScale, max: parseInt(e.target.value) || 10 })}
                            />
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Preview da escala: {customScale.min} a {customScale.max}
                          </p>
                          <div className="flex gap-2">
                            {Array.from({ length: customScale.max - customScale.min + 1 }, (_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-8 rounded bg-primary/20 flex items-center justify-center text-xs font-medium"
                              >
                                {customScale.min + i}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={handleAddCustomEmotion}
                          className="w-full"
                          disabled={!customEmotionName.trim()}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Criar Emoção Personalizada
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {userConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{config.display_name}</span>
                    <span className="text-2xl">{config.emoji_set[config.scale_min.toString()]}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Escala de {config.scale_min} a {config.scale_max}
                  </p>
                </div>
                <Switch
                  checked={config.is_enabled}
                  onCheckedChange={() => handleToggleEmotion(config.emotion_type)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveEmotion(config.emotion_type)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {userConfigs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma emoção configurada. Clique em "Adicionar" para começar!
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default EmotionConfigPage;
