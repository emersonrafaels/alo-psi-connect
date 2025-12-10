import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Brain, 
  MessageSquare, 
  Mic, 
  BarChart3, 
  Sparkles, 
  ClipboardList,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

interface AIConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  configKey: string;
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
}

const AVAILABLE_MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Padrão)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { value: 'openai/gpt-5', label: 'GPT-5' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano' },
];

const AI_CONFIGS: Omit<AIConfig, 'enabled' | 'model' | 'temperature' | 'maxTokens' | 'topP' | 'frequencyPenalty' | 'presencePenalty' | 'systemPrompt'>[] = [
  {
    id: 'ai-assistant',
    name: 'Assistente IA',
    description: 'Chat inteligente para busca de profissionais e orientação aos usuários',
    icon: MessageSquare,
    configKey: 'ai_assistant',
  },
  {
    id: 'audio-transcription',
    name: 'Transcrição de Áudio',
    description: 'Transcreve e analisa áudios do diário emocional com reflexões empáticas',
    icon: Mic,
    configKey: 'audio_transcription',
  },
  {
    id: 'mood-insights',
    name: 'Insights de Humor',
    description: 'Gera insights personalizados baseados nos registros do diário emocional',
    icon: BarChart3,
    configKey: 'mood_insights',
  },
  {
    id: 'predictive-wellbeing',
    name: 'Inteligência MEDCOS',
    description: 'Análise preditiva de bem-estar institucional com Machine Learning',
    icon: Sparkles,
    configKey: 'predictive_wellbeing',
  },
  {
    id: 'specialty-normalization',
    name: 'Normalização de Especialidades',
    description: 'Padroniza especialidades de profissionais usando IA (backend)',
    icon: ClipboardList,
    configKey: 'specialty_normalization',
  },
];

const DEFAULT_CONFIG = {
  enabled: true,
  model: 'google/gemini-2.5-flash',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: '',
};

