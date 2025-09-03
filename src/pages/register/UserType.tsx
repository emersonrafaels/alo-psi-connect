import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect } from 'react';

const UserType = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasProfile, loading } = useUserProfile();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Se já tem perfil, redirecionar para home
    if (!loading && hasProfile) {
      navigate('/');
    }
  }, [user, hasProfile, loading, navigate]);

  if (!user || loading) return null;

  const handleUserTypeSelection = (tipo: 'paciente' | 'profissional') => {
    if (tipo === 'paciente') {
      navigate('/cadastro/paciente');
    } else {
      navigate('/cadastro/profissional');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Quero ser atendido ou quero atender?
            </h1>
            <p className="text-muted-foreground text-lg">
              Cadastre-se no formulário abaixo e faça parte da comunidade Alô, Psi!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group" 
                  onClick={() => handleUserTypeSelection('paciente')}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl mb-2">Quero ser atendido</CardTitle>
                <div className="w-12 h-1 bg-accent mx-auto mb-4"></div>
                <CardDescription className="text-base">
                  Sou um médico ou um estudante de medicina e busco por atendimento psicológico especializado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="default">
                  Cadastre-se
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group"
                  onClick={() => handleUserTypeSelection('profissional')}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl mb-2">Quero atender</CardTitle>
                <div className="w-12 h-1 bg-teal mx-auto mb-4"></div>
                <CardDescription className="text-base">
                  Sou um psicólogo, psiquiatra ou psicoterapeuta e gostaria de deixar meus serviços à disposição.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="teal">
                  Cadastre-se
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <p className="text-muted-foreground">
              Caso já possua conta, {' '}
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