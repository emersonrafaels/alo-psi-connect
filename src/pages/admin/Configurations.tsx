import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAssistantConfig } from '@/components/admin/config/AIAssistantConfig';
import { N8NConfig } from '@/components/admin/config/N8NConfig';
import { SystemConfig } from '@/components/admin/config/SystemConfig';
import AudioTranscriptionConfig from '@/components/admin/config/AudioTranscriptionConfig';
import { AIDataSourcesConfig } from '@/components/admin/config/AIDataSourcesConfig';
import { FeaturedProfessionalsConfig } from '@/components/admin/config/FeaturedProfessionalsConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Settings, Bot, Webhook, Cog, Shield, Mic, Database, Star, GraduationCap } from 'lucide-react';
import { EducationalInstitutionsConfig } from '@/components/admin/config/EducationalInstitutionsConfig';

export default function Configurations() {
  const { hasRole, loading } = useAdminAuth();
  const isSuperAdmin = hasRole('super_admin');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Carregando permissões...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie todas as configurações parametrizáveis da plataforma
          </p>
        </div>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Assistente IA
          </TabsTrigger>
          <TabsTrigger value="data-sources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Dados do Assistente
          </TabsTrigger>
          <TabsTrigger value="transcription" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Transcrição de Áudio
          </TabsTrigger>
          <TabsTrigger value="n8n" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Integrações N8N
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Profissionais
          </TabsTrigger>
          <TabsTrigger value="registration" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Cadastro
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              Sistema Geral
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ai">
          <AIAssistantConfig />
        </TabsContent>

        <TabsContent value="data-sources">
          <AIDataSourcesConfig />
        </TabsContent>

        <TabsContent value="transcription">
          <AudioTranscriptionConfig />
        </TabsContent>

        <TabsContent value="n8n">
          <N8NConfig />
        </TabsContent>

        <TabsContent value="featured">
          <FeaturedProfessionalsConfig />
        </TabsContent>

        <TabsContent value="registration">
          <EducationalInstitutionsConfig />
        </TabsContent>

        <TabsContent value="system">
          {isSuperAdmin ? (
            <SystemConfig />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <CardTitle>Acesso Restrito</CardTitle>
                    <CardDescription>
                      Esta seção está disponível apenas para Super Administradores
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  As configurações gerais do sistema requerem privilégios de Super Administrador 
                  para garantir a segurança e integridade da plataforma.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}