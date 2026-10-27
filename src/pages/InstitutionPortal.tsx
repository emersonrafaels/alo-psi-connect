import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/ui/logo-loader';
import { DemoDataBadge } from '@/components/institutional/DemoDataBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PortalSidebar, PortalMobileNav, buildPortalNav } from '@/features/institution/portal/PortalSidebar';
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
  Compass,
  ClipboardList,
  StickyNote,
  HeartHandshake
} from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useTenant } from '@/hooks/useTenant';
import { useInstitutionKeyboardShortcuts } from '@/hooks/useInstitutionKeyboardShortcuts';
import { useInstitutionTour } from '@/hooks/useInstitutionTour';
import { Link, useSearchParams } from 'react-router-dom';
import { buildTenantPath } from '@/utils/tenantHelpers';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { InstitutionAnalyticsDashboard } from '@/components/admin/InstitutionAnalyticsDashboard';
import { InstitutionCouponsTab } from '@/components/admin/InstitutionCouponsTab';
import { InstitutionNotesTab } from '@/components/admin/InstitutionNotesTab';
import { OverviewDashboard } from '@/features/institution/portal/OverviewDashboard';
import { WelcomeCard } from '@/components/institution/WelcomeCard';
import { InstitutionTour } from '@/components/institution/InstitutionTour';
import { KeyboardShortcutsPopover } from '@/components/institution/KeyboardShortcutsPopover';
import { InstitutionWellbeingDashboard } from '@/components/institution/InstitutionWellbeingDashboard';
import { StudentTriageTab } from '@/components/institution/StudentTriageTab';
import { InstitutionExecutiveHeader } from '@/components/institution/InstitutionExecutiveHeader';
import { BuddyInstitutionPanel } from '@/components/institution/BuddyInstitutionPanel';
import { StudentBuddyPanel } from '@/components/institution/StudentBuddyPanel';
import { useAllowedBuddyStudents } from '@/hooks/useInstitutionBuddyAccess';
import { Brain } from 'lucide-react';

export default function InstitutionPortal() {
  const { userInstitutions, linkedProfessionals, linkedStudents, isLoading } = useInstitutionAccess();
  const { tenant } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'overview') next.delete('tab'); else next.set('tab', tab);
      return next;
    });
  };
  const changeTab = (tab: string) => {
    setActiveTab(tab);
  };
  const { canView: canViewStudentBuddy } = useAllowedBuddyStudents(
    userInstitutions[0]?.institution_id ?? null
  );
  const { 
    showTour, 
    currentStep, 
    totalSteps, 
    currentStepData, 
    nextStep, 
    prevStep, 
    skipTour, 
    resetTour 
  } = useInstitutionTour();

  // Atalhos de teclado
  useInstitutionKeyboardShortcuts({ setActiveTab });

  // Navegação entre abas via CustomEvent (usado pelo Buddy Institucional, KPIs etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: string } | undefined;
      const map: Record<string, string> = {
        triagem: 'triage',
        notas: 'notes',
        diario: 'overview',
        metricas: 'metrics',
      };
      const target = detail?.tab ? (map[detail.tab] || detail.tab) : null;
      if (target) {
        setActiveTab(target);
        setTimeout(() => {
          document.getElementById('institution-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    };
    window.addEventListener('institution:navigate-tab', handler);
    return () => window.removeEventListener('institution:navigate-tab', handler);
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <LogoLoader label="Carregando portal institucional..." />
      </div>
    );
  }

  const navItems = buildPortalNav((p) => buildTenantPath(tenant?.slug, p), canViewStudentBuddy);
  const currentSection = activeTab === 'triage'
    ? { label: 'Triagem', description: 'Fila de triagem dos alunos.', icon: ClipboardList }
    : navItems.find((i) => i.id === activeTab && !i.href);
  const activeProfessionals = linkedProfessionals.filter(p => p.profissionais.ativo);
  const activeStudents = linkedStudents.filter(s => s.enrollment_status === 'enrolled');
  const currentInstitution = userInstitutions[0]?.educational_institutions;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <InstitutionTour 
        showTour={showTour}
        currentStep={currentStep}
        totalSteps={totalSteps}
        currentStepData={currentStepData}
        nextStep={nextStep}
        prevStep={prevStep}
        skipTour={skipTour}
      />
      
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

        {/* Barra de identidade compacta */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-14 w-14 shrink-0 rounded-xl border bg-background flex items-center justify-center p-1.5 overflow-hidden">
              {currentInstitution?.logo_url ? (
                <img src={currentInstitution.logo_url} alt={currentInstitution.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <Building2 className="h-7 w-7 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Portal Institucional</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold truncate">{currentInstitution?.name ?? 'Sua instituição'}</h1>
                <DemoDataBadge institutionId={userInstitutions[0]?.institution_id} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsPopover />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetTour} title="Reiniciar tour guiado">
              <Compass className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          <PortalSidebar items={navItems} active={activeTab} onSelect={changeTab} />
          <div className="flex-1 min-w-0" id="institution-tabs">
            <PortalMobileNav items={navItems} active={activeTab} onSelect={changeTab} />
            {currentSection && (
              <div className="mb-6 flex items-start gap-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-5">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                  <currentSection.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{currentSection.label}</h2>
                  {currentSection.description && (
                    <p className="text-muted-foreground mt-0.5">{currentSection.description}</p>
                  )}
                </div>
              </div>
            )}
        <Tabs value={activeTab} onValueChange={changeTab} className="space-y-6 scroll-mt-24">
          <TabsContent value="overview" className="space-y-6 mt-0">
            <OverviewDashboard
              institutionName={userInstitutions[0]?.institution?.name ?? currentInstitution?.name}
              totalStudents={linkedStudents.length}
              activeStudents={activeStudents.length}
              totalProfessionals={linkedProfessionals.length}
              activeProfessionals={activeProfessionals.length}
              buildPath={(path) => buildTenantPath(tenant?.slug, path)}
            />
            {userInstitutions[0]?.institution_id && (
              <InstitutionExecutiveHeader
                institutionId={userInstitutions[0].institution_id}
                onNavigateToTriage={() => setActiveTab('triage')}
              />
            )}
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

          {/* Tab de Diário Emocional */}
          <TabsContent value="wellbeing">
            {userInstitutions[0]?.institution_id ? (
              <InstitutionWellbeingDashboard 
                institutionId={userInstitutions[0].institution_id}
                onNavigateToTriage={() => setActiveTab('triage')}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma instituição vinculada para exibir dados do diário emocional.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Triagem */}
          <TabsContent value="triage">
            {userInstitutions[0]?.institution_id ? (
              <StudentTriageTab 
                institutionId={userInstitutions[0].institution_id} 
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma instituição vinculada para exibir triagem.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Notas */}
          <TabsContent value="notes">
            {userInstitutions[0]?.institution_id ? (
              <InstitutionNotesTab 
                institutionId={userInstitutions[0].institution_id} 
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma instituição vinculada para exibir notas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab do Buddy Institucional */}
          <TabsContent value="buddy">
            {userInstitutions[0]?.institution_id ? (
              <BuddyInstitutionPanel institutionId={userInstitutions[0].institution_id} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma instituição vinculada para exibir insights do Buddy.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab do Buddy dos Alunos (acesso liberado via admin) */}
          {canViewStudentBuddy && userInstitutions[0]?.institution_id && (
            <TabsContent value="student-buddy">
              <StudentBuddyPanel institutionId={userInstitutions[0].institution_id} />
            </TabsContent>
          )}
        </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
