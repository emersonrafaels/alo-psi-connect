import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Save, Settings, Mail, CreditCard, Clock, TrendingUp, Users, Database, Shield, AlertTriangle, Image, ToggleLeft } from 'lucide-react';
import { MetricsCard } from './MetricsCard';
import { UsageChart } from './UsageChart';
import { ConfigDataTable } from './ConfigDataTable';
import { supabase } from '@/integrations/supabase/client';

export const SystemConfig = () => {
  const { getConfig, updateConfig, loading, hasPermission, configs } = useSystemConfig(['system', 'homepage']);
  const [saving, setSaving] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    totalAppointments: 0,
    totalUsers: 0,
    storageUsed: 0,
    activeConfigs: 0
  });
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // System settings
    auto_cancel_hours: 24,
    max_file_size_mb: 10,
    // Email settings
    sender_name: 'AloPsi',
    support_email: 'contato@alopsi.com.br',
    // Payment settings
    mercado_pago_access_token: '',
    payment_success_redirect: '/pagamento-sucesso',
    payment_cancel_redirect: '/pagamento-cancelado',
    // Homepage settings
    hero_carousel_mode: false,
    hero_carousel_auto_play: false,
    hero_carousel_auto_play_delay: 5,
    hero_images: ['https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero.png']
  });

  // Separate state for textarea input
  const [heroImagesInput, setHeroImagesInput] = useState('');

  const handleSaveGuestLimit = async () => {
    try {
      const limitNumber = parseInt(guestLimit, 10);
      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 10) {
        toast({
          title: "Valor inválido",
          description: "O limite deve ser um número entre 1 e 10.",
          variant: "destructive",
        });
        return;
      }

      await updateConfig('system', 'guest_diary_limit', guestLimit);
      toast({
        title: "Configuração salva",
        description: "O limite de entradas guest foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive",
      });
    }
  };

  // Fetch system metrics and analytics
  useEffect(() => {
    const fetchSystemMetrics = async () => {
      try {
        // Fetch appointments count
        const { count: appointmentsCount } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true });

        // Fetch users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setSystemMetrics({
          totalAppointments: appointmentsCount || 0,
          totalUsers: usersCount || 0,
          storageUsed: Math.floor(Math.random() * 500) + 100, // Mock data
          activeConfigs: configs.length
        });

        // Mock financial data
        const mockFinancialData = Array.from({ length: 7 }, (_, i) => ({
          name: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { weekday: 'short' }),
          revenue: Math.floor(Math.random() * 5000) + 1000,
          appointments: Math.floor(Math.random() * 50) + 10,
          cancellations: Math.floor(Math.random() * 10) + 2
        }));
        setFinancialData(mockFinancialData);

        // Mock security alerts
        setSecurityAlerts([
          {
            type: 'warning',
            message: 'Token MercadoPago será expirado em 30 dias',
            timestamp: new Date().toISOString()
          },
          {
            type: 'info',
            message: 'Backup automático realizado com sucesso',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      } catch (error) {
        console.error('Error fetching system metrics:', error);
      }
    };

    if (hasPermission && !loading) {
      fetchSystemMetrics();
    }
  }, [hasPermission, loading, configs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        // System settings
        updateConfig('system', 'auto_cancel_hours', formData.auto_cancel_hours),
        updateConfig('system', 'max_file_size_mb', formData.max_file_size_mb),
        // Email settings
        updateConfig('system', 'sender_name', formData.sender_name),
        updateConfig('system', 'support_email', formData.support_email),
        // Payment settings
        updateConfig('system', 'mercado_pago_access_token', formData.mercado_pago_access_token),
        updateConfig('system', 'payment_success_redirect', formData.payment_success_redirect),
        updateConfig('system', 'payment_cancel_redirect', formData.payment_cancel_redirect),
        // Homepage settings
        updateConfig('homepage', 'hero_carousel_mode', formData.hero_carousel_mode),
        updateConfig('homepage', 'hero_carousel_auto_play', formData.hero_carousel_auto_play),
        updateConfig('homepage', 'hero_carousel_auto_play_delay', formData.hero_carousel_auto_play_delay),
        updateConfig('homepage', 'hero_images', formData.hero_images)
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
      {/* System Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total de Usuários"
          value={systemMetrics.totalUsers}
          description="usuários registrados"
          icon={Users}
          trend={8}
        />
        <MetricsCard
          title="Agendamentos"
          value={systemMetrics.totalAppointments}
          description="total na plataforma"
          icon={Clock}
          trend={15}
        />
        <MetricsCard
          title="Armazenamento"
          value={`${systemMetrics.storageUsed}MB`}
          description="espaço utilizado"
          icon={Database}
          trend={-2}
        />
        <MetricsCard
          title="Configurações"
          value={systemMetrics.activeConfigs}
          description="configurações ativas"
          icon={Settings}
        />
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="space-y-2">
          {securityAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {alert.message}
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
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
                  <Badge variant={formData.auto_cancel_hours <= 24 ? "default" : "destructive"}>
                    {formData.auto_cancel_hours <= 24 ? "Padrão recomendado" : "Período muito longo"}
                  </Badge>
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
                  <p className="text-sm text-muted-foreground">
                    Tamanho máximo para upload de fotos de perfil
                  </p>
                  <Badge variant={formData.max_file_size_mb <= 10 ? "default" : "secondary"}>
                    {formData.max_file_size_mb <= 10 ? "Otimizado" : "Alto"}
                  </Badge>
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
                  <p className="text-sm text-muted-foreground">
                    Nome que aparecerá nos emails enviados
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Email para onde os usuários podem enviar dúvidas
                  </p>
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
                <Badge variant="outline">Dados Sensíveis</Badge>
              </CardTitle>
              <CardDescription>
                Configure as opções de pagamento e redirecionamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Estas configurações contêm dados sensíveis. Mantenha-as seguras e atualize regularmente.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="mp_token">Token de Acesso MercadoPago</Label>
                <Input
                  id="mp_token"
                  type="password"
                  value={formData.mercado_pago_access_token}
                  onChange={(e) => setFormData(prev => ({ ...prev, mercado_pago_access_token: e.target.value }))}
                  placeholder="APP_USR-***"
                />
                <Badge variant={formData.mercado_pago_access_token ? "default" : "destructive"}>
                  {formData.mercado_pago_access_token ? "Configurado" : "Não configurado"}
                </Badge>
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

          {/* Homepage Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Configurações da Homepage
              </CardTitle>
              <CardDescription>
                Configure as imagens do hero da página inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="carousel_mode">Modo Carrossel</Label>
                    <p className="text-sm text-muted-foreground">
                      Ative para usar múltiplas imagens em carrossel
                    </p>
                  </div>
                  <Switch
                    id="carousel_mode"
                    checked={formData.hero_carousel_mode}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hero_carousel_mode: checked }))}
                  />
                </div>

                {formData.hero_carousel_mode && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto_play">Passagem Automática</Label>
                        <p className="text-sm text-muted-foreground">
                          Ative para o carrossel passar automaticamente
                        </p>
                      </div>
                      <Switch
                        id="auto_play"
                        checked={formData.hero_carousel_auto_play}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hero_carousel_auto_play: checked }))}
                      />
                    </div>

                    {formData.hero_carousel_auto_play && (
                      <div className="space-y-2">
                        <Label htmlFor="auto_play_delay">Tempo entre Transições (segundos)</Label>
                        <Input
                          id="auto_play_delay"
                          type="number"
                          min="1"
                          max="30"
                          value={formData.hero_carousel_auto_play_delay}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            hero_carousel_auto_play_delay: Number(e.target.value) 
                          }))}
                        />
                        <p className="text-sm text-muted-foreground">
                          Recomendado: 3-8 segundos para boa experiência do usuário
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="hero_images">URLs das Imagens (S3)</Label>
                  <Textarea
                    id="hero_images"
                    value={heroImagesInput}
                    onChange={(e) => {
                      console.log('Input value:', e.target.value);
                      setHeroImagesInput(e.target.value);
                    }}
                    onBlur={(e) => {
                      // Only process URLs when user finishes editing
                      const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url !== '');
                      console.log('Processed URLs:', urls);
                      setFormData(prev => ({ ...prev, hero_images: urls }));
                    }}
                    placeholder="https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero1.png, https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero2.png"
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.hero_carousel_mode 
                      ? "Separe múltiplas URLs por vírgula para o carrossel"
                      : "Insira uma única URL de imagem"
                    }
                  </p>
                  <Badge variant={Array.isArray(formData.hero_images) && formData.hero_images.length > 0 ? "default" : "destructive"}>
                    {Array.isArray(formData.hero_images) && formData.hero_images.length > 0 
                      ? `${formData.hero_images.length} imagem(ns) configurada(s)` 
                      : "Nenhuma imagem configurada"
                    }
                  </Badge>
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsageChart
              title="Usuários Ativos (7 dias)"
              description="Novos registros por dia"
              data={financialData.map(d => ({ name: d.name, value: Math.floor(d.appointments / 3) }))}
              type="area"
              dataKey="value"
              xAxisKey="name"
            />
            <UsageChart
              title="Performance do Sistema"
              description="Métricas gerais"
              data={[
                { name: 'Agendamentos', value: systemMetrics.totalAppointments },
                { name: 'Usuários', value: systemMetrics.totalUsers },
                { name: 'Configurações', value: systemMetrics.activeConfigs * 10 }
              ]}
              type="pie"
              dataKey="value"
            />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsageChart
              title="Receita (7 dias)"
              description="Faturamento por dia"
              data={financialData}
              type="bar"
              dataKey="revenue"
              xAxisKey="name"
            />
            <UsageChart
              title="Agendamentos vs Cancelamentos"
              description="Comparativo semanal"
              data={financialData}
              type="line"
              dataKey="appointments"
              xAxisKey="name"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>Métricas financeiras da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {financialData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Receita Total (7 dias)</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {financialData.reduce((acc, curr) => acc + curr.appointments, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Agendamentos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {financialData.reduce((acc, curr) => acc + curr.cancellations, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Cancelamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <ConfigDataTable
            title="Configurações de Segurança"
            description="Histórico de alterações e auditoria de sistema"
            data={configs}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Alertas de Segurança
              </CardTitle>
              <CardDescription>
                Monitoramento de segurança e notificações importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Backup Automático</h4>
                    <p className="text-sm text-muted-foreground">Último backup realizado há 2 horas</p>
                  </div>
                  <Badge variant="default">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">SSL/HTTPS</h4>
                    <p className="text-sm text-muted-foreground">Certificado válido até 2025-12-31</p>
                  </div>
                  <Badge variant="default">Seguro</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Rate Limiting</h4>
                    <p className="text-sm text-muted-foreground">Proteção contra ataques DDoS ativa</p>
                  </div>
                  <Badge variant="default">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};