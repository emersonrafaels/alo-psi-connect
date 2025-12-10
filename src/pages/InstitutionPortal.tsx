import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  TrendingUp, 
  BarChart3, 
  Briefcase, 
  UserCircle, 
  Ticket, 
  Heart,
  RotateCcw 
} from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useTenant } from '@/hooks/useTenant';
import { useInstitutionKeyboardShortcuts } from '@/hooks/useInstitutionKeyboardShortcuts';
import { useInstitutionTour } from '@/hooks/useInstitutionTour';
import { Link } from 'react-router-dom';
import { buildTenantPath } from '@/utils/tenantHelpers';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { InstitutionAnalyticsDashboard } from '@/components/admin/InstitutionAnalyticsDashboard';
import { InstitutionCouponsTab } from '@/components/admin/InstitutionCouponsTab';
import { WelcomeCard } from '@/components/institution/WelcomeCard';
import { InstitutionTour } from '@/components/institution/InstitutionTour';
import { KeyboardShortcutsPopover } from '@/components/institution/KeyboardShortcutsPopover';
import { InstitutionWellbeingDashboard } from '@/components/institution/InstitutionWellbeingDashboard';

export default function InstitutionPortal() {
  const { userInstitutions, linkedProfessionals, linkedStudents, isLoading } = useInstitutionAccess();
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState('overview');
  const { resetTour } = useInstitutionTour();

  // Atalhos de teclado
  useInstitutionKeyboardShortcuts({ setActiveTab });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeProfessionals = linkedProfessionals.filter(p => p.profissionais.ativo);
  const activeStudents = linkedStudents.filter(s => s.enrollment_status === 'enrolled');
  const currentInstitution = userInstitutions[0]?.educational_institutions;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <InstitutionTour />
      
      <div className="container mx-auto py-6 md:py-8 px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={buildTenantPath(tenant?.slug, '/')}>Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Portal Institucional</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Card de Boas-vindas */}
        <div className="mb-6">
          <WelcomeCard institutionName={currentInstitution?.name} />
        </div>

        {/* Header com Logo e Nome */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {/* Logo da Instituição */}
            {currentInstitution?.logo_url ? (
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarImage src={currentInstitution.logo_url} alt={currentInstitution.name} />
                <AvatarFallback>
                  <Building2 className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold">Portal Institucional</h1>
                <div className="flex items-center gap-2">
                  <KeyboardShortcutsPopover />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={resetTour}
                    title="Reiniciar tour guiado"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {currentInstitution?.name && (
                <Badge 
                  variant="outline" 
                  className="mt-2 text-base px-3 py-1 border-primary/50 text-primary dark:text-primary-foreground dark:border-primary/40 dark:bg-primary/20"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {currentInstitution.name}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Gerencie profissionais, alunos e métricas da sua instituição
          </p>
        </div>

        {/* Cards de Resumo - Responsivo 2x2 no mobile */}
        <div 
          data-tour="summary-cards"
          className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-4 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium">Instituições</CardTitle>
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl md:text-3xl font-bold">{userInstitutions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Você tem acesso
              </p>
            </CardContent>
          </Card>

          <Link 
            to={buildTenantPath(tenant?.slug, '/portal-institucional/profissionais')} 
            className="block transition-transform hover:scale-105"
          >
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs md:text-sm font-medium">Profissionais</CardTitle>
                <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold">{activeProfessionals.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de {linkedProfessionals.length} vinculados
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link 
            to={buildTenantPath(tenant?.slug, '/portal-institucional/alunos')} 
            className="block transition-transform hover:scale-105"
          >
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs md:text-sm font-medium">Alunos</CardTitle>
                <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold">{activeStudents.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de {linkedStudents.length} vinculados
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium">Taxa de Atividade</CardTitle>
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl md:text-3xl font-bold">
                {linkedProfessionals.length > 0 
                  ? Math.round((activeProfessionals.length / linkedProfessionals.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Profissionais ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Visão Geral, Cupons, Métricas e Bem-Estar */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-6"
          data-tour="tabs"
        >
          <TabsList className="grid w-full max-w-4xl grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs md:text-sm py-2">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="coupons" className="text-xs md:text-sm py-2">
              <Ticket className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Cupons
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs md:text-sm py-2">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Métricas
            </TabsTrigger>
            <TabsTrigger 
              value="wellbeing" 
              className="text-xs md:text-sm py-2"
              data-tour="wellbeing-tab"
            >
              <Heart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Bem-Estar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Ações Rápidas */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <Card className="border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg md:text-xl">Gerenciar Profissionais</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeProfessionals.length} ativos de {linkedProfessionals.length} total
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    Visualize, busque e acompanhe todos os profissionais vinculados à sua instituição
                  </p>
                  <Button asChild className="w-full" size="lg">
                    <Link to={buildTenantPath(tenant?.slug, '/portal-institucional/profissionais')}>
                      Ver Profissionais
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-blue-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg md:text-xl">Gerenciar Alunos</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeStudents.length} vinculados de {linkedStudents.length} total
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    Visualize, busque e acompanhe todos os alunos vinculados à sua instituição
                  </p>
                  <Button asChild className="w-full" size="lg">
                    <Link to={buildTenantPath(tenant?.slug, '/portal-institucional/alunos')}>
                      Ver Alunos
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Cupons */}
          <TabsContent value="coupons">
            {userInstitutions[0]?.institution_id ? (
              <InstitutionCouponsTab 
                institutionId={userInstitutions[0].institution_id}
                institutionName={currentInstitution?.name || ''}
                tenantId={tenant?.id}
                canManageCoupons={currentInstitution?.can_manage_coupons}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma instituição vinculada para exibir cupons.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Métricas Avançadas */}
          <TabsContent value="metrics">
            {userInstitutions[0]?.institution_id ? (
              <InstitutionAnalyticsDashboard 
                institutionId={userInstitutions[0].institution_id} 
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma instituição vinculada para exibir métricas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Bem-Estar */}
          <TabsContent value="wellbeing">
            {userInstitutions[0]?.institution_id ? (
              <InstitutionWellbeingDashboard 
                institutionId={userInstitutions[0].institution_id} 
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma instituição vinculada para exibir dados de bem-estar.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
