import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Check, RefreshCw, Video, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GoogleCalendarTenantConfig = () => {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  // Fetch tenant Google Calendar configuration
  const { data: tenantConfig, isLoading } = useQuery({
    queryKey: ['tenant-google-config', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('google_meet_mode, google_calendar_email, google_calendar_token, google_calendar_scope')
        .eq('id', tenant.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id
  });

  // Update Google Meet mode
  const updateModeMutation = useMutation({
    mutationFn: async (mode: 'professional' | 'tenant') => {
      if (!tenant?.id) throw new Error('Tenant not found');
      
      const { error } = await supabase
        .from('tenants')
        .update({ google_meet_mode: mode })
        .eq('id', tenant.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-google-config'] });
      toast({
        title: "Configuração atualizada",
        description: "Modo de criação do Google Meet foi alterado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar configuração: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Connect Google Calendar for tenant
  const handleConnectTenant = async () => {
    if (!tenant?.id) return;
    
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'connect',
          type: 'tenant',
          tenantId: tenant.id
        }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open OAuth popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          'Google Calendar Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for callback
        const messageHandler = async (event: MessageEvent) => {
          if (event.data.type === 'google-calendar-callback') {
            popup?.close();
            
            const { data: callbackData, error: callbackError } = await supabase.functions.invoke(
              'google-calendar-auth',
              {
                body: { 
                  action: 'connect', 
                  code: event.data.code,
                  type: 'tenant',
                  tenantId: tenant.id
                }
              }
            );

            if (callbackError || callbackData?.error) {
              throw new Error(callbackError?.message || callbackData?.error);
            }

            toast({
              title: "Sucesso!",
              description: "Google Calendar do tenant conectado com sucesso.",
            });

            queryClient.invalidateQueries({ queryKey: ['tenant-google-config'] });
            window.removeEventListener('message', messageHandler);
          }
        };

        window.addEventListener('message', messageHandler);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao conectar: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Google Calendar for tenant
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Tenant not found');
      
      const { error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'disconnect',
          type: 'tenant',
          tenantId: tenant.id
        }
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-google-config'] });
      toast({
        title: "Desconectado",
        description: "Google Calendar do tenant foi desconectado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao desconectar: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div>Carregando configurações...</div>;
  }

  const isConnected = !!(tenantConfig?.google_calendar_token);
  const currentMode = tenantConfig?.google_meet_mode || 'professional';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle>Modo de Criação do Google Meet</CardTitle>
          </div>
          <CardDescription>
            Escolha como os links do Google Meet serão criados para agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={currentMode} 
            onValueChange={(value) => updateModeMutation.mutate(value as 'professional' | 'tenant')}
          >
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="professional" id="professional" />
              <Label htmlFor="professional" className="flex-1 cursor-pointer">
                <div className="font-semibold">Email do Profissional</div>
                <div className="text-sm text-muted-foreground">
                  Cada profissional usa sua própria conta Google Calendar. O profissional precisa conectar sua conta individualmente.
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="tenant" id="tenant" />
              <Label htmlFor="tenant" className="flex-1 cursor-pointer">
                <div className="font-semibold">Email Centralizado do Tenant</div>
                <div className="text-sm text-muted-foreground">
                  Todos os agendamentos usam a conta Google Calendar centralizada do {tenant?.name} ({tenantConfig?.google_calendar_email || 'não configurado'})
                </div>
              </Label>
            </div>
          </RadioGroup>

          {currentMode === 'professional' && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Fallback automático:</strong> Se um profissional não tiver Google Calendar conectado, 
                o sistema usará automaticamente a conta centralizada do tenant (se configurada).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Google Calendar - Conta Centralizada</CardTitle>
          </div>
          <CardDescription>
            Gerencie a conexão da conta Google Calendar centralizada do tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Email Configurado</div>
              <div className="text-sm text-muted-foreground">
                {tenantConfig?.google_calendar_email || 'Nenhum email configurado'}
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Conectado
                </>
              ) : (
                'Não Conectado'
              )}
            </Badge>
          </div>

          {isConnected && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-green-900">Google Calendar Conectado</div>
                  <div className="text-sm text-green-700 mt-1">
                    Escopo: <Badge variant="outline" className="ml-1">{tenantConfig.google_calendar_scope}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={handleConnectTenant}
                disabled={connecting}
                className="gap-2"
              >
                {connecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Conectar Google Calendar
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => disconnectMutation.mutate()}
                  variant="destructive"
                  disabled={disconnectMutation.isPending}
                >
                  Desconectar
                </Button>
                <Button 
                  onClick={handleConnectTenant}
                  variant="outline"
                  disabled={connecting}
                >
                  Reconectar
                </Button>
              </>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Emails recomendados:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Rede Bem Estar: redebemestar1@gmail.com</li>
                <li>• Medcos: medcos.host@gmail.com</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