export default function AIManagement() {
  const { configs, loading: configsLoading, updateConfig, getConfig } = useSystemConfig(['ai']);
  const [selectedAI, setSelectedAI] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [localConfigs, setLocalConfigs] = useState<Record<string, Partial<AIConfig>>>({});

  const getConfigForAI = (configKey: string): Partial<AIConfig> => {
    // First check local state, then system configs, then defaults
    if (localConfigs[configKey]) {
      return { ...DEFAULT_CONFIG, ...localConfigs[configKey] };
    }
    
    // Use the getConfig helper from useSystemConfig
    const configValue = getConfig('ai', configKey, null);
    if (configValue) {
      try {
        const parsed = typeof configValue === 'string' 
          ? JSON.parse(configValue) 
          : configValue;
        return { ...DEFAULT_CONFIG, ...parsed };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  };

  const updateLocalConfig = (configKey: string, updates: Partial<AIConfig>) => {
    setLocalConfigs(prev => ({
      ...prev,
      [configKey]: { ...getConfigForAI(configKey), ...updates }
    }));
  };

  const handleSave = async (configKey: string) => {
    setSaving(true);
    try {
      const config = getConfigForAI(configKey);
      await updateConfig('ai', configKey, config);
      toast.success('Configuração salva com sucesso');
      // Clear local state after successful save
      setLocalConfigs(prev => {
        const newState = { ...prev };
        delete newState[configKey];
        return newState;
      });
    } catch (error) {
      toast.error('Erro ao salvar configuração');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (configKey: string) => {
    setLocalConfigs(prev => {
      const newState = { ...prev };
      delete newState[configKey];
      return newState;
    });
    toast.info('Configuração resetada');
  };

  const selectedConfig = selectedAI 
    ? AI_CONFIGS.find(c => c.id === selectedAI)
    : null;

  const selectedConfigValues = selectedConfig 
    ? getConfigForAI(selectedConfig.configKey)
    : null;

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestão de Inteligência Artificial</h1>
          <p className="text-muted-foreground">
            Gerencie todas as IAs da plataforma MEDCOS
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AI_CONFIGS.map((ai) => {
          const config = getConfigForAI(ai.configKey);
          const Icon = ai.icon;
          const isSelected = selectedAI === ai.id;
          
          return (
            <Card 
              key={ai.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => setSelectedAI(isSelected ? null : ai.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{ai.name}</CardTitle>
                    </div>
                  </div>
                  <Badge variant={config.enabled ? 'default' : 'secondary'}>
                    {config.enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{ai.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Settings2 className="h-3 w-3" />
                  <span>{AVAILABLE_MODELS.find(m => m.value === config.model)?.label || config.model}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Panel */}
      {selectedConfig && selectedConfigValues && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <selectedConfig.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Configurações: {selectedConfig.name}</CardTitle>
                  <CardDescription>{selectedConfig.description}</CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedAI(null)}
              >
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label className="text-base font-medium">IA Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita ou desabilita esta funcionalidade de IA
                </p>
              </div>
              <Switch
                checked={selectedConfigValues.enabled}
                onCheckedChange={(enabled) => 
                  updateLocalConfig(selectedConfig.configKey, { enabled })
                }
              />
            </div>

            <Tabs defaultValue="model" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="model">Modelo</TabsTrigger>
                <TabsTrigger value="parameters">Parâmetros</TabsTrigger>
                <TabsTrigger value="prompt">System Prompt</TabsTrigger>
              </TabsList>

              <TabsContent value="model" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Modelo de IA</Label>
                  <Select
                    value={selectedConfigValues.model}
                    onValueChange={(model) => 
                      updateLocalConfig(selectedConfig.configKey, { model })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Gemini 2.5 Flash é recomendado para a maioria dos casos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={selectedConfigValues.maxTokens}
                    onChange={(e) => 
                      updateLocalConfig(selectedConfig.configKey, { 
                        maxTokens: parseInt(e.target.value) || 2000 
                      })
                    }
                    min={100}
                    max={8000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número máximo de tokens na resposta (100-8000)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="parameters" className="space-y-6 mt-4">
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Temperatura</Label>
                    <span className="text-sm font-medium text-primary">
                      {selectedConfigValues.temperature?.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[selectedConfigValues.temperature || 0.7]}
                    onValueChange={([temperature]) => 
                      updateLocalConfig(selectedConfig.configKey, { temperature })
                    }
                    min={0}
                    max={2}
                    step={0.01}
                  />
                  <p className="text-xs text-muted-foreground">
                    0 = Consistente e focado | 2 = Criativo e variado
                  </p>
                </div>

                {/* Top P */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Top P (Nucleus Sampling)</Label>
                    <span className="text-sm font-medium text-primary">
                      {selectedConfigValues.topP?.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[selectedConfigValues.topP || 0.9]}
                    onValueChange={([topP]) => 
                      updateLocalConfig(selectedConfig.configKey, { topP })
                    }
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla a diversidade das respostas. Valores menores = mais focado
                  </p>
                </div>

                {/* Frequency Penalty */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Frequency Penalty</Label>
                    <span className="text-sm font-medium text-primary">
                      {selectedConfigValues.frequencyPenalty?.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[selectedConfigValues.frequencyPenalty || 0]}
                    onValueChange={([frequencyPenalty]) => 
                      updateLocalConfig(selectedConfig.configKey, { frequencyPenalty })
                    }
                    min={0}
                    max={2}
                    step={0.01}
                  />
                  <p className="text-xs text-muted-foreground">
                    Penaliza repetição de palavras já usadas na resposta
                  </p>
                </div>

                {/* Presence Penalty */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Presence Penalty</Label>
                    <span className="text-sm font-medium text-primary">
                      {selectedConfigValues.presencePenalty?.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[selectedConfigValues.presencePenalty || 0]}
                    onValueChange={([presencePenalty]) => 
                      updateLocalConfig(selectedConfig.configKey, { presencePenalty })
                    }
                    min={0}
                    max={2}
                    step={0.01}
                  />
                  <p className="text-xs text-muted-foreground">
                    Incentiva a IA a falar sobre novos tópicos
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="prompt" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    value={selectedConfigValues.systemPrompt || ''}
                    onChange={(e) => 
                      updateLocalConfig(selectedConfig.configKey, { 
                        systemPrompt: e.target.value 
                      })
                    }
                    placeholder="Insira o prompt do sistema para personalizar o comportamento da IA..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    O prompt do sistema define a personalidade e comportamento base da IA
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleReset(selectedConfig.configKey)}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              <Button
                onClick={() => handleSave(selectedConfig.configKey)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Todas as IAs utilizam Lovable AI Gateway</p>
              <p className="text-sm text-muted-foreground mt-1">
                As configurações são aplicadas dinamicamente. Alterações entram em vigor imediatamente após salvar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
