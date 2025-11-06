import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { GlobalCacheButton } from '@/components/ui/global-cache-button';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  Trash2, 
  Calendar, 
  BarChart3,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface AdminFunction {
  id: string;
  name: string;
  description: string;
  icon: any;
  confirmMessage: string;
  payload: any;
}

const adminFunctions: AdminFunction[] = [
  {
    id: 'aggregate-blog-analytics',
    name: 'Agregar Analytics do Blog',
    description: 'Processa e agrega estatísticas de visualizações do blog',
    icon: BarChart3,
    confirmMessage: 'Isso irá processar todas as visualizações não agregadas. Continuar?',
    payload: { mode: 'incremental', include_today: false }
  },
  {
    id: 'google-calendar-cron',
    name: 'Sincronizar Google Calendar',
    description: 'Força sincronização de eventos do Google Calendar para todos os profissionais',
    icon: Calendar,
    confirmMessage: 'Isso irá sincronizar todos os calendários. Continuar?',
    payload: {}
  },
  {
    id: 'cleanup-orphan-profiles',
    name: 'Limpar Perfis Órfãos',
    description: 'Remove perfis sem usuários autenticados associados (padrão: +test%)',
    icon: Users,
    confirmMessage: 'ATENÇÃO: Isso irá deletar perfis órfãos permanentemente. Use com cuidado!',
    payload: { emailPattern: '%+test%' }
  }
];

const SystemMaintenance = () => {
  const { hasRole } = useAdminAuth();
  const { toast } = useToast();
  const [loadingFunctions, setLoadingFunctions] = useState<Record<string, boolean>>({});
  const [functionResults, setFunctionResults] = useState<Record<string, 'success' | 'error' | null>>({});

  const executeFunction = async (functionId: string, payload: any) => {
    try {
      setLoadingFunctions(prev => ({ ...prev, [functionId]: true }));
      setFunctionResults(prev => ({ ...prev, [functionId]: null }));
      
      const { data, error } = await supabase.functions.invoke(functionId, {
        body: payload
      });
      
      if (error) throw error;
      
      setFunctionResults(prev => ({ ...prev, [functionId]: 'success' }));
      toast({
        title: 'Função executada com sucesso!',
        description: data?.message || 'Operação concluída.',
      });
    } catch (error: any) {
      console.error(`Error executing ${functionId}:`, error);
      setFunctionResults(prev => ({ ...prev, [functionId]: 'error' }));
      toast({
        title: 'Erro ao executar função',
        description: error.message || 'Ocorreu um erro durante a execução.',
        variant: 'destructive'
      });
    } finally {
      setLoadingFunctions(prev => ({ ...prev, [functionId]: false }));
    }
  };

  if (!hasRole('super_admin')) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Esta página requer permissões de super administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Manutenção do Sistema</h1>
          <p className="text-muted-foreground">
            Ferramentas administrativas e operações de manutenção
          </p>
        </div>
      </div>

      {/* Cache Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle>Gerenciamento de Cache</CardTitle>
          </div>
          <CardDescription>
            Limpe o cache do sistema para forçar atualização de configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlobalCacheButton variant="text" size="default" />
          <p className="text-sm text-muted-foreground mt-4">
            💡 Use isso quando fizer alterações nas configurações do AI Assistant 
            ou outras configurações que não aparecem imediatamente.
          </p>
        </CardContent>
      </Card>

      {/* Administrative Edge Functions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Edge Functions Administrativas</CardTitle>
          </div>
          <CardDescription>
            Execute manualmente funções de manutenção do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminFunctions.map((func) => (
            <div key={func.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <func.icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{func.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {func.description}
                  </p>
                  
                  {functionResults[func.id] && (
                    <div className={`flex items-center gap-2 text-sm ${
                      functionResults[func.id] === 'success' 
                        ? 'text-green-600' 
                        : 'text-destructive'
                    }`}>
                      {functionResults[func.id] === 'success' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {functionResults[func.id] === 'success' 
                        ? 'Executado com sucesso' 
                        : 'Erro na execução'}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => {
                    if (window.confirm(func.confirmMessage)) {
                      executeFunction(func.id, func.payload);
                    }
                  }}
                  disabled={loadingFunctions[func.id]}
                  size="sm"
                >
                  {loadingFunctions[func.id] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Executar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Status e estatísticas gerais da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Versão da Plataforma</span>
            <span className="font-mono text-sm">2.0.0</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ambiente</span>
            <span className="font-mono text-sm">Production</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Supabase Project</span>
            <span className="font-mono text-sm">mbuljmpamdocnxppueww</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMaintenance;
