import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Save, TestTube2, Webhook, Bot, Activity, Settings, HelpCircle, CheckCircle, XCircle, Clock, MinusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MetricsCard } from './MetricsCard';
import { UsageChart } from './UsageChart';
import { ConfigDataTable } from './ConfigDataTable';
import { N8NWizard } from './N8NWizard';

export const N8NConfig = () => {
  const { getConfig, updateConfig, loading, hasPermission, configs } = useSystemConfig(['n8n', 'n8n_chat']);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState({
    booking: 'unknown',
    payment: 'unknown',
    chat: 'unknown'
  });
  const [usageData, setUsageData] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Configurações originais - inicializar com valores padrão
    booking_webhook_url: '',
    payment_webhook_url: '',
    send_appointment_notifications: true,
    booking_payload_template: JSON.stringify({
      event: 'appointment_created',
      appointment: {
        id: '{{appointment.id}}',
        patient_name: '{{appointment.nome_paciente}}',
        patient_email: '{{appointment.email_paciente}}',
        professional_name: '{{professional.display_name}}',
        date: '{{appointment.data_consulta}}',
        time: '{{appointment.horario}}',
        value: '{{appointment.valor}}'
      }
    }, null, 2),
    payment_payload_template: JSON.stringify({
      event: 'payment_updated',
      appointment: {
        id: '{{appointment.id}}',
        payment_status: '{{appointment.payment_status}}',
        patient_email: '{{appointment.email_paciente}}'
      }
    }, null, 2),
    // Configurações para chat AI (N8N-only)
    chat_webhook_url_test: 'https://n8n.alopsi.com.br/webhook-test/56ab2ff9-a91c-4f80-9b25-ac74ccba2d88',
    chat_webhook_url_prod: 'https://n8n.alopsi.com.br/webhook/56ab2ff9-a91c-4f80-9b25-ac74ccba2d88',
    chat_enabled: false,
    chat_use_production: false,
    // Campos adicionais para o payload N8N
    chat_channel: 'medcos_match',
    chat_medcos_match: true
  });

  // Update formData when configs are loaded
  useEffect(() => {
    if (configs.length > 0) {
      console.log('🔧 [N8NConfig] Loading configs:', configs);
      
      setFormData({
        // Configurações originais
        booking_webhook_url: getConfig('n8n', 'booking_webhook_url', ''),
        payment_webhook_url: getConfig('n8n', 'payment_webhook_url', ''),
        send_appointment_notifications: getConfig('n8n', 'send_appointment_notifications', true),
        booking_payload_template: getConfig('n8n', 'booking_payload_template', JSON.stringify({
          event: 'appointment_created',
          appointment: {
            id: '{{appointment.id}}',
            patient_name: '{{appointment.nome_paciente}}',
            patient_email: '{{appointment.email_paciente}}',
            professional_name: '{{professional.display_name}}',
            date: '{{appointment.data_consulta}}',
            time: '{{appointment.horario}}',
            value: '{{appointment.valor}}'
          }
        }, null, 2)),
        payment_payload_template: getConfig('n8n', 'payment_payload_template', JSON.stringify({
          event: 'payment_updated',
          appointment: {
            id: '{{appointment.id}}',
            payment_status: '{{appointment.payment_status}}',
            patient_email: '{{appointment.email_paciente}}'
          }
        }, null, 2)),
        // Configurações para chat AI (N8N-only, simplified)
        chat_webhook_url_test: getConfig('n8n', 'chat_webhook_url_test', 'https://n8n.alopsi.com.br/webhook-test/56ab2ff9-a91c-4f80-9b25-ac74ccba2d88'),
        chat_webhook_url_prod: getConfig('n8n', 'chat_webhook_url_prod', 'https://n8n.alopsi.com.br/webhook/56ab2ff9-a91c-4f80-9b25-ac74ccba2d88'),
        chat_enabled: getConfig('n8n', 'chat_enabled', false),
        chat_use_production: getConfig('n8n', 'chat_use_production', false),
        // Campos adicionais para o payload N8N
        chat_channel: getConfig('n8n', 'chat_channel', 'medcos_match'),
        chat_medcos_match: getConfig('n8n', 'chat_medcos_match', true)
      });
    }
  }, [configs, getConfig]);

  const checkWebhookStatus = async () => {
    const chatUrl = formData.chat_use_production ? formData.chat_webhook_url_prod : formData.chat_webhook_url_test;
    const webhooks = [
      { type: 'booking', url: formData.booking_webhook_url },
      { type: 'payment', url: formData.payment_webhook_url },
      { type: 'chat', url: chatUrl }
    ].filter(w => w.url); // Only send webhooks with URLs

    if (webhooks.length === 0) {
      console.log('No webhooks configured');
      setWebhookStatus({ booking: 'not_configured', payment: 'not_configured', chat: 'not_configured' });
      return;
    }

    console.log('[N8NConfig] Checking webhook status via Edge Function:', webhooks);

    try {
      const { data, error } = await supabase.functions.invoke('check-webhook-status', {
        body: { webhooks }
      });

      if (error) {
        console.error('[N8NConfig] Edge Function error:', error);
        throw error;
      }

      console.log('[N8NConfig] Edge Function response:', data);

      // Build status object from results
      const newStatus = { booking: 'not_configured', payment: 'not_configured', chat: 'not_configured' };
      
      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach(({ type, status }: { type: string; status: string }) => {
          newStatus[type as keyof typeof newStatus] = status;
        });
      }
      
      console.log('[N8NConfig] Updated webhook status:', newStatus);
      setWebhookStatus(newStatus);
    } catch (error) {
      console.error('[N8NConfig] Error checking webhook status:', error);
      // Set all to unknown on error (avoid false negatives)
      setWebhookStatus({ booking: 'unknown', payment: 'unknown', chat: 'unknown' });
      
      toast({
        title: "⚠️ Erro ao verificar status",
        description: "Não foi possível verificar o status dos webhooks. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Check webhook status after configs are loaded and formData is updated
  useEffect(() => {
    if (!loading && hasPermission && configs.length > 0) {
      const chatUrl = formData.chat_use_production ? formData.chat_webhook_url_prod : formData.chat_webhook_url_test;
      // Wait a bit for formData to be updated with loaded configs
      const timeoutId = setTimeout(() => {
        if (formData.booking_webhook_url || formData.payment_webhook_url || chatUrl) {
          console.log('Initial webhook status check with URLs:', {
            booking: formData.booking_webhook_url,
            payment: formData.payment_webhook_url,
            chat: chatUrl
          });
          checkWebhookStatus();
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, hasPermission, configs.length, formData.booking_webhook_url, formData.payment_webhook_url, formData.chat_webhook_url_test, formData.chat_webhook_url_prod, formData.chat_use_production]);

  // Generate mock usage data
  useEffect(() => {
    if (hasPermission && !loading) {
      const mockData = Array.from({ length: 7 }, (_, i) => ({
        name: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { weekday: 'short' }),
        booking: Math.floor(Math.random() * 20) + 5,
        payment: Math.floor(Math.random() * 15) + 3,
        chat: Math.floor(Math.random() * 50) + 10
      }));
      setUsageData(mockData);
    }
  }, [hasPermission, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        // Configurações originais
        updateConfig('n8n', 'booking_webhook_url', formData.booking_webhook_url),
        updateConfig('n8n', 'payment_webhook_url', formData.payment_webhook_url),
        updateConfig('n8n', 'send_appointment_notifications', formData.send_appointment_notifications),
        updateConfig('n8n', 'booking_payload_template', formData.booking_payload_template),
        updateConfig('n8n', 'payment_payload_template', formData.payment_payload_template),
        // Configurações para chat AI (N8N-only, simplified)
        updateConfig('n8n', 'chat_webhook_url_test', formData.chat_webhook_url_test),
        updateConfig('n8n', 'chat_webhook_url_prod', formData.chat_webhook_url_prod),
        updateConfig('n8n', 'chat_enabled', formData.chat_enabled),
        updateConfig('n8n', 'chat_use_production', formData.chat_use_production),
        // Campos adicionais para o payload N8N
        updateConfig('n8n', 'chat_channel', formData.chat_channel),
        updateConfig('n8n', 'chat_medcos_match', formData.chat_medcos_match)
      ]);
      
      toast({
        title: "✅ Configurações salvas",
        description: "Todas as configurações do N8N foram atualizadas com sucesso"
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Simplified and robust template processing
  const createPayloadFromTemplate = (template: string | object, variables: Record<string, any>): any => {
    try {
      console.log('🔧 [createPayloadFromTemplate] Iniciando processamento simplificado');
      console.log('📝 Template original:', template);
      console.log('📋 Variáveis:', variables);
      
      // Step 1: Convert to string
      let templateString: string;
      if (typeof template === 'object' && template !== null) {
        templateString = JSON.stringify(template);
      } else if (typeof template === 'string') {
        templateString = template;
      } else {
        throw new Error(`Template inválido: ${typeof template}`);
      }
      
      // Step 2: Aggressive normalization - remove ALL line breaks and extra spaces
      let normalizedTemplate = templateString
        .replace(/\r\n/g, '')         // Windows line breaks
        .replace(/\r/g, '')           // Mac line breaks  
        .replace(/\n/g, '')           // Unix line breaks
        .replace(/\t/g, '')           // Tabs
        .replace(/\s+/g, ' ')         // Multiple spaces to single
        .trim();
      
      console.log('🧹 Template normalizado:', normalizedTemplate);
      
      // Step 3: Smart variable substitution
      let processedTemplate = normalizedTemplate;
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        
        console.log(`🔄 Processando: ${key} = ${value} (${typeof value})`);
        
        // Detect context: is variable inside quotes or expecting a number?
        const stringContextRegex = new RegExp(`"[^"]*\\{\\{\\s*${key}\\s*\\}\\}[^"]*"`, 'g');
        const numberContextRegex = new RegExp(`:\\s*\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        
        const isInStringContext = stringContextRegex.test(normalizedTemplate);
        const isInNumberContext = numberContextRegex.test(normalizedTemplate);
        
        let substitutionValue: string;
        
        if (isInStringContext) {
          // Inside quotes - treat as string, escape quotes
          substitutionValue = String(value).replace(/"/g, '\\"');
          console.log(`📝 String context: ${key} → "${substitutionValue}"`);
        } else if (isInNumberContext && (typeof value === 'number' || (!isNaN(Number(value)) && value !== ''))) {
          // After colon and is numeric - treat as number
          substitutionValue = String(typeof value === 'number' ? value : Number(value));
          console.log(`🔢 Number context: ${key} → ${substitutionValue}`);
        } else {
          // Default - wrap as string
          substitutionValue = `"${String(value).replace(/"/g, '\\"')}"`;
          console.log(`📝 Default string: ${key} → ${substitutionValue}`);
        }
        
        processedTemplate = processedTemplate.replace(regex, substitutionValue);
      });
      
      console.log('🔄 Template processado:', processedTemplate);
      
      // Step 4: Parse JSON
      try {
        const result = JSON.parse(processedTemplate);
        console.log('✅ Sucesso!', result);
        return result;
      } catch (parseError) {
        console.error('❌ Erro de parse:', parseError);
        console.error('❌ Template problemático:', processedTemplate);
        
        // Try to identify the exact error location
        if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
          const position = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
          const errorContext = processedTemplate.substring(Math.max(0, position - 20), position + 20);
          console.error(`🎯 Erro próximo à posição ${position}: "${errorContext}"`);
        }
        
        throw new Error(`Parse JSON falhou: ${parseError.message}`);
      }
      
    } catch (error) {
      console.error('💥 Erro crítico:', error);
      
      // Fallback simples
      return {
        event: "test",
        patient: { 
          name: "Test Patient", 
          email: "test@example.com" 
        },
        professional: { 
          name: "Test Professional", 
          email: "prof@example.com" 
        },
        booking: { 
          id: "test-booking", 
          valor: 150.00, 
          status: "agendado" 
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Helper: Get test values for validation
  const getTestValue = (varPath: string): string => {
    if (varPath === 'filters' || varPath.includes('filter')) return '{}';
    if (varPath === 'professionals' || (varPath.includes('professional') && varPath.includes('s'))) return '[]';
    if (varPath.includes('professional') && !varPath.includes('s')) return '{}';
    if (varPath.includes('appointment') && !varPath.includes('.')) return '{}';
    return '"test_value"';
  };

  // Helper: Get fallback values based on context
  const getFallbackValue = (varPath: string): any => {
    const fallbacks: Record<string, any> = {
      'appointment.id': 'temp-appointment-id',
      'appointment.data_consulta': new Date().toISOString().split('T')[0],
      'appointment.horario': '10:00',
      'appointment.valor': '120.00',
      'appointment.nome_paciente': 'Nome do Paciente',
      'appointment.email_paciente': 'paciente@email.com',
      'professional.display_name': 'Nome do Profissional',
      'professional.id': 'temp-professional-id',
      'payment.id': 'temp-payment-id',
      'payment.status': 'pending',
      'chat.message': 'Mensagem de teste',
      'chat.user': 'Usuário de teste',
      'filters': {},
      'professionals': []
    };
    
    return fallbacks[varPath] || `fallback_${varPath.split('.').pop()}`;
  };

  // Helper: Convert values to JSON-safe strings
  const getJsonSafeValue = (value: any, varPath: string): string => {
    if (value === undefined || value === null) {
      const fallback = getFallbackValue(varPath);
      return typeof fallback === 'object' ? JSON.stringify(fallback) : JSON.stringify(fallback);
    }
    
    // For objects and arrays, insert as raw JSON
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // For primitives, JSON stringify to handle quotes properly
    return JSON.stringify(value);
  };

  // Retry function with exponential backoff for testing
  const retryWebhookTest = async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<any> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Webhook test attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Webhook test attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };

  const testWebhook = async (type: 'booking' | 'payment' | 'chat') => {
    setTesting(type);
    try {
      let url, template;
      
      if (type === 'booking') {
        url = getConfig('n8n', 'booking_webhook_url', formData.booking_webhook_url);
        template = getConfig('n8n', 'booking_payload_template', formData.booking_payload_template);
      } else if (type === 'payment') {
        url = getConfig('n8n', 'payment_webhook_url', formData.payment_webhook_url);
        template = getConfig('n8n', 'payment_payload_template', formData.payment_payload_template);
      } else if (type === 'chat') {
        // Use test or prod URL based on current mode
        const useProduction = getConfig('n8n', 'chat_use_production', formData.chat_use_production);
        url = useProduction 
          ? getConfig('n8n', 'chat_webhook_url_prod', formData.chat_webhook_url_prod)
          : getConfig('n8n', 'chat_webhook_url_test', formData.chat_webhook_url_test);
        template = null; // No template for chat, using fixed simple payload
      }
      
      if (!url) {
        toast({
          title: "URL do webhook não configurada",
          description: `Configure a URL do webhook de ${type === 'booking' ? 'agendamento' : type === 'payment' ? 'pagamento' : 'chat'} primeiro`,
          variant: "destructive"
        });
        return;
      }

      // Test payload with comprehensive variable substitution
      let testPayload;
      
      if (type === 'chat') {
        // Chat uses a simple fixed payload (no template)
        testPayload = {
          user_id: "test-user-123",
          session_id: `test-session-${Date.now()}`,
          tenant_id: "test-tenant-456",
          tenant_slug: "medcos",
          message: "Olá, preciso de ajuda para encontrar um psicólogo especializado em ansiedade",
          timestamp: new Date().toISOString()
        };
      } else {
        // Booking/Payment use templates
        if (!template) {
          toast({
            title: "Template não encontrado",
            description: `Template do payload de ${type === 'booking' ? 'agendamento' : 'pagamento'} não está configurado`,
            variant: "destructive"
          });
          return;
        }

        try {
          // Map variables to appropriate test values
          const testValues: Record<string, any> = {
            // Appointment related
            'appointment.id': "test-appointment-123",
            'appointment.nome_paciente': "João Silva",
            'appointment.email_paciente': "joao@exemplo.com",
            'appointment.data_consulta': "2024-01-15",
            'appointment.horario': "14:30",
            'appointment.valor': 150.00,
            'appointment.payment_status': "paid",
            'professional.display_name': "Dr. Maria Santos"
          };
          
          console.log('Testing with values:', testValues);
          testPayload = createPayloadFromTemplate(template, testValues);
          
        } catch (parseError) {
          console.error('Template parsing error:', parseError);
          toast({
            title: "Erro no template",
            description: `Template payload inválido: ${parseError.message}`,
            variant: "destructive"
          });
          return;
        }
      }
      
      // Define webhook operation with timeout
      const webhookOperation = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'AloPsi-N8N-Config-Test',
              'X-Test-Mode': 'true'
            },
            body: JSON.stringify(testPayload),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      // Execute test with retry system
      const response = await retryWebhookTest(webhookOperation, 2, 1000, 2); // 2 retries for testing

      setWebhookStatus(prev => ({ ...prev, [type]: 'online' }));
      toast({
        title: "✅ Webhook testado com sucesso",
        description: `O webhook de ${type === 'booking' ? 'agendamento' : type === 'payment' ? 'pagamento' : 'chat'} respondeu corretamente (${response.status})`,
      });
      
    } catch (error) {
      console.error('Webhook test error:', error);
      setWebhookStatus(prev => ({ ...prev, [type]: 'offline' }));
      
      let errorMessage = "Erro desconhecido";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Timeout - webhook não respondeu em tempo hábil";
        } else if (error.message.includes('fetch')) {
          errorMessage = "Erro de conexão - verifique a URL";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "❌ Erro no teste do webhook",
        description: `Falha após tentativas de retry: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': 
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>;
      case 'offline': 
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Offline</Badge>;
      case 'not_configured': 
        return <Badge variant="secondary"><MinusCircle className="h-3 w-3 mr-1" />Não configurado</Badge>;
      case 'unknown': 
        return <Badge variant="outline"><HelpCircle className="h-3 w-3 mr-1" />Verificando...</Badge>;
      default: 
        return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Verificando...</Badge>;
    }
  };

  const totalUsage = usageData.reduce((acc, curr) => acc + curr.booking + curr.payment + curr.chat, 0);

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  if (!hasPermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar as configurações do N8N
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

  if (showWizard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowWizard(false)}>
            ← Voltar para Configurações
          </Button>
        </div>
        <N8NWizard onComplete={(config) => {
          setFormData(prev => ({ ...prev, ...config }));
          setShowWizard(false);
          toast({
            title: "Configuração concluída",
            description: "As configurações do wizard foram aplicadas. Lembre-se de salvar!"
          });
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações N8N</h2>
          <p className="text-muted-foreground">
            Gerencie suas integrações e automações
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)} variant="outline">
          <HelpCircle className="h-4 w-4 mr-2" />
          Assistente de Configuração
        </Button>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Webhook Agendamentos</p>
                <p className="text-xs text-muted-foreground">
                  {formData.booking_webhook_url ? 'Configurado' : 'Não configurado'}
                </p>
              </div>
              {getStatusBadge(webhookStatus.booking)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Webhook Pagamentos</p>
                <p className="text-xs text-muted-foreground">
                  {formData.payment_webhook_url ? 'Configurado' : 'Não configurado'}
                </p>
              </div>
              {getStatusBadge(webhookStatus.payment)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Chat IA N8N</p>
                <p className="text-xs text-muted-foreground">
                  {formData.chat_enabled ? 'Habilitado' : 'Desabilitado'}
                </p>
              </div>
              {getStatusBadge(webhookStatus.chat)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Total de Chamadas"
          value={totalUsage}
          description="últimos 7 dias"
          icon={Activity}
          trend={15}
        />
        <MetricsCard
          title="Agendamentos"
          value={usageData.reduce((acc, curr) => acc + curr.booking, 0)}
          description="webhooks executados"
          icon={Webhook}
        />
        <MetricsCard
          title="Pagamentos"
          value={usageData.reduce((acc, curr) => acc + curr.payment, 0)}
          description="notificações enviadas"
          icon={Settings}
        />
        <MetricsCard
          title="Chat IA"
          value={usageData.reduce((acc, curr) => acc + curr.chat, 0)}
          description="processamentos"
          icon={Bot}
        />
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="help">Ajuda</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* Chat AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Assistente de IA via N8N (Medcos Match)
                {getStatusBadge(webhookStatus.chat)}
              </CardTitle>
              <CardDescription>
                Configure o fluxo N8N para processar consultas do assistente de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  O N8N é 100% responsável por consultar o Supabase, manter contexto da conversa e processar com modelos de IA.
                  O frontend envia apenas: user_id, session_id, tenant_id, tenant_slug, message, timestamp.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Switch
                  id="chat_enabled"
                  checked={formData.chat_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_enabled: checked }))}
                />
                <Label htmlFor="chat_enabled">
                  Habilitar Chat via N8N
                </Label>
                <Badge variant={formData.chat_enabled ? "default" : "secondary"}>
                  {formData.chat_enabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chat_webhook_test">URL de Teste (webhook-test)</Label>
                  <Input
                    id="chat_webhook_test"
                    value={formData.chat_webhook_url_test}
                    onChange={(e) => setFormData(prev => ({ ...prev, chat_webhook_url_test: e.target.value }))}
                    placeholder="https://n8n.alopsi.com.br/webhook-test/..."
                  />
                  <p className="text-sm text-muted-foreground">
                    URL do webhook de teste do N8N
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat_webhook_prod">URL de Produção (webhook)</Label>
                  <Input
                    id="chat_webhook_prod"
                    value={formData.chat_webhook_url_prod}
                    onChange={(e) => setFormData(prev => ({ ...prev, chat_webhook_url_prod: e.target.value }))}
                    placeholder="https://n8n.alopsi.com.br/webhook/..."
                  />
                  <p className="text-sm text-muted-foreground">
                    URL do webhook de produção do N8N
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="chat_use_prod" className="cursor-pointer">
                      Modo Atual:
                    </Label>
                    <Badge variant={formData.chat_use_production ? "default" : "secondary"} className="text-sm">
                      {formData.chat_use_production ? "🚀 Produção" : "🧪 Teste"}
                    </Badge>
                  </div>
                  <Switch
                    id="chat_use_prod"
                    checked={formData.chat_use_production}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_use_production: checked }))}
                  />
                </div>

                {formData.chat_use_production && (
                  <Alert>
                    <AlertDescription className="text-orange-600">
                      ⚠️ Você está em <strong>modo PRODUÇÃO</strong>. Todas as mensagens do chat serão enviadas para o webhook de produção.
                    </AlertDescription>
                  </Alert>
                )}

                {!formData.chat_use_production && (
                  <Alert>
                    <AlertDescription className="text-blue-600">
                      🧪 Você está em <strong>modo TESTE</strong>. As mensagens do chat vão para o webhook de teste do N8N.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook('chat')}
                    disabled={testing === 'chat'}
                  >
                    {testing === 'chat' ? 'Testando...' : 'Testar Webhook'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chat_channel">Canal (channel)</Label>
                  <Input
                    id="chat_channel"
                    value={formData.chat_channel}
                    onChange={(e) => setFormData(prev => ({ ...prev, chat_channel: e.target.value }))}
                    placeholder="medcos_match"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome do canal para identificação no N8N
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="chat_medcos_match"
                    checked={formData.chat_medcos_match}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_medcos_match: checked }))}
                  />
                  <Label htmlFor="chat_medcos_match">
                    Medcos Match
                  </Label>
                  <Badge variant={formData.chat_medcos_match ? "default" : "secondary"}>
                    {formData.chat_medcos_match ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Payload enviado ao N8N:</strong>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "user_id": "uuid-do-usuario",
  "session_id": "uuid-da-sessao",
  "tenant_id": "uuid-do-tenant",
  "tenant_slug": "medcos",
  "message": "texto da mensagem",
  "timestamp": "2025-11-29T12:00:00.000Z",
  "channel": "${formData.chat_channel}",
  "medcos_match": ${formData.chat_medcos_match}
}`}
                  </pre>
                  <strong className="mt-2 block">Resposta esperada do N8N:</strong>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded">
{`{
  "response": "Texto da resposta em Markdown"
}`}
                  </pre>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Original N8N Configurations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks de Agendamentos e Pagamentos
              </CardTitle>
              <CardDescription>
                Configure automações para notificações e integrações de negócio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  Estes webhooks são chamados automaticamente quando agendamentos são criados ou pagamentos são processados.
                  Use para enviar notificações, integrar com CRMs ou outras automações.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="booking_webhook">URL Webhook - Agendamentos</Label>
                  <div className="flex gap-2">
                    <Input
                      id="booking_webhook"
                      value={formData.booking_webhook_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, booking_webhook_url: e.target.value }))}
                      placeholder="https://seu-n8n.com/webhook/booking"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('booking')}
                      disabled={testing === 'booking' || !formData.booking_webhook_url}
                    >
                      {testing === 'booking' ? 'Testando...' : 'Testar'}
                    </Button>
                  </div>
                  {getStatusBadge(webhookStatus.booking)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_webhook">URL Webhook - Pagamentos</Label>
                  <div className="flex gap-2">
                    <Input
                      id="payment_webhook"
                      value={formData.payment_webhook_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_webhook_url: e.target.value }))}
                      placeholder="https://seu-n8n.com/webhook/payment"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('payment')}
                      disabled={testing === 'payment' || !formData.payment_webhook_url}
                    >
                      {testing === 'payment' ? 'Testando...' : 'Testar'}
                    </Button>
                  </div>
                  {getStatusBadge(webhookStatus.payment)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="send_notifications"
                  checked={formData.send_appointment_notifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_appointment_notifications: checked }))}
                />
                <Label htmlFor="send_notifications">
                  Enviar notificações automáticas de agendamento
                </Label>
                <Badge variant={formData.send_appointment_notifications ? "default" : "secondary"}>
                  {formData.send_appointment_notifications ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="booking_template">Template Payload - Agendamentos</Label>
                  <Textarea
                    id="booking_template"
                    value={formData.booking_payload_template}
                    onChange={(e) => setFormData(prev => ({ ...prev, booking_payload_template: e.target.value }))}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder="Template JSON para webhook de agendamentos"
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Dados disponíveis:</Badge>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {`{{appointment.*}}, {{professional.*}}`}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_template">Template Payload - Pagamentos</Label>
                  <Textarea
                    id="payment_template"
                    value={formData.payment_payload_template}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_payload_template: e.target.value }))}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder="Template JSON para webhook de pagamentos"
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Status disponíveis:</Badge>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      paid, pending, cancelled, failed
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsageChart
              title="Uso de Webhooks (7 dias)"
              description="Chamadas por tipo de webhook"
              data={usageData}
              type="bar"
              dataKey="booking"
              xAxisKey="name"
            />
            <UsageChart
              title="Chat IA vs Webhooks"
              description="Distribuição de uso"
              data={[
                { name: 'Chat IA', value: usageData.reduce((acc, curr) => acc + curr.chat, 0) },
                { name: 'Agendamentos', value: usageData.reduce((acc, curr) => acc + curr.booking, 0) },
                { name: 'Pagamentos', value: usageData.reduce((acc, curr) => acc + curr.payment, 0) }
              ]}
              type="pie"
              dataKey="value"
            />
          </div>
          
          <UsageChart
            title="Tendência de Uso de Integrações"
            description="Volume de chamadas ao longo do tempo"
            data={usageData.map(d => ({ ...d, total: d.booking + d.payment + d.chat }))}
            type="area"
            dataKey="total"
            xAxisKey="name"
            height={250}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <ConfigDataTable
            title="Logs de Configurações N8N"
            description="Histórico de alterações e configurações"
            data={configs.filter(c => c.category.includes('n8n'))}
          />
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentação Rápida</CardTitle>
                <CardDescription>Links úteis e recursos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">N8N Oficial</h4>
                  <a href="https://docs.n8n.io" target="_blank" className="text-sm text-primary hover:underline">
                    docs.n8n.io - Documentação oficial
                  </a>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Webhooks</h4>
                  <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" target="_blank" className="text-sm text-primary hover:underline">
                    Como configurar webhooks
                  </a>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Exemplos de Workflows</h4>
                  <a href="https://n8n.io/workflows" target="_blank" className="text-sm text-primary hover:underline">
                    Biblioteca de workflows
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suporte Técnico</CardTitle>
                <CardDescription>Precisa de ajuda?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Se você está tendo problemas com as configurações N8N, nossa equipe pode ajudar:
                </p>
                <Button variant="outline" className="w-full">
                  Abrir Ticket de Suporte
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowWizard(true)}>
                  Executar Assistente Novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};