import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { useEffect } from 'react';

const UserType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleData = location.state?.googleData || null;
  const { user } = useAuth();
  const { hasProfile, loading } = useUserProfile();
  const { tenant } = useTenant();

  useEffect(() => {
    // Se o usuário está logado e já tem perfil, redirecionar para home
    if (user && !loading && hasProfile) {
      const tenantSlug = tenant?.slug || 'alopsi';
      navigate(buildTenantPath(tenantSlug, '/'));
    }
  }, [user, hasProfile, loading, navigate, tenant]);

  if (loading) return null;

  const handleUserTypeSelection = (tipo: 'paciente' | 'profissional') => {
    const tenantSlug = tenant?.slug || 'alopsi';
    
    if (tipo === 'paciente') {
      const path = buildTenantPath(tenantSlug, '/cadastro/paciente');
      navigate(path, { state: { googleData } });
    } else {
      const path = buildTenantPath(tenantSlug, '/cadastro/profissional');
      navigate(path, { state: { googleData } });
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

          <div className="max-w-md mx-auto">
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
          </div>

          <div className="mt-8">
            <p className="text-muted-foreground">
              Caso já possua conta,{' '}
              <button
                onClick={() => {
                  const tenantSlug = tenant?.slug || 'alopsi';
                  navigate(buildTenantPath(tenantSlug, '/auth'));
                }}
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