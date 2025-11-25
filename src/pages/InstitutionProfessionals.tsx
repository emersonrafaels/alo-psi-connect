import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Mail, Briefcase, Calendar, ArrowLeft, Eye, Download, TrendingUp } from 'lucide-react';
import { UserStorytellingModal } from '@/components/admin/UserStorytellingModal';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const relationshipTypeLabels: Record<string, string> = {
  employee: 'Funcionário',
  consultant: 'Consultor',
  supervisor: 'Supervisor',
  intern: 'Estagiário',
  partner: 'Parceiro'
};

export default function InstitutionProfessionals() {
  const { linkedProfessionals, isLoading } = useInstitutionAccess();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [professionFilter, setProfessionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'profession'>('name');
  const [selectedProfessional, setSelectedProfessional] = useState<{ userId: string; name: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  let filtered = linkedProfessionals.filter(p => {
    const matchesSearch = p.profissionais.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.profissionais.profissao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && p.profissionais.ativo) || (statusFilter === 'inactive' && !p.profissionais.ativo);
    const matchesProfession = professionFilter === 'all' || p.profissionais.profissao === professionFilter;
    return matchesSearch && matchesStatus && matchesProfession;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name': return (a.profissionais.display_name || '').localeCompare(b.profissionais.display_name || '');
      case 'date': return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
      case 'profession': return (a.profissionais.profissao || '').localeCompare(b.profissionais.profissao || '');
      default: return 0;
    }
  });

  const filteredProfessionals = sorted;

  const handleExportCSV = () => {
    if (filteredProfessionals.length === 0) return;
    const csvData = filteredProfessionals.map(p => ({
      'Nome': p.profissionais.display_name || '', 'Profissão': p.profissionais.profissao || '', 'Email': p.profissionais.user_email || '',
      'Tipo de Vínculo': p.relationship_type || '', 'Data de Início': p.start_date ? format(new Date(p.start_date), 'dd/MM/yyyy') : '',
      'Status': p.profissionais.ativo ? 'Ativo' : 'Inativo'
    }));
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profissionais_${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
            <BreadcrumbItem><BreadcrumbPage>Profissionais</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Profissionais da Instituição</h1>
            <p className="text-muted-foreground mt-2">{linkedProfessionals.length} profissionais vinculados</p>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link to="/portal-institucional"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Portal</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou profissão..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Profissão</label>
                <Select value={professionFilter} onValueChange={setProfessionFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Profissões</SelectItem>
                    {Array.from(new Set(linkedProfessionals.map(p => p.profissionais.profissao))).filter(Boolean).sort().map(prof => (
                      <SelectItem key={prof} value={prof!}>{prof}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordenar por</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="date">Data de Vínculo</SelectItem>
                    <SelectItem value="profession">Profissão</SelectItem>
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
          {filteredProfessionals.map((prof) => (
            <Card key={prof.professional_id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={prof.profissionais.foto_perfil_url || ''} />
                    <AvatarFallback>{prof.profissionais.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{prof.profissionais.display_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{prof.profissionais.profissao}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{prof.profissionais.user_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{relationshipTypeLabels[prof.relationship_type] || prof.relationship_type}</Badge>
                </div>
                {prof.start_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Desde {format(new Date(prof.start_date), 'MM/yyyy')}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-4 mb-3">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/profissional/${prof.professional_id}`}><Eye className="h-4 w-4 mr-1" />Ver Perfil</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/admin/agendamentos?professional_id=${prof.professional_id}`}><Calendar className="h-4 w-4 mr-1" />Agendamentos</Link>
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() =>
                    setSelectedProfessional({
                      userId: prof.profissionais.profiles?.user_id || '',
                      name: prof.profissionais.display_name || '',
                    })
                  }
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Ver Storytelling
                </Button>
                <Badge variant={prof.profissionais.ativo ? 'default' : 'secondary'}>{prof.profissionais.ativo ? 'Ativo' : 'Inativo'}</Badge>
              </CardContent>
            </Card>
          ))}
          {filteredProfessionals.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <Briefcase className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum profissional encontrado</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {linkedProfessionals.length === 0 ? 'Ainda não há profissionais vinculados à sua instituição.' : 'Nenhum profissional corresponde aos filtros selecionados.'}
                    </p>
                  </div>
                  {linkedProfessionals.length > 0 && (
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setProfessionFilter('all'); setSortBy('name'); }}>Limpar Todos os Filtros</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />

      {selectedProfessional && (
        <UserStorytellingModal
          open={!!selectedProfessional}
          onOpenChange={(open) => !open && setSelectedProfessional(null)}
          userId={selectedProfessional.userId}
          userName={selectedProfessional.name}
          userType="professional"
        />
      )}
    </div>
  );
}
