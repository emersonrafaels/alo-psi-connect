import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap, Building2, TrendingUp, BarChart3, Briefcase, UserCircle, Ticket } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useTenant } from '@/hooks/useTenant';
import { Link } from 'react-router-dom';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { InstitutionAnalyticsDashboard } from '@/components/admin/InstitutionAnalyticsDashboard';
import { InstitutionCouponsTab } from '@/components/admin/InstitutionCouponsTab';

export default function InstitutionPortal() {
  const { userInstitutions, linkedProfessionals, linkedStudents, isLoading } = useInstitutionAccess();
  const { tenant } = useTenant();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeProfessionals = linkedProfessionals.filter(p => p.profissionais.ativo);
  const activeStudents = linkedStudents.filter(s => s.enrollment_status === 'enrolled');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">Portal Institucional</h1>
            {userInstitutions[0]?.educational_institutions?.name && (
              <Badge variant="outline" className="text-lg px-4 py-2 border-purple-500 text-purple-700 dark:text-purple-300">
                <Building2 className="h-4 w-4 mr-2" />
                {userInstitutions[0].educational_institutions.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">
            Gerencie profissionais, alunos e métricas da sua instituição
          </p>
        </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Instituições</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userInstitutions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Você tem acesso
            </p>
          </CardContent>
        </Card>

        <Link to="/portal-institucional/profissionais" className="block transition-transform hover:scale-105">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeProfessionals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de {linkedProfessionals.length} vinculados
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/portal-institucional/alunos" className="block transition-transform hover:scale-105">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alunos</CardTitle>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeStudents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de {linkedStudents.length} vinculados
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Atividade</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
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

      {/* Tabs: Visão Geral, Cupons e Métricas */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="coupons">
            <Ticket className="h-4 w-4 mr-2" />
            Cupons
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Métricas Avançadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Ações Rápidas */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 hover:border-purple-500/50 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Gerenciar Profissionais</CardTitle>
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
                  <Link to="/portal-institucional/profissionais">
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
                    <CardTitle>Gerenciar Alunos</CardTitle>
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
                  <Link to="/portal-institucional/alunos">
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
              institutionName={userInstitutions[0].educational_institutions.name}
              tenantId={tenant?.id}
              canManageCoupons={userInstitutions[0].educational_institutions.can_manage_coupons}
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
      </Tabs>
    </div>
    
    <Footer />
  </div>
  );
}
