import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAssistantConfig } from '@/components/admin/config/AIAssistantConfig';
import { N8NConfig } from '@/components/admin/config/N8NConfig';
import { SystemConfig } from '@/components/admin/config/SystemConfig';
import { Settings, Bot, Webhook, Cog } from 'lucide-react';

export default function Configurations() {
  return (
    <AdminLayout>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Assistente IA
            </TabsTrigger>
            <TabsTrigger value="n8n" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Integrações N8N
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              Sistema Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <AIAssistantConfig />
          </TabsContent>

          <TabsContent value="n8n">
            <N8NConfig />
          </TabsContent>

          <TabsContent value="system">
            <SystemConfig />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}