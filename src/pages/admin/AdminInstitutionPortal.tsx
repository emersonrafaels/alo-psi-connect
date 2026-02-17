import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Building2, TrendingUp, BarChart3, Briefcase, UserCircle, Ticket, Heart, ClipboardList, StickyNote } from 'lucide-react';
import { useAdminInstitutionPortal } from '@/hooks/useAdminInstitutionPortal';
import { InstitutionAnalyticsDashboard } from '@/components/admin/InstitutionAnalyticsDashboard';
import { InstitutionCouponsTab } from '@/components/admin/InstitutionCouponsTab';
import { InstitutionWellbeingDashboard } from '@/components/institution/InstitutionWellbeingDashboard';
import { StudentTriageTab } from '@/components/institution/StudentTriageTab';
import { InstitutionNotesTab } from '@/components/admin/InstitutionNotesTab';

export default function AdminInstitutionPortal() {
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { institutions, linkedProfessionals, linkedStudents, isLoading } = useAdminInstitutionPortal(selectedInstitutionId);

  const selectedInstitution = institutions.find(i => i.id === selectedInstitutionId);
  const activeProfessionals = linkedProfessionals.filter((p: any) => p.profissionais.ativo);
  const activeStudents = linkedStudents.filter((s: any) => s.enrollment_status === 'enrolled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portal Institucional</h1>
        <p className="text-muted-foreground">Visualize os dados de qualquer instituição cadastrada</p>
      </div>

      {/* Institution Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <Select
              value={selectedInstitutionId || ''}
              onValueChange={(value) => {
                setSelectedInstitutionId(value);
                setActiveTab('overview');
              }}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Selecione uma instituição..." />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    <div className="flex items-center gap-2">
                      <span>{inst.name}</span>
                      {inst.has_partnership && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Parceira</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedInstitutionId && (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg">Selecione uma instituição para visualizar seus dados</p>
          </CardContent>
        </Card>
      )}

      {selectedInstitutionId && selectedInstitution && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs md:text-sm font-medium">Instituição</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-bold truncate">{selectedInstitution.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{selectedInstitution.type}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs md:text-sm font-medium">Profissionais</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{activeProfessionals.length}</div>
                <p className="text-xs text-muted-foreground mt-1">de {linkedProfessionals.length} vinculados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs md:text-sm font-medium">Alunos</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{activeStudents.length}</div>
                <p className="text-xs text-muted-foreground mt-1">de {linkedStudents.length} vinculados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs md:text-sm font-medium">Taxa de Atividade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">
                  {linkedProfessionals.length > 0
                    ? Math.round((activeProfessionals.length / linkedProfessionals.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Profissionais ativos</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-4xl grid-cols-6 h-auto">
              <TabsTrigger value="overview" className="text-xs md:text-sm py-2">Visão Geral</TabsTrigger>
              <TabsTrigger value="triage" className="text-xs md:text-sm py-2">
                <ClipboardList className="h-3 w-3 mr-1" /> Triagem
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs md:text-sm py-2">
                <StickyNote className="h-3 w-3 mr-1" /> Notas
              </TabsTrigger>
              <TabsTrigger value="coupons" className="text-xs md:text-sm py-2">
                <Ticket className="h-3 w-3 mr-1" /> Cupons
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs md:text-sm py-2">
                <BarChart3 className="h-3 w-3 mr-1" /> Métricas
              </TabsTrigger>
              <TabsTrigger value="wellbeing" className="text-xs md:text-sm py-2">
                <Heart className="h-3 w-3 mr-1" /> Bem-Estar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Profissionais</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeProfessionals.length} ativos de {linkedProfessionals.length} total
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {linkedProfessionals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum profissional vinculado.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {linkedProfessionals.slice(0, 10).map((p: any) => (
                          <div key={p.professional_id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                            <span className="font-medium truncate">{p.profissionais.display_name}</span>
                            <Badge variant={p.profissionais.ativo ? 'default' : 'secondary'} className="text-[10px]">
                              {p.profissionais.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        ))}
                        {linkedProfessionals.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            ... e mais {linkedProfessionals.length - 10} profissionais
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Alunos</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeStudents.length} matriculados de {linkedStudents.length} total
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {linkedStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum aluno vinculado.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {linkedStudents.slice(0, 10).map((s: any) => (
                          <div key={s.patient_id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                            <span className="font-medium truncate">{s.pacientes.profiles.nome}</span>
                            <Badge variant={s.enrollment_status === 'enrolled' ? 'default' : 'secondary'} className="text-[10px]">
                              {s.enrollment_status === 'enrolled' ? 'Matriculado' : s.enrollment_status}
                            </Badge>
                          </div>
                        ))}
                        {linkedStudents.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            ... e mais {linkedStudents.length - 10} alunos
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="triage">
              <StudentTriageTab institutionId={selectedInstitutionId} />
            </TabsContent>

            <TabsContent value="notes">
              <InstitutionNotesTab institutionId={selectedInstitutionId} />
            </TabsContent>

            <TabsContent value="coupons">
              <InstitutionCouponsTab
                institutionId={selectedInstitutionId}
                institutionName={selectedInstitution.name}
                canManageCoupons={selectedInstitution.can_manage_coupons}
              />
            </TabsContent>

            <TabsContent value="metrics">
              <InstitutionAnalyticsDashboard institutionId={selectedInstitutionId} />
            </TabsContent>

            <TabsContent value="wellbeing">
              <InstitutionWellbeingDashboard institutionId={selectedInstitutionId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
