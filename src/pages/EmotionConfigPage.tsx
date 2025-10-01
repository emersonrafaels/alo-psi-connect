import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
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

const EmotionConfigPage = () => {
  const navigate = useNavigate();
  const {
    userConfigs,
    activeConfigs,
    availableEmotions,
    loading,
    addEmotion,
    removeEmotion,
    toggleEmotion,
    applyTemplate,
  } = useEmotionConfig();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, number>>({});

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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basic: 'Básico',
      advanced: 'Avançado',
      wellbeing: 'Bem-estar',
      professional: 'Profissional',
    };
    return labels[category] || category;
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
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Emoção</DialogTitle>
                  <DialogDescription>
                    Escolha uma emoção para adicionar ao seu diário
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                      Todas as emoções disponíveis já foram adicionadas!
                    </p>
                  )}
                </div>
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
