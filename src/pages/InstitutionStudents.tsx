import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Mail, Calendar, GraduationCap, ArrowLeft, Download } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InstitutionStudents() {
  const { linkedStudents, isLoading } = useInstitutionAccess();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'graduated' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'enrollment_date'>('name');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  let filtered = linkedStudents.filter(s => {
    const matchesSearch = s.pacientes.profiles.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || s.pacientes.profiles.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.enrollment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name': return (a.pacientes.profiles.nome || '').localeCompare(b.pacientes.profiles.nome || '');
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
      'Nome': s.pacientes.profiles.nome || '', 'Email': s.pacientes.profiles.email || '',
      'Data de Nascimento': s.pacientes.profiles.data_nascimento ? format(new Date(s.pacientes.profiles.data_nascimento), 'dd/MM/yyyy') : '',
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
      <div className="container mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/portal-institucional">Portal Institucional</BreadcrumbLink></BreadcrumbItem>
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
            <Link to="/portal-institucional"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Portal</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
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
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="enrollment_date">Data de Vínculo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.patient_id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10">{student.pacientes.profiles.nome?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{student.pacientes.profiles.nome}</CardTitle>
                    {student.pacientes.eh_estudante && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <GraduationCap className="h-3 w-3" /><span>Estudante</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{student.pacientes.profiles.email}</span>
                </div>
                {student.enrollment_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Vinculado: {format(new Date(student.enrollment_date), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                <Badge variant={getStatusBadge(student.enrollment_status).variant}>{getStatusBadge(student.enrollment_status).label}</Badge>
              </CardContent>
            </Card>
          ))}
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
      </div>
      <Footer />
    </div>
  );
}
