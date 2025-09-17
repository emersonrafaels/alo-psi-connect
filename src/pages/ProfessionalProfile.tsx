import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfessionalProfile as ProfessionalProfileComponent } from '@/components/ProfessionalProfile';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

const ProfessionalProfile = () => {
  const { user } = useAuth();
  const { isProfessional, loading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Verificando acesso profissional...</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isProfessional) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground text-center">
                Esta área é exclusiva para profissionais cadastrados e aprovados.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ProfessionalProfileComponent />
      </main>
      <Footer />
    </div>
  );
};

export default ProfessionalProfile;