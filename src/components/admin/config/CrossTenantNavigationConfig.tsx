import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Tenant } from '@/types/tenant';
import { Loader2, Link2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CrossTenantNavigationConfig = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadConfig(selectedTenantId);
    }
  }, [selectedTenantId]);

  const loadTenants = async () => {
    const { data } = await supabase.from('tenants').select('*').eq('is_active', true);
    if (data) {
      setTenants(data as unknown as Tenant[]);
      if (data.length > 0) {
        setSelectedTenantId(data[0].id);
      }
    }
  };

  const loadConfig = async (tenantId: string) => {
    const { data } = await supabase
      .from('tenants')
      .select('cross_tenant_navigation_warning_enabled, cross_tenant_navigation_warning_title, cross_tenant_navigation_warning_message, name')
      .eq('id', tenantId)
      .single();

    if (data) {
      setConfig({
        enabled: data.cross_tenant_navigation_warning_enabled || false,
        title: data.cross_tenant_navigation_warning_title || `${data.name} em Construção`,
        message: data.cross_tenant_navigation_warning_message || `O site ${data.name} está temporariamente indisponível enquanto realizamos melhorias. Agradecemos sua compreensão!`,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedTenantId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          cross_tenant_navigation_warning_enabled: config.enabled,
          cross_tenant_navigation_warning_title: config.title,
          cross_tenant_navigation_warning_message: config.message,
        })
        .eq('id', selectedTenantId);

      if (error) throw error;

      // Clear tenant cache
      const tenant = tenants.find(t => t.id === selectedTenantId);
      if (tenant) {
        localStorage.removeItem(`tenant_${tenant.slug}_cache`);
      }

      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Navegação Entre Tenants</h2>
        <p className="text-muted-foreground">
          Configure avisos de "em construção" ao navegar entre diferentes tenants
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Quando habilitado, usuários que tentarem acessar este tenant a partir de outro verão um modal informando que o site está em construção.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Tenant</CardTitle>
          <CardDescription>Escolha o tenant que deseja configurar o aviso de construção</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTenantId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Configuração do Aviso
              </CardTitle>
              <CardDescription>
                Configure se outros tenants devem exibir um aviso ao tentar acessar {selectedTenant?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Habilitar Aviso de Construção</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe um modal informando que o site está em construção
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={enabled => setConfig(prev => ({ ...prev, enabled }))}
                />
              </div>

              {config.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Modal</Label>
                    <Input
                      id="title"
                      value={config.title}
                      onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={`${selectedTenant?.name} em Construção`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem do Modal</Label>
                    <Textarea
                      id="message"
                      value={config.message}
                      onChange={e => setConfig(prev => ({ ...prev, message: e.target.value }))}
                      placeholder={`O site ${selectedTenant?.name} está temporariamente indisponível...`}
                      rows={4}
                    />
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/50">
                    <p className="text-sm font-medium mb-3">Preview do Modal:</p>
                    <div className="bg-background rounded-lg p-6 border shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-semibold">{config.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{config.message}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configuração
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
