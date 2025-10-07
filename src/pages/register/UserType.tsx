import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect } from 'react';

const UserType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleData = location.state?.googleData || null;
  const { user } = useAuth();
  const { hasProfile, loading } = useUserProfile();

  useEffect(() => {
    // Se o usuário está logado e já tem perfil, redirecionar para home
    if (user && !loading && hasProfile) {
      navigate('/');
    }
  }, [user, hasProfile, loading, navigate]);

  if (loading) return null;

  const handleUserTypeSelection = (tipo: 'paciente' | 'profissional') => {
    if (tipo === 'paciente') {
      navigate('/cadastro/paciente', { state: { googleData } });
    } else {
      navigate('/cadastro/profissional', { state: { googleData } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <div className="mb-6">
              <div className="w-16 h-1 bg-primary mx-auto mb-4"></div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Passo 1 de 3
              </span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Como você deseja se cadastrar?
            </h1>
            <p className="text-muted-foreground text-lg">
              Escolha o tipo de cadastro que melhor se adequa ao seu perfil
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card
              className="border-2 hover:border-primary transition-all duration-300 cursor-pointer group hover:shadow-lg"
              onClick={() => handleUserTypeSelection('paciente')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-6 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-10 h-10 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl mb-3 group-hover:text-primary transition-colors">
                  Quero ser atendido
                </CardTitle>
                <div className="w-12 h-1 bg-primary mx-auto mb-4"></div>
                <CardDescription className="text-base leading-relaxed">
                  Sou um médico ou estudante de medicina e busco atendimento psicológico especializado.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button className="w-full group-hover:shadow-md transition-shadow" variant="default">
                  Continuar como Paciente
                </Button>
              </CardContent>
            </Card>

            <Card
              className="border-2 hover:border-primary transition-all duration-300 cursor-pointer group hover:shadow-lg"
              onClick={() => handleUserTypeSelection('profissional')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-6 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-10 h-10 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl mb-3 group-hover:text-primary transition-colors">
                  Quero atender
                </CardTitle>
                <div className="w-12 h-1 bg-primary mx-auto mb-4"></div>
                <CardDescription className="text-base leading-relaxed">
                  Sou psicólogo, psiquiatra ou psicoterapeuta e desejo oferecer meus serviços dentro da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button className="w-full group-hover:shadow-md transition-shadow" variant="default">
                  Continuar como Profissional
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <p className="text-muted-foreground">
              Caso já possua conta,{' '}
              <button
                onClick={() => navigate('/auth')}
                className="text-primary hover:underline font-medium"
              >
                clique aqui
              </button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserType;