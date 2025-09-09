import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Save, TestTube2, Webhook, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const N8NConfig = () => {
  const { getConfig, updateConfig, loading, hasPermission } = useSystemConfig(['n8n', 'n8n_chat']);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    // Novas configurações para chat AI
    chat_webhook_url: getConfig('n8n_chat', 'webhook_url', ''),
    chat_enabled: getConfig('n8n_chat', 'enabled', false),
    chat_timeout_seconds: getConfig('n8n_chat', 'timeout_seconds', 30),
    chat_fallback_openai: getConfig('n8n_chat', 'fallback_openai', true),
    chat_payload_template: getConfig('n8n_chat', 'payload_template', JSON.stringify({
      event: "ai_chat_message",
      timestamp: "{{timestamp}}",
      session_id: "{{session_id}}",
      user: {
        message: "{{user_message}}",
        context: "{{context}}",
        page: "{{page}}",
        filters: "{{filters}}"
      },
      professionals: "{{professionals}}",
      platform: "alopsi"
    }, null, 2))
  });

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
        // Novas configurações para chat AI
        updateConfig('n8n_chat', 'webhook_url', formData.chat_webhook_url),
        updateConfig('n8n_chat', 'enabled', formData.chat_enabled),
        updateConfig('n8n_chat', 'timeout_seconds', formData.chat_timeout_seconds),
        updateConfig('n8n_chat', 'fallback_openai', formData.chat_fallback_openai),
        updateConfig('n8n_chat', 'payload_template', formData.chat_payload_template)
      ]);
    } finally {
      setSaving(false);
    }
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
        template = formData.chat_payload_template;
      }
      
      if (!url) {
        toast({
          title: "URL do webhook não configurada",
          description: `Configure a URL do webhook de ${type === 'booking' ? 'agendamento' : type === 'payment' ? 'pagamento' : 'chat'} primeiro`,
          variant: "destructive"
        });
        return;
      }

      // Test payload
      const testPayload = JSON.parse(template.replace(/\{\{[^}]+\}\}/g, 'test_value'));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast({
          title: "Webhook testado com sucesso",
          description: `O webhook de ${type === 'booking' ? 'agendamento' : type === 'payment' ? 'pagamento' : 'chat'} respondeu corretamente`
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      toast({
        title: "Erro no teste do webhook",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setTesting(null);
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

  return (
    <div className="space-y-6">
      {/* Chat AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Assistente de IA via N8N
          </CardTitle>
          <CardDescription>
            Configure o fluxo N8N para o assistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="chat_enabled"
              checked={formData.chat_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_enabled: checked }))}
            />
            <Label htmlFor="chat_enabled">
              Usar N8N para assistente de IA (se desabilitado, usa OpenAI direto)
            </Label>
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
                  disabled={testing === 'chat'}
                >
                  {testing === 'chat' ? 'Testando...' : 'Testar'}
                </Button>
              </div>
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
            </div>
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
            <p className="text-sm text-muted-foreground">
              Use {`{{user_message}}, {{professionals}}, {{context}}`} etc. para inserir dados do chat
            </p>
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
            Configure as integrações com N8N para automação de fluxos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  disabled={testing === 'booking'}
                >
                  {testing === 'booking' ? 'Testando...' : 'Testar'}
                </Button>
              </div>
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
                  disabled={testing === 'payment'}
                >
                  {testing === 'payment' ? 'Testando...' : 'Testar'}
                </Button>
              </div>
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
              <p className="text-sm text-muted-foreground">
                Use {`{{appointment.campo}}`} para inserir dados do agendamento
              </p>
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
              <p className="text-sm text-muted-foreground">
                Use {`{{appointment.campo}}`} para inserir dados do pagamento
              </p>
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
    </div>
  );
};