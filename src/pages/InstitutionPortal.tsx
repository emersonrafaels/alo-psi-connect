import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, Building2, TrendingUp } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { Link } from 'react-router-dom';

export default function InstitutionPortal() {
  const { userInstitutions, linkedProfessionals, linkedStudents, isLoading } = useInstitutionAccess();

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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Portal Institucional</h1>
        <p className="text-muted-foreground mt-2">
          {userInstitutions[0]?.educational_institutions?.name 
            ? `Bem-vindo ao sistema de gestão da ${userInstitutions[0].educational_institutions.name}`
            : 'Bem-vindo ao portal institucional'}
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

        <Card>
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

        <Card>
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

      {/* Ações Rápidas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profissionais Vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visualize e gerencie os profissionais vinculados à sua instituição
            </p>
            <Link to="/portal-institucional/profissionais">
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Ver Profissionais
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alunos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Acompanhe os alunos cadastrados na plataforma
            </p>
            <Link to="/portal-institucional/alunos">
              <Button className="w-full">
                <GraduationCap className="mr-2 h-4 w-4" />
                Ver Alunos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
