import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Save, TestTube2, Bot, Activity, MessageSquare, TrendingUp, Clock, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MetricsCard } from './MetricsCard';
import { UsageChart } from './UsageChart';
import { ConfigDataTable } from './ConfigDataTable';

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
  const { getConfig, updateConfig, loading, hasPermission, configs } = useSystemConfig(['ai_assistant']);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsage: 0,
    avgResponseTime: 0,
    successRate: 0,
    n8nUsage: 0
  });

  const [formData, setFormData] = useState({
    system_prompt: '',
    model: 'gpt-5-2025-08-07',
    max_completion_tokens: 1500,
    include_professional_data: true
  });

  // Update formData when configs are loaded
  useEffect(() => {
    if (configs.length > 0) {
      setFormData({
        system_prompt: getConfig('ai_assistant', 'system_prompt', ''),
        model: getConfig('ai_assistant', 'model', 'gpt-5-2025-08-07'),
        max_completion_tokens: getConfig('ai_assistant', 'max_completion_tokens', 1500),
        include_professional_data: getConfig('ai_assistant', 'include_professional_data', true)
      });
    }
  }, [configs, getConfig]);

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

  // Fetch usage analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Mock data - replace with real analytics
        const mockUsageData = Array.from({ length: 7 }, (_, i) => ({
          name: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { weekday: 'short' }),
          usage: Math.floor(Math.random() * 100) + 20,
          n8n: Math.floor(Math.random() * 50) + 10,
          openai: Math.floor(Math.random() * 60) + 15
        }));
        
        setUsageData(mockUsageData);
        setMetrics({
          totalUsage: mockUsageData.reduce((acc, curr) => acc + curr.usage, 0),
          avgResponseTime: 1.2,
          successRate: 98.5,
          n8nUsage: mockUsageData.reduce((acc, curr) => acc + curr.n8n, 0)
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    if (hasPermission) {
      fetchAnalytics();
    }
  }, [hasPermission]);

  const handleTest = async () => {
    setTesting(true);
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: 'Este é um teste de configuração. Responda brevemente sobre psicologia.' }
      });

      if (error) throw error;

      const responseTime = Date.now() - startTime;
      toast({
        title: "Teste realizado com sucesso",
        description: `Assistente respondeu em ${responseTime}ms. Resposta: "${data?.message?.substring(0, 100)}..."`
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

  if (!hasPermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar as configurações do assistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção está disponível apenas para Administradores
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Uso Total (7 dias)"
          value={metrics.totalUsage}
          description="consultas processadas"
          icon={MessageSquare}
          trend={12}
        />
        <MetricsCard
          title="Tempo de Resposta"
          value={`${metrics.avgResponseTime}s`}
          description="tempo médio"
          icon={Clock}
          trend={-5}
        />
        <MetricsCard
          title="Taxa de Sucesso"
          value={`${metrics.successRate}%`}
          description="respostas bem-sucedidas"
          icon={TrendingUp}
          trend={2}
        />
        <MetricsCard
          title="Uso via N8N"
          value={`${Math.round((metrics.n8nUsage / metrics.totalUsage) * 100)}%`}
          description="vs OpenAI direto"
          icon={Zap}
          trend={8}
        />
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="test">Teste Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configurações do Assistente de IA
              </CardTitle>
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Prompt atual: {formData.system_prompt.length} caracteres</Badge>
                  <Badge variant={formData.system_prompt.length > 1000 ? "destructive" : "secondary"}>
                    {formData.system_prompt.length > 1000 ? "Muito longo" : "Tamanho adequado"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Este prompt define o comportamento e personalidade do assistente. Seja específico sobre o contexto da psicologia.
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
                  <p className="text-sm text-muted-foreground">
                    Modelos mais recentes têm melhor qualidade, mas podem ser mais lentos
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Controla o tamanho máximo das respostas ({formData.max_completion_tokens * 0.75} palavras aprox.)
                  </p>
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
                <Badge variant={formData.include_professional_data ? "default" : "secondary"}>
                  {formData.include_professional_data ? "Habilitado" : "Desabilitado"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Quando habilitado, o assistente terá acesso às informações dos profissionais para dar recomendações personalizadas
              </p>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testing}>
                  <TestTube2 className="h-4 w-4 mr-2" />
                  {testing ? 'Testando...' : 'Teste Rápido'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsageChart
              title="Uso do Assistente (7 dias)"
              description="Consultas processadas por dia"
              data={usageData}
              type="area"
              dataKey="usage"
              xAxisKey="name"
            />
            <UsageChart
              title="N8N vs OpenAI"
              description="Comparativo de uso dos modelos"
              data={usageData}
              type="bar"
              dataKey="n8n"
              xAxisKey="name"
            />
          </div>
          
          <UsageChart
            title="Tendência de Uso Semanal"
            description="Análise de performance ao longo do tempo"
            data={usageData}
            type="line"
            dataKey="usage"
            xAxisKey="name"
            height={250}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <ConfigDataTable
            title="Logs do Assistente IA"
            description="Histórico de interações e configurações"
            data={configs.filter(c => c.category === 'ai_assistant')}
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teste Avançado do Assistente</CardTitle>
              <CardDescription>
                Teste o assistente com diferentes cenários e mensagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Test with psychology question
                    setTesting(true);
                    supabase.functions.invoke('ai-assistant', {
                      body: { message: 'Qual a diferença entre psicólogo e psiquiatra?' }
                    }).finally(() => setTesting(false));
                  }}
                  disabled={testing}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Teste Psicologia
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Test with professional recommendation
                    setTesting(true);
                    supabase.functions.invoke('ai-assistant', {
                      body: { message: 'Preciso de ajuda com ansiedade' }
                    }).finally(() => setTesting(false));
                  }}
                  disabled={testing}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Teste Recomendação
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Test with general question
                    setTesting(true);
                    supabase.functions.invoke('ai-assistant', {
                      body: { message: 'Como funciona a terapia cognitivo-comportamental?' }
                    }).finally(() => setTesting(false));
                  }}
                  disabled={testing}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Teste Técnico
                </Button>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Status do Sistema:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Modelo atual:</span>
                    <Badge variant="outline">{formData.model}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dados profissionais:</span>
                    <Badge variant={formData.include_professional_data ? "default" : "secondary"}>
                      {formData.include_professional_data ? "Incluídos" : "Não incluídos"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Max tokens:</span>
                    <Badge variant="outline">{formData.max_completion_tokens}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Sistema ativo:</span>
                    <Badge variant="default">Funcionando</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};