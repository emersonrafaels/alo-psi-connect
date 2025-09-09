import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Save, TestTube2, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const N8NConfig = () => {
  const { getConfig, updateConfig, loading, hasPermission } = useSystemConfig(['n8n']);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    }, null, 2))
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateConfig('n8n', 'booking_webhook_url', formData.booking_webhook_url),
        updateConfig('n8n', 'payment_webhook_url', formData.payment_webhook_url),
        updateConfig('n8n', 'send_appointment_notifications', formData.send_appointment_notifications),
        updateConfig('n8n', 'booking_payload_template', formData.booking_payload_template),
        updateConfig('n8n', 'payment_payload_template', formData.payment_payload_template)
      ]);
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async (type: 'booking' | 'payment') => {
    setTesting(type);
    try {
      const url = type === 'booking' ? formData.booking_webhook_url : formData.payment_webhook_url;
      const template = type === 'booking' ? formData.booking_payload_template : formData.payment_payload_template;
      
      if (!url) {
        toast({
          title: "URL do webhook não configurada",
          description: `Configure a URL do webhook de ${type === 'booking' ? 'agendamento' : 'pagamento'} primeiro`,
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
          description: `O webhook de ${type === 'booking' ? 'agendamento' : 'pagamento'} respondeu corretamente`
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Configurações N8N
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

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};