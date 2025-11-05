import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw } from 'lucide-react';

const AudioTranscriptionConfig = () => {
  const { getConfig, updateConfig, loading } = useSystemConfig(['audio_transcription']);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Get current configurations
  const systemPrompt = getConfig('audio_transcription', 'system_prompt', '');
  const model = getConfig('audio_transcription', 'model', 'gpt-4o-mini');
  const maxTokens = getConfig('audio_transcription', 'max_tokens', '600');
  const temperature = getConfig('audio_transcription', 'temperature', '0.7');

  // Local state for form
  const [formData, setFormData] = useState({
    systemPrompt: systemPrompt,
    model: model,
    maxTokens: maxTokens,
    temperature: temperature
  });

  // Update form when configs load
  useEffect(() => {
    setFormData({
      systemPrompt: systemPrompt,
      model: model,
      maxTokens: maxTokens,
      temperature: temperature
    });
  }, [systemPrompt, model, maxTokens, temperature]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateConfig('audio_transcription', 'system_prompt', formData.systemPrompt),
        updateConfig('audio_transcription', 'model', formData.model),
        updateConfig('audio_transcription', 'max_tokens', parseInt(formData.maxTokens)),
        updateConfig('audio_transcription', 'temperature', parseFloat(formData.temperature))
      ]);

      toast({
        title: "Configurações salvas",
        description: "As configurações de transcrição de áudio foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      systemPrompt: systemPrompt,
      model: model,
      maxTokens: maxTokens,
      temperature: temperature
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Transcrição de Áudio</CardTitle>
          <CardDescription>
            Configure o comportamento do agente de IA responsável por processar as transcrições de áudio do diário emocional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              placeholder="Defina como o agente deve processar as transcrições..."
              className="min-h-[200px]"
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Este prompt define como o agente Rede Bem Estar processará as transcrições de áudio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modelo GPT</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido e Eficiente)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Mais Avançado)</SelectItem>
                  <SelectItem value="gpt-4">GPT-4 (Clássico)</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Econômico)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Máximo de Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                min="100"
                max="4000"
                value={formData.maxTokens}
                onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Controla o tamanho máximo da resposta
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                0 = Mais consistente, 2 = Mais criativo
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Resetar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioTranscriptionConfig;