import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Settings2, Sparkles, Check } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
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


const EmotionConfigPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
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
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  // Fixed 1-5 scale with gradual emojis and colors
  const scaleEmojis: Record<number, string> = {
    1: '😢',
    2: '😔', 
    3: '😐',
    4: '😊',
    5: '🤩',
  };

  const scaleColors: Record<number, string> = {
    1: '#ef4444',
    2: '#f97316',
    3: '#eab308',
    4: '#22c55e',
    5: '#059669',
  };

  const popularEmotions = [
    'Criatividade', 'Foco', 'Relaxamento', 'Motivação',
    'Confiança', 'Produtividade', 'Paciência', 'Gratidão',
    'Clareza', 'Disposição', 'Calma', 'Inspiração'
  ];

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
    setApplyingTemplate(category);
    try {
      await applyTemplate(category);
      toast.success('Template aplicado com sucesso!');
    } catch (error) {
      toast.error('Erro ao aplicar template');
    } finally {
      setApplyingTemplate(null);
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

    // Check for duplicate names
    const existingNames = userConfigs.map(c => c.display_name.toLowerCase());
    if (existingNames.includes(customEmotionName.trim().toLowerCase())) {
      toast.error('Já existe uma emoção com este nome');
      return;
    }

    try {
      // Generate 5-level emoji set and color scheme
      const emojiSet: Record<string, string> = {};
      const colorScheme: Record<string, string> = {};
      
      for (let i = 1; i <= 5; i++) {
        emojiSet[i.toString()] = scaleEmojis[i];
        colorScheme[i.toString()] = scaleColors[i];
      }

      await addCustomEmotion(customEmotionName, 1, 5, emojiSet, colorScheme);
      toast.success('Emoção personalizada criada!');
      setCustomEmotionName('');
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
      wellbeing: '5 emoções focadas em bem-estar',
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
            onClick={() => navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional'))}
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
              variant={currentTemplate === 'basic' ? 'default' : 'outline'}
              className="h-auto flex-col py-4 relative"
              onClick={() => handleApplyTemplate('basic')}
              disabled={applyingTemplate !== null}
            >
              {applyingTemplate === 'basic' ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="font-semibold text-sm">Aplicando...</span>
                </div>
              ) : (
                <>
                  {currentTemplate === 'basic' ? (
                    <>
                      <div className="absolute -top-2 -right-2 h-7 w-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <Check className="h-5 w-5 mb-2" />
                    </>
                  ) : (
                    <Settings2 className="h-5 w-5 mb-2" />
                  )}
                  <span className="font-medium">Básico</span>
                  <span className="text-xs text-muted-foreground">3 emoções</span>
                </>
              )}
            </Button>
            <Button
              variant={currentTemplate === 'advanced' ? 'default' : 'outline'}
              className="h-auto flex-col py-4 relative"
              onClick={() => handleApplyTemplate('advanced')}
              disabled={applyingTemplate !== null}
            >
              {applyingTemplate === 'advanced' ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="font-semibold text-sm">Aplicando...</span>
                </div>
              ) : (
                <>
                  {currentTemplate === 'advanced' ? (
                    <>
                      <div className="absolute -top-2 -right-2 h-7 w-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <Check className="h-5 w-5 mb-2" />
                    </>
                  ) : (
                    <Settings2 className="h-5 w-5 mb-2" />
                  )}
                  <span className="font-medium">Avançado</span>
                  <span className="text-xs text-muted-foreground">6 emoções</span>
                </>
              )}
            </Button>
            <Button
              variant={currentTemplate === 'wellbeing' ? 'default' : 'outline'}
              className="h-auto flex-col py-4 relative"
              onClick={() => handleApplyTemplate('wellbeing')}
              disabled={applyingTemplate !== null}
            >
              {applyingTemplate === 'wellbeing' ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="font-semibold text-sm">Aplicando...</span>
                </div>
              ) : (
                <>
                  {currentTemplate === 'wellbeing' ? (
                    <>
                      <div className="absolute -top-2 -right-2 h-7 w-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <Check className="h-5 w-5 mb-2" />
                    </>
                  ) : (
                    <Settings2 className="h-5 w-5 mb-2" />
                  )}
                  <span className="font-medium">Bem-estar</span>
                  <span className="text-xs text-muted-foreground">5 emoções</span>
                </>
              )}
            </Button>
            <Button
              variant={currentTemplate === 'professional' ? 'default' : 'outline'}
              className="h-auto flex-col py-4 relative"
              onClick={() => handleApplyTemplate('professional')}
              disabled={applyingTemplate !== null}
            >
              {applyingTemplate === 'professional' ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="font-semibold text-sm">Aplicando...</span>
                </div>
              ) : (
                <>
                  {currentTemplate === 'professional' ? (
                    <>
                      <div className="absolute -top-2 -right-2 h-7 w-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <Check className="h-5 w-5 mb-2" />
                    </>
                  ) : (
                    <Settings2 className="h-5 w-5 mb-2" />
                  )}
                  <span className="font-medium">Completo</span>
                  <span className="text-xs text-muted-foreground">12 emoções</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Emotions */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Suas Emoções
                <Badge variant="secondary">
                  {activeConfigs.length} {activeConfigs.length === 1 ? 'ativa' : 'ativas'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {currentTemplate && currentTemplate !== 'custom' && (
                  <>Template: {getCategoryLabel(currentTemplate)}</>
                )}
                {currentTemplate === 'custom' && (
                  <>Configuração personalizada</>
                )}
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Criar Emoção Personalizada</DialogTitle>
                  <DialogDescription>
                    Crie uma emoção personalizada com seu próprio nome e escala
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
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

                  {/* Popular Suggestions */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Sugestões populares:</Label>
                    <div className="flex flex-wrap gap-2">
                      {popularEmotions.map(name => (
                        <Badge 
                          key={name} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                          onClick={() => setCustomEmotionName(name)}
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Fixed Scale Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Escala de medição</Label>
                      <Badge variant="secondary" className="text-xs">1 a 5 (padrão)</Badge>
                    </div>
                    
                    {/* Visual Scale Preview */}
                    <div className="p-4 rounded-xl border bg-gradient-to-br from-muted/30 to-muted/60">
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div
                            key={value}
                            className="flex flex-col items-center gap-1 p-3 rounded-lg transition-transform hover:scale-105"
                            style={{
                              backgroundColor: scaleColors[value] + '15',
                              borderWidth: 1,
                              borderColor: scaleColors[value] + '40',
                            }}
                          >
                            <span className="text-2xl">{scaleEmojis[value]}</span>
                            <span 
                              className="text-sm font-semibold"
                              style={{ color: scaleColors[value] }}
                            >
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-3">
                        Você poderá avaliar sua {customEmotionName || 'emoção'} de 1 a 5 diariamente
                      </p>
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
