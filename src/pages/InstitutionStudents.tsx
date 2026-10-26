import { PortalPageShell } from '@/features/institution/portal/PortalPageShell';
import { useMemo, useState } from 'react';
import { LoadingBar, LoadingSection } from "@/components/ui/loading-bar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Calendar, GraduationCap, ArrowLeft, Download, TrendingUp } from 'lucide-react';
import { StudentTimelineModal } from '@/components/institution/StudentTimelineModal';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AcademicStructureManager } from '@/components/institutional/AcademicStructureManager';
import { PlacementSelect } from '@/components/institutional/PlacementSelect';
import { useAcademicStructure } from '@/hooks/useAcademicStructure';
import { AcademicLevel, LEVEL_LABELS, buildPath } from '@/features/academic/hierarchy';
import { anonymizeInitials, anonymizeStudentName, buildAnonymizedStudentIndex } from '@/hooks/useAnonymizationConfig';

export default function InstitutionStudents() {
  const { linkedStudents, userInstitutions, isLoading } = useInstitutionAccess();
  const institutionId = userInstitutions[0]?.institution_id as string | undefined;
  const academic = useAcademicStructure(institutionId);
  const [placementFilter, setPlacementFilter] = useState<Partial<Record<AcademicLevel, string>>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignTarget, setAssignTarget] = useState<string[] | null>(null);
  const [assignSel, setAssignSel] = useState<Partial<Record<AcademicLevel, string>>>({});
  const pathOf = (patientId: string) => {
    const cls = academic.placements.get(patientId);
    return cls ? buildPath(cls, academic.units, academic.levels) : [];
  };
  const toggle = (id: string) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const { tenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'graduated' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'enrollment_date'>('name');
  const [selectedStudent, setSelectedStudent] = useState<{ patientId: string; name: string } | null>(null);

  const studentIndexMap = useMemo(
    () => buildAnonymizedStudentIndex(linkedStudents.map((student) => student.patient_id)),
    [linkedStudents]
  );
  const getStudentIndex = (patientId: string) => studentIndexMap.get(patientId) ?? 0;
  const getStudentName = (patientId: string) => anonymizeStudentName(getStudentIndex(patientId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <LoadingBar className="max-w-sm" label="Carregando alunos..." />
      </div>
    );
  }

  let filtered = linkedStudents.filter(s => {
    const matchesSearch = getStudentName(s.patient_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.enrollment_status === statusFilter;
    const path = pathOf(s.patient_id);
    const matchesPlacement = Object.values(placementFilter).every((id) => !id || path.some((u) => u.id === id));
    return matchesSearch && matchesStatus && matchesPlacement;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name': return getStudentIndex(a.patient_id) - getStudentIndex(b.patient_id);
      case 'enrollment_date': return new Date(b.enrollment_date || 0).getTime() - new Date(a.enrollment_date || 0).getTime();
      default: return 0;
    }
  });

  const filteredStudents = sorted;

  const getStatusBadge = (status: string) => {
    const badges = { enrolled: { label: 'Vinculado', variant: 'default' as const }, graduated: { label: 'Formado', variant: 'secondary' as const }, inactive: { label: 'Inativo', variant: 'outline' as const } };
    return badges[status as keyof typeof badges] || badges.enrolled;
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const csvData = filteredStudents.map(s => ({
      'Aluno': getStudentName(s.patient_id),
      ...Object.fromEntries(academic.levels.map((l) => [LEVEL_LABELS[l], pathOf(s.patient_id).find((u) => u.level === l)?.name ?? ''])),
      'Status': getStatusBadge(s.enrollment_status).label, 'Data de Vínculo': s.enrollment_date ? format(new Date(s.enrollment_date), 'dd/MM/yyyy') : ''
    }));
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alunos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PortalPageShell>
      <div className="container mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={buildTenantPath(tenant?.slug, '/portal-institucional')}>Portal Institucional</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Alunos</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Alunos da Instituição</h1>
            <p className="text-muted-foreground mt-2">{linkedStudents.length} alunos vinculados</p>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link to={buildTenantPath(tenant?.slug, '/portal-institucional')}><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Portal</Link>
          </Button>
        </div>

        <Tabs defaultValue="students">
        <TabsList className="mb-6">
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="structure">Estrutura acadêmica</TabsTrigger>
        </TabsList>
        <TabsContent value="structure"><AcademicStructureManager institutionId={institutionId} totalStudents={linkedStudents.length} /></TabsContent>
        <TabsContent value="students">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por Aluno #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="enrolled">Vinculados</SelectItem>
                    <SelectItem value="graduated">Formados</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordenar por</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Identificador do aluno</SelectItem>
                    <SelectItem value="enrollment_date">Data de Vínculo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium mb-2">Filtrar por estrutura acadêmica</p>
              <PlacementSelect levels={academic.levels} units={academic.units} onChange={setPlacementFilter} />
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(selectedIds.size === filteredStudents.length ? new Set() : new Set(filteredStudents.map((s) => s.patient_id)))}>
            {selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? 'Limpar seleção' : 'Selecionar todos'}
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" onClick={() => setAssignTarget([...selectedIds])}>Vincular {selectedIds.size} selecionado(s)</Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => {
            const studentIndex = getStudentIndex(student.patient_id);
            const studentName = anonymizeStudentName(studentIndex);
            return (
            <Card key={student.patient_id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Checkbox checked={selectedIds.has(student.patient_id)} onCheckedChange={() => toggle(student.patient_id)} aria-label={`Selecionar ${studentName}`} />
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10">{anonymizeInitials(studentIndex)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{studentName}</CardTitle>
                    {student.pacientes.eh_estudante && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <GraduationCap className="h-3 w-3" /><span>Estudante</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.enrollment_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Vinculado: {format(new Date(student.enrollment_date), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {pathOf(student.patient_id).map((u) => u.name).join(' › ') || 'Sem turma vinculada'}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setAssignTarget([student.patient_id])}>Vincular</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setSelectedStudent({ patientId: student.patient_id, name: studentName })
                    }
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Ver Histórico
                  </Button>
                </div>
                <Badge variant={getStatusBadge(student.enrollment_status).variant}>{getStatusBadge(student.enrollment_status).label}</Badge>
              </CardContent>
            </Card>
          );})}
          {filteredStudents.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <GraduationCap className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {linkedStudents.length === 0 ? 'Ainda não há alunos vinculados à sua instituição.' : 'Nenhum aluno corresponde aos filtros selecionados.'}
                    </p>
                  </div>
                  {linkedStudents.length > 0 && (
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSortBy('name'); }}>Limpar Todos os Filtros</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </TabsContent>
        </Tabs>
      </div>
      </PortalPageShell>
      <Footer />

      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vincular {assignTarget?.length === 1 ? getStudentName(assignTarget[0]) : `${assignTarget?.length} alunos`}</DialogTitle>
          </DialogHeader>
          {academic.units.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre a estrutura na aba "Estrutura acadêmica" primeiro.</p>
          ) : (
            <PlacementSelect
              levels={academic.levels}
              units={academic.units}
              initialClassId={assignTarget?.length === 1 ? academic.placements.get(assignTarget[0]) : null}
              onChange={setAssignSel}
            />
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { academic.assign.mutate({ patientIds: assignTarget!, classId: null }); setAssignTarget(null); }}>Remover vínculo</Button>
            <Button disabled={!assignSel.class} onClick={() => { academic.assign.mutate({ patientIds: assignTarget!, classId: assignSel.class! }); setAssignTarget(null); setSelectedIds(new Set()); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedStudent && (
        <StudentTimelineModal
          open={!!selectedStudent}
          onOpenChange={(open) => !open && setSelectedStudent(null)}
          institutionId={institutionId}
          patientId={selectedStudent.patientId}
          studentName={selectedStudent.name}
        />
      )}
    </div>
  );
}
