import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Mail, Calendar, GraduationCap, ArrowLeft } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function InstitutionStudents() {
  const { linkedStudents, isLoading } = useInstitutionAccess();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredStudents = linkedStudents.filter(s =>
    s.pacientes.profiles.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.pacientes.profiles.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges = {
      enrolled: { label: 'Matriculado', variant: 'default' as const },
      graduated: { label: 'Formado', variant: 'secondary' as const },
      inactive: { label: 'Inativo', variant: 'outline' as const },
    };
    return badges[status as keyof typeof badges] || badges.enrolled;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/portal-institucional">
                Portal Institucional
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Alunos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Cabeçalho com botão voltar */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Alunos da Instituição</h1>
            <p className="text-muted-foreground mt-2">
              {linkedStudents.length} alunos vinculados
            </p>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link to="/portal-institucional">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Portal
            </Link>
          </Button>
        </div>

      {/* Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.patient_id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10">
                    {student.pacientes.profiles.nome?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {student.pacientes.profiles.nome}
                  </CardTitle>
                  {student.pacientes.eh_estudante && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      <span>Estudante</span>
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
                  <span>
                    Matrícula: {format(new Date(student.enrollment_date), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}

              <Badge variant={getStatusBadge(student.enrollment_status).variant}>
                {getStatusBadge(student.enrollment_status).label}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

        {filteredStudents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum aluno encontrado
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
