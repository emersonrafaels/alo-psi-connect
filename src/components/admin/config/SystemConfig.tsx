import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Save, Settings, Mail, CreditCard, Clock } from 'lucide-react';

export const SystemConfig = () => {
  const { getConfig, updateConfig, loading, hasPermission } = useSystemConfig(['system', 'email', 'payment']);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    // System settings
    auto_cancel_hours: getConfig('system', 'auto_cancel_hours', 24),
    max_file_size_mb: getConfig('system', 'max_file_size_mb', 10),
    // Email settings
    sender_name: getConfig('email', 'sender_name', 'AloPsi'),
    support_email: getConfig('email', 'support_email', 'contato@alopsi.com.br'),
    // Payment settings
    mercado_pago_access_token: getConfig('payment', 'mercado_pago_access_token', ''),
    payment_success_redirect: getConfig('payment', 'payment_success_redirect', '/pagamento-sucesso'),
    payment_cancel_redirect: getConfig('payment', 'payment_cancel_redirect', '/pagamento-cancelado')
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        // System settings
        updateConfig('system', 'auto_cancel_hours', formData.auto_cancel_hours),
        updateConfig('system', 'max_file_size_mb', formData.max_file_size_mb),
        // Email settings
        updateConfig('email', 'sender_name', formData.sender_name),
        updateConfig('email', 'support_email', formData.support_email),
        // Payment settings
        updateConfig('payment', 'mercado_pago_access_token', formData.mercado_pago_access_token),
        updateConfig('payment', 'payment_success_redirect', formData.payment_success_redirect),
        updateConfig('payment', 'payment_cancel_redirect', formData.payment_cancel_redirect)
      ]);
    } finally {
      setSaving(false);
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
            Você não tem permissão para acessar as configurações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção está disponível apenas para Super Administradores
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription>
            Configurações gerais de funcionamento do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auto_cancel">Cancelamento Automático (horas)</Label>
              <Input
                id="auto_cancel"
                type="number"
                value={formData.auto_cancel_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, auto_cancel_hours: parseInt(e.target.value) }))}
                min={1}
                max={168}
              />
              <p className="text-sm text-muted-foreground">
                Agendamentos não pagos serão cancelados automaticamente após este período
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_file_size">Tamanho Máximo de Arquivo (MB)</Label>
              <Input
                id="max_file_size"
                type="number"
                value={formData.max_file_size_mb}
                onChange={(e) => setFormData(prev => ({ ...prev, max_file_size_mb: parseInt(e.target.value) }))}
                min={1}
                max={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Configure as informações de envio de emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender_name">Nome do Remetente</Label>
              <Input
                id="sender_name"
                value={formData.sender_name}
                onChange={(e) => setFormData(prev => ({ ...prev, sender_name: e.target.value }))}
                placeholder="AloPsi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_email">Email de Suporte</Label>
              <Input
                id="support_email"
                type="email"
                value={formData.support_email}
                onChange={(e) => setFormData(prev => ({ ...prev, support_email: e.target.value }))}
                placeholder="contato@alopsi.com.br"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configurações de Pagamento
          </CardTitle>
          <CardDescription>
            Configure as opções de pagamento e redirecionamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mp_token">Token de Acesso MercadoPago</Label>
            <Input
              id="mp_token"
              type="password"
              value={formData.mercado_pago_access_token}
              onChange={(e) => setFormData(prev => ({ ...prev, mercado_pago_access_token: e.target.value }))}
              placeholder="APP_USR-***"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="success_redirect">URL de Sucesso</Label>
              <Input
                id="success_redirect"
                value={formData.payment_success_redirect}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_success_redirect: e.target.value }))}
                placeholder="/pagamento-sucesso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancel_redirect">URL de Cancelamento</Label>
              <Input
                id="cancel_redirect"
                value={formData.payment_cancel_redirect}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_cancel_redirect: e.target.value }))}
                placeholder="/pagamento-cancelado"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </Button>
      </div>
    </div>
  );
};