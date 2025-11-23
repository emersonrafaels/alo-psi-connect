import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEmailTester, EMAIL_TYPES } from '@/hooks/useEmailTester';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Send, Eye, Code, History, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Tests() {
  const {
    emailType,
    setEmailType,
    recipientEmail,
    setRecipientEmail,
    tenantId,
    setTenantId,
    variables,
    updateVariable,
    customHtml,
    setCustomHtml,
    currentEmailType,
    previewHtml,
    sendTestEmail,
    isSending,
    testLogs,
    loadingLogs
  } = useEmailTester();

  // Fetch tenants for selector
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSendTest = () => {
    sendTestEmail();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Testes de Email</h1>
        <p className="text-muted-foreground mt-2">
          Teste e visualize templates de email antes de usar em produção
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Teste</CardTitle>
              <CardDescription>
                Preencha os campos para enviar um email de teste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Type Selector */}
              <div className="space-y-2">
                <Label htmlFor="email-type">Tipo de Email</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger id="email-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {currentEmailType.description}
                </p>
              </div>

              {/* Recipient Email */}
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Email Destinatário *</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="teste@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              {/* Tenant Selector */}
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant *</Label>
                <Select value={tenantId} onValueChange={setTenantId} disabled={loadingTenants}>
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder="Selecione o tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants?.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Variables */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-semibold">Variáveis do Template</Label>
                {currentEmailType.requiredVariables.map(varName => (
                  <div key={varName} className="space-y-2">
                    <Label htmlFor={`var-${varName}`} className="text-xs">
                      {varName} *
                    </Label>
                    <Input
                      id={`var-${varName}`}
                      placeholder={`Digite ${varName}`}
                      value={variables[varName] || ''}
                      onChange={(e) => updateVariable(varName, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Send Button */}
              <Button 
                onClick={handleSendTest}
                disabled={isSending || !recipientEmail || !tenantId}
                className="w-full"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Email de Teste
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Tests Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Carregando...
                </div>
              ) : testLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum teste realizado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {testLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.recipient_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                        {log.status === 'sent' ? 'Enviado' : 'Falhou'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Editor & Preview */}
        <div className="lg:col-span-3">
          <Card className="h-[800px] flex flex-col">
            <CardHeader>
              <CardTitle>Template do Email</CardTitle>
              <CardDescription>
                Visualize o preview ou edite o HTML do email
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="edit">
                    <Code className="mr-2 h-4 w-4" />
                    Editar HTML
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
                  <div className="border rounded-lg overflow-auto h-full bg-muted/30">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full"
                      sandbox="allow-same-origin"
                      title="Email Preview"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="flex-1 overflow-hidden mt-4">
                  <Textarea
                    placeholder="Cole o HTML customizado aqui (opcional)..."
                    value={customHtml}
                    onChange={(e) => setCustomHtml(e.target.value)}
                    className="h-full font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Deixe vazio para usar o template padrão
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
