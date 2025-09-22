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
import { Save, TestTube2, Webhook, Bot, Activity, Settings, HelpCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
    // Configurações para chat AI com retry
    chat_webhook_url: '',
    chat_enabled: false,
    chat_timeout_seconds: 30,
    chat_fallback_openai: true,
    chat_max_retries: 3,
    chat_retry_delay_ms: 1000,
    chat_retry_backoff_multiplier: 2,
    chat_payload_template: JSON.stringify({
      event: "ai_chat_message",
      timestamp: "{{timestamp}}",
      session_id: "{{session_id}}",
      user: {
        message: "{{user_message}}",
        context: "{{context}}",
        page: "{{page}}",
        filters: "{{filters}}",
        professionals: "{{professionals}}"
      },
      platform: "alopsi"
    }, null, 2)
  });

  // Update formData when configs are loaded
  useEffect(() => {
    if (configs.length > 0) {
      console.log('🔧 [N8NConfig] Loading configs:', configs);
      
      // Get the payload template as string (try both keys for compatibility)
      const payloadTemplate = getConfig('n8n', 'chat_payload_template', null) || 
                              getConfig('n8n_chat', 'payload_template', JSON.stringify({
        event: "ai_chat_message",
        timestamp: "{{timestamp}}",
        session_id: "{{session_id}}",
        user: {
          message: "{{user_message}}",
          context: "{{context}}",
          page: "{{page}}",
          filters: "{{filters}}",
          professionals: "{{professionals}}"
        },
        platform: "alopsi"
      }));
      
      console.log('🔧 [N8NConfig] Chat payload template from DB:', payloadTemplate);
      
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
        // Configurações para chat AI com retry (now using n8n category)
        chat_webhook_url: getConfig('n8n', 'chat_webhook_url', '') || getConfig('n8n_chat', 'webhook_url', ''),
        chat_enabled: getConfig('n8n', 'chat_enabled', false) || getConfig('n8n_chat', 'enabled', false),
        chat_timeout_seconds: parseInt(getConfig('n8n', 'chat_timeout_seconds', '30') || getConfig('n8n_chat', 'timeout_seconds', '30')),
        chat_fallback_openai: getConfig('n8n', 'chat_fallback_openai', true) && getConfig('n8n_chat', 'fallback_openai', true),
        chat_max_retries: parseInt(getConfig('n8n', 'chat_max_retries', '3') || getConfig('n8n_chat', 'max_retries', '3')),
        chat_retry_delay_ms: parseInt(getConfig('n8n', 'chat_retry_delay_ms', '1000') || getConfig('n8n_chat', 'retry_delay_ms', '1000')),
        chat_retry_backoff_multiplier: parseFloat(getConfig('n8n', 'chat_retry_backoff_multiplier', '2') || getConfig('n8n_chat', 'retry_backoff_multiplier', '2')),
        // Format template nicely for display if it's a JSON string
        chat_payload_template: (() => {
          try {
            console.log('🔧 [N8NConfig] Processing template for display:', {
              payloadTemplate,
              type: typeof payloadTemplate,
              isObject: typeof payloadTemplate === 'object'
            });
            
            // If it's a JSON object, stringify it nicely
            if (typeof payloadTemplate === 'object' && payloadTemplate !== null) {
              const formatted = JSON.stringify(payloadTemplate, null, 2);
              console.log('🔧 [N8NConfig] Formatted object template:', formatted);
              return formatted;
            }
            // If it's a string, try to parse and reformat
            const parsed = JSON.parse(payloadTemplate);
            const formatted = JSON.stringify(parsed, null, 2);
            console.log('🔧 [N8NConfig] Formatted string template:', formatted);
            return formatted;
          } catch (error) {
            console.log('🔧 [N8NConfig] Template formatting failed:', error, 'using as-is:', payloadTemplate);
            // If parsing fails, return as-is
            return payloadTemplate;
          }
        })()
      });
    }
  }, [configs, getConfig]);

  const checkWebhookStatus = async () => {
    const webhooks = [
      { type: 'booking', url: formData.booking_webhook_url },
      { type: 'payment', url: formData.payment_webhook_url },
      { type: 'chat', url: formData.chat_webhook_url }
    ];

    console.log('Checking webhook status for URLs:', webhooks);

    const statusChecks = await Promise.allSettled(
      webhooks.map(async ({ type, url }) => {
        if (!url) return { type, status: 'not_configured' };
        
        try {
          // Use GET request with health check parameter and timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(`${url}?health=check`, { 
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
          
          // Accept any response (200-299) or specific N8N responses
          if (response.ok || response.status === 404 || response.status === 405) {
            console.log(`Webhook ${type} is online (status: ${response.status})`);
            return { type, status: 'online' };
          } else {
            console.log(`Webhook ${type} is offline (status: ${response.status})`);
            return { type, status: 'offline' };
          }
        } catch (error) {
          console.warn(`Webhook status check failed for ${type}:`, error);
          return { type, status: 'offline' };
        }
      })
    );

    const newStatus = { booking: 'unknown', payment: 'unknown', chat: 'unknown' };
    statusChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { type, status } = result.value;
        newStatus[type as keyof typeof newStatus] = status;
      }
    });
    
    console.log('Updated webhook status:', newStatus);
    setWebhookStatus(newStatus);
  };

  // Check webhook status after configs are loaded and formData is updated
  useEffect(() => {
    if (!loading && hasPermission && configs.length > 0) {
      // Wait a bit for formData to be updated with loaded configs
      const timeoutId = setTimeout(() => {
        if (formData.booking_webhook_url || formData.payment_webhook_url || formData.chat_webhook_url) {
          console.log('Initial webhook status check with URLs:', {
            booking: formData.booking_webhook_url,
            payment: formData.payment_webhook_url,
            chat: formData.chat_webhook_url
          });
          checkWebhookStatus();
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, hasPermission, configs.length, formData.booking_webhook_url, formData.payment_webhook_url, formData.chat_webhook_url]);

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
      // Validate chat payload template before saving
      let payloadToSave = formData.chat_payload_template;
      if (formData.chat_payload_template) {
        try {
          // Try to parse and minify the JSON template
          const parsed = JSON.parse(formData.chat_payload_template);
          payloadToSave = JSON.stringify(parsed); // Minified version for storage
        } catch (error) {
          toast({
            title: "Erro no template",
            description: "Template do payload de chat contém JSON inválido",
            variant: "destructive"
          });
          return;
        }
      }

      await Promise.all([
        // Configurações originais
        updateConfig('n8n', 'booking_webhook_url', formData.booking_webhook_url),
        updateConfig('n8n', 'payment_webhook_url', formData.payment_webhook_url),
        updateConfig('n8n', 'send_appointment_notifications', formData.send_appointment_notifications),
        updateConfig('n8n', 'booking_payload_template', formData.booking_payload_template),
        updateConfig('n8n', 'payment_payload_template', formData.payment_payload_template),
        // Configurações para chat AI com retry (now saving to n8n category)
        updateConfig('n8n', 'chat_webhook_url', formData.chat_webhook_url),
        updateConfig('n8n', 'chat_enabled', formData.chat_enabled),
        updateConfig('n8n', 'chat_timeout_seconds', formData.chat_timeout_seconds.toString()),
        updateConfig('n8n', 'chat_fallback_openai', formData.chat_fallback_openai),
        updateConfig('n8n', 'chat_max_retries', formData.chat_max_retries.toString()),
        updateConfig('n8n', 'chat_retry_delay_ms', formData.chat_retry_delay_ms.toString()),
        updateConfig('n8n', 'chat_retry_backoff_multiplier', formData.chat_retry_backoff_multiplier.toString()),
        updateConfig('n8n', 'chat_payload_template', payloadToSave)
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

  // Utility function to create payload from template
  const createPayloadFromTemplate = (template: string, variables: Record<string, any>): any => {
    try {
      console.log('Creating payload from template:', template);
      console.log('With variables:', variables);
      
      // First, validate basic JSON structure by checking brace/bracket balance
      let templateCopy = template.trim();
      
      // Check for basic JSON structure issues
      const openBraces = (templateCopy.match(/\{/g) || []).length;
      const closeBraces = (templateCopy.match(/\}/g) || []).length;
      const openBrackets = (templateCopy.match(/\[/g) || []).length;
      const closeBrackets = (templateCopy.match(/\]/g) || []).length;
      
      if (openBraces !== closeBraces) {
        throw new Error(`Template JSON malformado: ${openBraces} '{' mas ${closeBraces} '}'. Verifique se todas as chaves estão fechadas.`);
      }
      
      if (openBrackets !== closeBrackets) {
        throw new Error(`Template JSON malformado: ${openBrackets} '[' mas ${closeBrackets} ']'. Verifique se todos os arrays estão fechados.`);
      }
      
      // Replace all variables with appropriate test values for validation
      const testTemplate = templateCopy.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
        const varName = variable.trim();
        
        // Use appropriate test values based on variable names and context
        if (varName === 'filters' || varName.includes('filter')) {
          return '{}'; // Empty object for filters (without quotes)
        }
        if (varName === 'professionals' || varName.includes('professional') && varName.includes('s')) {
          return '[]'; // Empty array for professionals list (without quotes)
        }
        if (varName.includes('professional') && !varName.includes('s')) {
          return '{}'; // Empty object for single professional (without quotes)
        }
        
        return '"test_value"'; // String value for other variables
      });
      
      // Validate JSON structure
      try {
        JSON.parse(testTemplate);
      } catch (validationError) {
        const errorMsg = validationError.message;
        // Provide more helpful error messages
        if (errorMsg.includes("Expected ',' or '}'")) {
          throw new Error(`Template JSON inválido: Falta vírgula ou chave de fechamento '}'. Verifique a sintaxe JSON. Erro: ${errorMsg}`);
        }
        if (errorMsg.includes("Expected ',' or ']'")) {
          throw new Error(`Template JSON inválido: Falta vírgula ou colchete de fechamento ']'. Verifique a sintaxe JSON. Erro: ${errorMsg}`);
        }
        throw new Error(`Template JSON inválido: ${errorMsg}`);
      }
      
      // Process template and substitute real variables
      const processedTemplate = templateCopy.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
        const varName = variable.trim();
        const value = variables[varName];
        
        if (value === undefined) {
          console.warn(`Template variable ${varName} not found, using fallback`);
          // Use appropriate fallback based on variable type
          if (varName === 'filters' || varName.includes('filter')) {
            return '{}';
          }
          if (varName === 'professionals' || varName.includes('professional') && varName.includes('s')) {
            return '[]';
          }
          if (varName.includes('professional') && !varName.includes('s')) {
            return '{}';
          }
          return '"fallback_value"';
        }
        
        // For objects and arrays, insert JSON directly (no extra quotes)
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        
        // For strings, numbers, booleans - JSON stringify to handle quotes properly
        return JSON.stringify(value);
      });
      
      console.log('Processed template for testing:', processedTemplate);
      const parsed = JSON.parse(processedTemplate);
      console.log('Successfully parsed payload:', parsed);
      return parsed;
    } catch (error) {
      console.error('Template processing error:', error);
      throw new Error(`Template inválido: ${error.message}`);
    }
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
        url = formData.booking_webhook_url;
        template = formData.booking_payload_template;
      } else if (type === 'payment') {
        url = formData.payment_webhook_url;
        template = formData.payment_payload_template;
      } else if (type === 'chat') {
        url = formData.chat_webhook_url;
        // Use template from database for chat to test exactly what's saved
        template = getConfig('n8n', 'chat_payload_template', null) || 
                   getConfig('n8n_chat', 'payload_template', formData.chat_payload_template);
      }
      
      if (!url) {
        toast({
          title: "URL do webhook não configurada",
          description: `Configure a URL do webhook de ${type === 'booking' ? 'agendamento' : type === 'payment' ? 'pagamento' : 'chat'} primeiro`,
          variant: "destructive"
        });
        return;
      }

      if (!template) {
        toast({
          title: "Template não encontrado",
          description: `Template do payload de ${type === 'booking' ? 'agendamento' : type === 'payment' ? 'pagamento' : 'chat'} não está configurado`,
          variant: "destructive"
        });
        return;
      }

      // Test payload with comprehensive variable substitution
      let testPayload;
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
          'professional.display_name': "Dr. Maria Santos",
          
          // Chat related
          'timestamp': new Date().toISOString(),
          'session_id': `test-session-${Date.now()}`,
          'user_message': "Olá, preciso de ajuda para encontrar um psicólogo especializado em ansiedade",
          'context': "busca-profissionais",
          'page': "/professionals?specialty=psicologia&location=sao-paulo",
          'filters': {"specialty": "Psicologia", "location": "São Paulo", "price_range": "100-200"},
          'professionals': [
            {"id": 1, "name": "Dr. Maria Santos", "specialty": "Psicologia Clínica"},
            {"id": 2, "name": "Dr. João Silva", "specialty": "Psiquiatria"}
          ]
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
      case 'online': return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>;
      case 'offline': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Offline</Badge>;
      case 'not_configured': return <Badge variant="secondary">Não configurado</Badge>;
      default: return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Verificando...</Badge>;
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
                Assistente de IA via N8N
                {getStatusBadge(webhookStatus.chat)}
              </CardTitle>
              <CardDescription>
                Configure o fluxo N8N para processar consultas do assistente de IA com modelos customizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  Quando habilitado, as consultas do chat IA são enviadas primeiro para seu workflow N8N. 
                  Se falhar ou estiver desabilitado, usa OpenAI diretamente como fallback.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Switch
                  id="chat_enabled"
                  checked={formData.chat_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_enabled: checked }))}
                />
                <Label htmlFor="chat_enabled">
                  Usar N8N para assistente de IA
                </Label>
                <Badge variant={formData.chat_enabled ? "default" : "secondary"}>
                  {formData.chat_enabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="chat_webhook">URL Webhook - Chat AI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="chat_webhook"
                      value={formData.chat_webhook_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, chat_webhook_url: e.target.value }))}
                      placeholder="https://seu-n8n.com/webhook/chat"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('chat')}
                      disabled={testing === 'chat' || !formData.chat_webhook_url}
                    >
                      {testing === 'chat' ? 'Testando...' : 'Testar'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    URL do webhook N8N que processará as mensagens do chat
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat_timeout">Timeout (segundos)</Label>
                  <Input
                    id="chat_timeout"
                    type="number"
                    value={formData.chat_timeout_seconds}
                    onChange={(e) => setFormData(prev => ({ ...prev, chat_timeout_seconds: parseInt(e.target.value) }))}
                    min={5}
                    max={60}
                  />
                  <p className="text-sm text-muted-foreground">
                    Tempo limite para resposta do N8N (recomendado: 30s)
                  </p>
                </div>
              </div>

              {/* Retry Configuration Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">⚡ Configuração de Retry (Sistema de Tentativas)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chat_max_retries">Máximo de Tentativas</Label>
                    <Input
                      id="chat_max_retries"
                      type="number"
                      value={formData.chat_max_retries}
                      onChange={(e) => setFormData(prev => ({ ...prev, chat_max_retries: parseInt(e.target.value) }))}
                      min={1}
                      max={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantas vezes tentar novamente se falhar (1-5)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chat_retry_delay">Delay Inicial (ms)</Label>
                    <Input
                      id="chat_retry_delay"
                      type="number"
                      value={formData.chat_retry_delay_ms}
                      onChange={(e) => setFormData(prev => ({ ...prev, chat_retry_delay_ms: parseInt(e.target.value) }))}
                      min={100}
                      max={10000}
                      step={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo de espera inicial entre tentativas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chat_backoff_multiplier">Multiplicador de Backoff</Label>
                    <Input
                      id="chat_backoff_multiplier"
                      type="number"
                      value={formData.chat_retry_backoff_multiplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, chat_retry_backoff_multiplier: parseFloat(e.target.value) }))}
                      min={1}
                      max={5}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Fator de crescimento do delay (2.0 = dobra a cada tentativa)
                    </p>
                  </div>
                </div>
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Exemplo:</strong> Com 3 tentativas, delay 1000ms e multiplicador 2.0: <br/>
                    • 1ª tentativa: Imediato <br/>
                    • 2ª tentativa: Após 1000ms <br/>
                    • 3ª tentativa: Após 2000ms
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="chat_fallback"
                  checked={formData.chat_fallback_openai}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_fallback_openai: checked }))}
                />
                <Label htmlFor="chat_fallback">
                  Usar OpenAI como fallback se N8N falhar
                </Label>
                <Badge variant={formData.chat_fallback_openai ? "default" : "destructive"}>
                  {formData.chat_fallback_openai ? "Habilitado" : "Desabilitado"}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat_template">Template Payload - Chat AI</Label>
                <Textarea
                  id="chat_template"
                  value={formData.chat_payload_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, chat_payload_template: e.target.value }))}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Template JSON para webhook do chat"
                />
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Variáveis disponíveis:</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {`{{user_message}}, {{professionals}}, {{context}}, {{timestamp}}`}
                  </code>
                </div>
              </div>
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