import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Save, TestTube2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const GPT_MODELS = [
  { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Flagship)' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini (Fast)' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano (Fastest)' },
  { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (Reliable)' },
  { value: 'o3-2025-04-16', label: 'O3 (Reasoning)' },
  { value: 'o4-mini-2025-04-16', label: 'O4 Mini (Fast Reasoning)' },
  { value: 'gpt-4o', label: 'GPT-4o (Legacy)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Legacy)' }
];

export const AIAssistantConfig = () => {
  const { getConfig, updateConfig, loading } = useSystemConfig();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [formData, setFormData] = useState({
    system_prompt: getConfig('ai_assistant', 'system_prompt', ''),
    model: getConfig('ai_assistant', 'model', 'gpt-5-2025-08-07'),
    max_completion_tokens: getConfig('ai_assistant', 'max_completion_tokens', 1500),
    include_professional_data: getConfig('ai_assistant', 'include_professional_data', true)
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateConfig('ai_assistant', 'system_prompt', formData.system_prompt),
        updateConfig('ai_assistant', 'model', formData.model),
        updateConfig('ai_assistant', 'max_completion_tokens', formData.max_completion_tokens),
        updateConfig('ai_assistant', 'include_professional_data', formData.include_professional_data)
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Test the AI assistant with current configuration
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: 'Este é um teste de configuração. Responda brevemente.' }
      });

      if (error) throw error;

      toast({
        title: "Teste realizado com sucesso",
        description: "O assistente respondeu corretamente com as configurações atuais"
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Erro no teste",
        description: "Falha ao testar o assistente de IA",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Assistente de IA</CardTitle>
          <CardDescription>
            Configure o comportamento e parâmetros do assistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              placeholder="Digite o prompt do sistema..."
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Este prompt define o comportamento e personalidade do assistente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="model">Modelo GPT</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {GPT_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_tokens">Máximo de Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_completion_tokens}
                onChange={(e) => setFormData(prev => ({ ...prev, max_completion_tokens: parseInt(e.target.value) }))}
                min={100}
                max={4000}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="include_data"
              checked={formData.include_professional_data}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_professional_data: checked }))}
            />
            <Label htmlFor="include_data">
              Incluir dados dos profissionais no contexto
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              <TestTube2 className="h-4 w-4 mr-2" />
              {testing ? 'Testando...' : 'Testar Assistente'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};