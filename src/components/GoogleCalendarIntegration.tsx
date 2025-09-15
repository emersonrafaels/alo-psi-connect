import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GoogleCalendarIntegrationProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({
  isConnected,
  onConnectionChange
}) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();

  const handleConnectCalendar = async () => {
    if (!user || !session) {
      console.error('Erro: Usuário não autenticado', { user: !!user, session: !!session });
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para conectar o Google Calendar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando conexão com Google Calendar:', {
        userId: user.id,
        hasSession: !!session,
        hasAccessToken: !!session.access_token
      });
      
      // Chama a edge function para iniciar o OAuth do Google Calendar
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'connect' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Response from edge function:', { data, error });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (data?.error) {
        console.error('Erro retornado pela função:', data.error);
        throw new Error(data.error);
      }

      if (data?.authUrl) {
        console.log('Opening Google auth URL:', data.authUrl);
        // Abre a URL de autorização em uma nova janela
        window.open(data.authUrl, 'google-auth', 'width=500,height=600');
        
        // Aguarda a autorização (isso seria melhorado com postMessage)
        toast({
          title: "Redirecionando para o Google",
          description: "Complete a autorização na janela que se abriu. Se for bloqueado, verifique as configurações do Google Cloud Console.",
        });
      } else {
        console.error('No authUrl received:', data);
        throw new Error('URL de autorização não recebida');
      }
    } catch (error: any) {
      console.error('Erro completo na conexão:', {
        message: error.message,
        stack: error.stack,
        error
      });
      
      let errorMessage = error.message || "Erro desconhecido ao conectar o Google Calendar";
      
      // Tratamento específico para diferentes tipos de erro
      if (errorMessage.includes('credentials not configured')) {
        errorMessage = "As credenciais do Google Calendar não foram configuradas. Entre em contato com o administrador.";
      } else if (errorMessage.includes('access_blocked') || errorMessage.includes('disallowed_useragent')) {
        errorMessage = "Acesso bloqueado pelo Google. A aplicação precisa ser configurada no modo 'Testing' no Google Cloud Console.";
      } else if (errorMessage.includes('redirect_uri_mismatch')) {
        errorMessage = "Erro de configuração: URL de redirecionamento não autorizada no Google Cloud Console.";
      }
      
      toast({
        title: "Erro na conexão",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user || !session) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para desconectar o Google Calendar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'disconnect' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      onConnectionChange(false);
      toast({
        title: "Desconectado com sucesso",
        description: "Sua agenda do Google Calendar foi desconectada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    if (!user || !session) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para sincronizar o Google Calendar.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'sync' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Sincronização concluída",
        description: `${data.eventsCount || 0} eventos sincronizados.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Integração com Google Calendar
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Conecte sua agenda do Google Calendar para sincronizar automaticamente seus horários ocupados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            {isConnected 
              ? "Sua agenda está conectada e sincronizada." 
              : "Conecte sua agenda para evitar conflitos de agendamento."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Conectado' : 'Não conectado'}
                </span>
              </div>
              {isConnected && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncCalendar}
                    disabled={syncing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Sincronizando...' : 'Sincronizar'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnectCalendar}
                    disabled={loading}
                  >
                    Desconectar
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConnectCalendar}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {loading ? 'Conectando...' : 'Conectar Calendar'}
                </Button>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Como funciona:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Seus eventos ocupados são sincronizados automaticamente</li>
                  <li>• Pacientes só veem horários realmente disponíveis</li>
                  <li>• A sincronização ocorre a cada hora</li>
                  <li>• Apenas eventos privados/ocupados são considerados</li>
                </ul>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-900">Benefícios da integração:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Evita agendamentos em conflito</li>
                    <li>• Atualização automática da disponibilidade</li>
                    <li>• Reduz cancelamentos de última hora</li>
                    <li>• Melhora a experiência do paciente</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-orange-900">Configuração necessária:</h4>
                  <div className="text-sm text-orange-700 space-y-2">
                    <p>Se encontrar problemas de acesso bloqueado:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Acesse o Google Cloud Console</li>
                      <li>Vá em "OAuth consent screen"</li>
                      <li>Configure o status como "Testing"</li>
                      <li>Adicione seu email como usuário de teste</li>
                      <li>Salve as configurações e tente novamente</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};