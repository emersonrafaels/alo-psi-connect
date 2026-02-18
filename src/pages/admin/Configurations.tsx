import { useState } from 'react';
import { AIAssistantConfig } from '@/components/admin/config/AIAssistantConfig';
import { N8NConfig } from '@/components/admin/config/N8NConfig';
import { SystemConfig } from '@/components/admin/config/SystemConfig';
import AudioTranscriptionConfig from '@/components/admin/config/AudioTranscriptionConfig';
import { AIDataSourcesConfig } from '@/components/admin/config/AIDataSourcesConfig';
import { FeaturedProfessionalsConfig } from '@/components/admin/config/FeaturedProfessionalsConfig';
import { CrossTenantNavigationConfig } from '@/components/admin/config/CrossTenantNavigationConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Settings, Bot, Webhook, Cog, Shield, Mic, Database, Star, GraduationCap, Link2, ArrowLeft, LucideIcon, Mail, Video } from 'lucide-react';
import { GoogleCalendarTenantConfig } from '@/components/admin/config/GoogleCalendarTenantConfig';
import { EducationalInstitutionsConfig } from '@/components/admin/config/EducationalInstitutionsConfig';
import { AnonymizationConfig } from '@/components/admin/config/AnonymizationConfig';
import { NewsletterSubscribersConfig } from '@/components/admin/config/NewsletterSubscribersConfig';
import { EmailBccConfig } from '@/components/admin/config/EmailBccConfig';
import { cn } from '@/lib/utils';
import { AdminTenantProvider } from '@/contexts/AdminTenantContext';
import { AdminTenantSelector } from '@/components/admin/AdminTenantSelector';

interface ConfigCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component: React.ComponentType;
  category: 'ai' | 'system' | 'users';
  requiresSuperAdmin?: boolean;
}

export default function Configurations() {
  const { hasRole, loading } = useAdminAuth();
  const isSuperAdmin = hasRole('super_admin');
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

  const configCards: ConfigCard[] = [
    // Inteligência Artificial
    {
      id: 'ai-assistant',
      title: 'Assistente IA',
      description: 'Configure o comportamento e respostas do assistente',
      icon: Bot,
      component: AIAssistantConfig,
      category: 'ai'
    },
    {
      id: 'ai-data-sources',
      title: 'Dados do Assistente',
      description: 'Gerencie fontes de dados para o assistente',
      icon: Database,
      component: AIDataSourcesConfig,
      category: 'ai'
    },
    {
      id: 'transcription',
      title: 'Transcrição de Áudio',
      description: 'Configure a transcrição de áudio para texto',
      icon: Mic,
      component: AudioTranscriptionConfig,
      category: 'ai'
    },
    // Sistema e Integrações
    {
      id: 'google-calendar-tenant',
      title: 'Google Calendar - Tenant',
      description: 'Configure o Google Calendar centralizado do tenant',
      icon: Video,
      component: GoogleCalendarTenantConfig,
      category: 'system',
      requiresSuperAdmin: true
    },
    {
      id: 'n8n',
      title: 'Integrações N8N',
      description: 'Configure webhooks e automações',
      icon: Webhook,
      component: N8NConfig,
      category: 'system'
    },
    {
      id: 'navigation',
      title: 'Navegação Cross-Tenant',
      description: 'Configure avisos de navegação entre tenants',
      icon: Link2,
      component: CrossTenantNavigationConfig,
      category: 'system'
    },
    {
      id: 'newsletter-subscribers',
      title: 'Inscritos da Newsletter',
      description: 'Visualize e gerencie os inscritos da newsletter',
      icon: Mail,
      component: NewsletterSubscribersConfig,
      category: 'system'
    },
    {
      id: 'email-bcc',
      title: 'Emails BCC',
      description: 'Gerencie emails copiados em oculto nos envios',
      icon: Mail,
      component: EmailBccConfig,
      category: 'system'
    },
    {
      id: 'system-general',
      title: 'Sistema Geral',
      description: 'Configurações avançadas do sistema',
      icon: Cog,
      component: SystemConfig,
      category: 'system',
      requiresSuperAdmin: true
    },
    // Cadastro e Usuários
    {
      id: 'featured',
      title: 'Profissionais em Destaque',
      description: 'Gerencie profissionais destacados na plataforma',
      icon: Star,
      component: FeaturedProfessionalsConfig,
      category: 'users'
    },
    {
      id: 'registration',
      title: 'Instituições de Ensino',
      description: 'Configure instituições disponíveis no cadastro',
      icon: GraduationCap,
      component: EducationalInstitutionsConfig,
      category: 'users'
    },
    {
      id: 'anonymization',
      title: 'Anonimização de Alunos',
      description: 'Configure a anonimização de nomes no portal institucional',
      icon: Shield,
      component: AnonymizationConfig,
      category: 'users'
    }
  ];

  const aiConfigs = configCards.filter(c => c.category === 'ai');
  const systemConfigs = configCards
    .filter(c => c.category === 'system')
    .filter(c => !c.requiresSuperAdmin || isSuperAdmin);
  const userConfigs = configCards.filter(c => c.category === 'users');

  const selectedConfigData = configCards.find(c => c.id === selectedConfig);

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

  const renderConfigCard = (config: ConfigCard) => (
    <Card
      key={config.id}
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
        selectedConfig === config.id && "ring-2 ring-primary"
      )}
      onClick={() => setSelectedConfig(config.id)}
    >
      <CardHeader className="text-center space-y-3">
        <config.icon className="h-12 w-12 mx-auto text-primary" />
        <div>
          <CardTitle className="text-lg">{config.title}</CardTitle>
          <CardDescription className="text-sm mt-2">
            {config.description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <AdminTenantProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <div>
              <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
              <p className="text-muted-foreground">
                Gerencie todas as configurações parametrizáveis da plataforma
              </p>
            </div>
          </div>
          <AdminTenantSelector />
        </div>

      {!selectedConfig ? (
        <div className="space-y-8">
          {/* Categoria: Inteligência Artificial */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Inteligência Artificial</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiConfigs.map(renderConfigCard)}
            </div>
          </div>

          {/* Categoria: Sistema e Integrações */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Cog className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Sistema e Integrações</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemConfigs.map(renderConfigCard)}
            </div>
          </div>

          {/* Categoria: Cadastro e Usuários */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Cadastro e Usuários</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userConfigs.map(renderConfigCard)}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConfig(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Configurações
          </Button>

          {selectedConfigData && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <selectedConfigData.icon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>{selectedConfigData.title}</CardTitle>
                    <CardDescription>{selectedConfigData.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <selectedConfigData.component />
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </div>
    </AdminTenantProvider>
  );
}