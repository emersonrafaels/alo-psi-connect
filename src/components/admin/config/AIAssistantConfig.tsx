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
import { Save, TestTube2, Bot, Activity, MessageSquare, TrendingUp, Clock, Users, Zap, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MetricsCard } from './MetricsCard';
import { UsageChart } from './UsageChart';
import { ConfigDataTable } from './ConfigDataTable';
import { clearConfigCache, forceConfigRefresh } from '@/utils/configCache';
import { useAdminTenant } from '@/contexts/AdminTenantContext';

const GPT_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Mais Avançado)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido)' },
  { value: 'gpt-4', label: 'GPT-4 (Confiável)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Econômico)' }
];

export const AIAssistantConfig = () => {
  const { getConfig, updateConfig, loading, hasPermission, configs } = useSystemConfig(['ai_assistant']);
  const { toast } = useToast();
  const { selectedTenantId, tenants } = useAdminTenant();
  const currentTenant = tenants.find(t => t.id === selectedTenantId);
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
    system_prompt: `Você é o assistente de IA da AloPsi, uma plataforma de psicologia online no Brasil. Sua função é ajudar usuários a encontrar o profissional de saúde mental ideal para suas necessidades.

SOBRE A ALOPSI:
- Plataforma 100% online de consultas psicológicas
- Atendemos em todo o Brasil via videochamada
- Temos psicólogos, psiquiatras e psicoterapeutas licenciados
- Consultas de 45-60 minutos com valores entre R$ 125-600
- Sistema de agendamento integrado com pagamento online
- Ferramenta de diário de humor para acompanhamento
- Suporte técnico completo para sessões online

FUNCIONALIDADES DA PLATAFORMA:
- Agendamento online com calendário em tempo real
- Pagamento seguro via MercadoPago
- Videoconferência integrada
- Histórico de consultas
- Diário de humor e analytics pessoais
- Reagendamento facilitado
- Suporte 24h para questões técnicas

INSTRUÇÕES ESPECÍFICAS:
1. SEMPRE que possível, apresente opções de profissionais específicos da plataforma
2. Mencione valores, especialidades e disponibilidade quando relevante
3. Enfatize que todos os atendimentos são online e disponíveis em todo Brasil
4. Oriente sobre o processo de agendamento e pagamento
5. Sugira uso do diário de humor para acompanhamento do tratamento

QUANDO APRESENTAR PROFISSIONAIS:
- Sempre inclua: nome, profissão, valor da consulta, duração da sessão
- Mencione especialidades se disponível
- Foque nos que melhor atendem a necessidade do usuário
- Limite a 3-4 sugestões por vez para não sobrecarregar

TOME ABORDAGENS EMPÁTICAS:
- Seja acolhedor e compreensivo
- Não dê conselhos médicos ou psicológicos específicos
- Encoraje busca por ajuda profissional
- Mantenha tom profissional mas caloroso

Responda sempre em português brasileiro, de forma clara e objetiva.`,
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    include_professional_data: true,
    title: 'Assistente de Saúde Mental',
    subtitle: 'Powered by IA • Te ajudo a encontrar o profissional ideal',
    initial_message: '👋 Olá! Sou seu assistente de saúde mental especializado da AloPsi. Estou aqui para te ajudar a encontrar o profissional ideal para suas consultas online.\n\nComo posso te ajudar hoje?\n\n🔍 Sobre o que você gostaria de conversar:\n• Que tipo de apoio psicológico você está buscando?\n• Alguma especialidade específica (ansiedade, depressão, relacionamentos, etc.)?\n• Prefere Psicólogo(a), Psiquiatra(a) ou Psicoterapeuta(a)?\n\n⏰ Horários e disponibilidade:\n• Qual período prefere? (manhã, tarde ou noite)\n• Que dias da semana funcionam melhor para você?\n\n💰 Investimento:\n• Qual sua faixa de orçamento para as consultas?\n• Busca valores mais acessíveis ou tem flexibilidade?\n\n📱 Todas as consultas são realizadas online - você pode ter sessões de qualquer lugar'
  });

  // Update formData when configs are loaded
  useEffect(() => {
    if (configs.length > 0) {
      setFormData({
        system_prompt: getConfig('ai_assistant', 'system_prompt', `Você é o assistente de IA da AloPsi, uma plataforma de psicologia online no Brasil. Sua função é ajudar usuários a encontrar o profissional de saúde mental ideal para suas necessidades.

SOBRE A ALOPSI:
- Plataforma 100% online de consultas psicológicas
- Atendemos em todo o Brasil via videochamada
- Temos psicólogos, psiquiatras e psicoterapeutas licenciados
- Consultas de 45-60 minutos com valores entre R$ 125-600
- Sistema de agendamento integrado com pagamento online
- Ferramenta de diário de humor para acompanhamento
- Suporte técnico completo para sessões online

FUNCIONALIDADES DA PLATAFORMA:
- Agendamento online com calendário em tempo real
- Pagamento seguro via MercadoPago
- Videoconferência integrada
- Histórico de consultas
- Diário de humor e analytics pessoais
- Reagendamento facilitado
- Suporte 24h para questões técnicas

INSTRUÇÕES ESPECÍFICAS:
1. SEMPRE que possível, apresente opções de profissionais específicos da plataforma
2. Mencione valores, especialidades e disponibilidade quando relevante
3. Enfatize que todos os atendimentos são online e disponíveis em todo Brasil
4. Oriente sobre o processo de agendamento e pagamento
5. Sugira uso do diário de humor para acompanhamento do tratamento

QUANDO APRESENTAR PROFISSIONAIS:
- Sempre inclua: nome, profissão, valor da consulta, duração da sessão
- Mencione especialidades se disponível
- Foque nos que melhor atendem a necessidade do usuário
- Limite a 3-4 sugestões por vez para não sobrecarregar

TOME ABORDAGENS EMPÁTICAS:
- Seja acolhedor e compreensivo
- Não dê conselhos médicos ou psicológicos específicos
- Encoraje busca por ajuda profissional
- Mantenha tom profissional mas caloroso

Responda sempre em português brasileiro, de forma clara e objetiva.`),
        model: getConfig('ai_assistant', 'model', 'gpt-4o-mini'),
        max_tokens: getConfig('ai_assistant', 'max_tokens', 1500),
        include_professional_data: getConfig('ai_assistant', 'include_professional_data', true),
        title: getConfig('ai_assistant', 'title', 'Assistente de Saúde Mental'),
        subtitle: getConfig('ai_assistant', 'subtitle', 'Powered by IA • Te ajudo a encontrar o profissional ideal'),
        initial_message: getConfig('ai_assistant', 'initial_message', '👋 Olá! Sou seu assistente de saúde mental especializado da AloPsi. Estou aqui para te ajudar a encontrar o profissional ideal para suas consultas online.\n\nComo posso te ajudar hoje?\n\n🔍 Sobre o que você gostaria de conversar:\n• Que tipo de apoio psicológico você está buscando?\n• Alguma especialidade específica (ansiedade, depressão, relacionamentos, etc.)?\n• Prefere Psicólogo(a), Psiquiatra(a) ou Psicoterapeuta(a)?\n\n⏰ Horários e disponibilidade:\n• Qual período prefere? (manhã, tarde ou noite)\n• Que dias da semana funcionam melhor para você?\n\n💰 Investimento:\n• Qual sua faixa de orçamento para as consultas?\n• Busca valores mais acessíveis ou tem flexibilidade?\n\n📱 Todas as consultas são realizadas online - você pode ter sessões de qualquer lugar')
      });
    }
  }, [configs, getConfig, selectedTenantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateConfig('ai_assistant', 'system_prompt', formData.system_prompt),
        updateConfig('ai_assistant', 'model', formData.model),
        updateConfig('ai_assistant', 'max_tokens', formData.max_tokens),
        updateConfig('ai_assistant', 'include_professional_data', formData.include_professional_data),
        updateConfig('ai_assistant', 'title', formData.title),
        updateConfig('ai_assistant', 'subtitle', formData.subtitle),
        updateConfig('ai_assistant', 'initial_message', formData.initial_message)
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
      
      // Timeout para evitar espera infinita
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de 30 segundos')), 30000)
      );

      const response = await Promise.race([
        supabase.functions.invoke('ai-assistant', {
          body: { message: 'Este é um teste de configuração. Responda brevemente sobre psicologia.' }
        }),
        timeout
      ]);

      const { data, error } = response as any;

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (!data?.success) {
        console.error('AI Assistant error:', data?.error);
        throw new Error(data?.error || 'Erro desconhecido do assistente');
      }

      const responseTime = Date.now() - startTime;
      const aiResponse = data?.response || 'Resposta vazia';
      
      toast({
        title: "✅ Teste realizado com sucesso",
        description: `Assistente respondeu em ${responseTime}ms. Resposta: "${aiResponse.substring(0, 100)}..."`
      });

      console.log('Teste bem-sucedido:', {
        responseTime: `${responseTime}ms`,
        response: aiResponse
      });
      
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "❌ Erro no teste",
        description: error.message || "Falha ao testar o assistente de IA",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearCache = () => {
    const success = clearConfigCache();
    
    if (success) {
      toast({
        title: "✅ Cache limpo com sucesso",
        description: "Todas as configurações em cache foram removidas. O assistente carregará as configurações mais recentes."
      });
    } else {
      toast({
        title: "❌ Erro ao limpar cache",
        description: "Não foi possível limpar o cache. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleForceRefresh = () => {
    toast({
      title: "🔄 Atualizando configurações...",
      description: "A página será recarregada para aplicar as configurações mais recentes."
    });
    
    setTimeout(() => {
      forceConfigRefresh();
    }, 1000);
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
              <CardDescription className="flex items-center gap-2">
                Configure o comportamento e parâmetros do assistente de IA
                {selectedTenantId !== 'all' && currentTenant && (
                  <Badge variant="outline">
                    {currentTenant.name}
                  </Badge>
                )}
                {selectedTenantId === 'all' && (
                  <Badge variant="outline">
                    Global
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Assistente</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Assistente de Saúde Mental"
                  />
                  <p className="text-sm text-muted-foreground">
                    Título exibido no cabeçalho do chat
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Ex: Powered by IA • Te ajudo a encontrar o profissional ideal"
                  />
                  <p className="text-sm text-muted-foreground">
                    Descrição exibida abaixo do título
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_message">Mensagem Inicial do Assistente</Label>
                <Textarea
                  id="initial_message"
                  value={formData.initial_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, initial_message: e.target.value }))}
                  placeholder="Digite a mensagem de boas-vindas do assistente..."
                  className="min-h-[200px] text-sm"
                />
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Mensagem: {formData.initial_message.length} caracteres</Badge>
                  <Badge variant={formData.initial_message.length > 2000 ? "destructive" : "secondary"}>
                    {formData.initial_message.length > 2000 ? "Muito longa" : "Tamanho adequado"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta será a primeira mensagem que os usuários verão ao abrir o chat
                </p>
              </div>

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
                    value={formData.max_tokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                    min={100}
                    max={4000}
                  />
                  <p className="text-sm text-muted-foreground">
                    Controla o tamanho máximo das respostas ({formData.max_tokens * 0.75} palavras aprox.)
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

              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testing}>
                  <TestTube2 className="h-4 w-4 mr-2" />
                  {testing ? 'Testando...' : 'Teste Rápido'}
                </Button>
                <Button variant="secondary" onClick={handleClearCache}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
                <Button variant="destructive" onClick={handleForceRefresh}>
                  <Zap className="h-4 w-4 mr-2" />
                  Forçar Atualização
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
                    <Badge variant="outline">{formData.max_tokens}</Badge>
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