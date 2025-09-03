import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasProfile, loading } = useUserProfile();
  const [googleData, setGoogleData] = useState<any>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar se há parâmetros de autenticação na URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          navigate('/auth');
          return;
        }

        if (!data.session) {
          navigate('/auth');
          return;
        }

        // Aguardar carregamento do perfil
        if (loading) return;

        // Se o usuário já tem perfil, redirecionar para home
        if (hasProfile) {
          navigate('/');
        } else {
          // Extrair dados do Google se disponível
          const googleUserData = data.session?.user?.user_metadata;
          if (googleUserData) {
            const extractedData = {
              fullName: googleUserData.full_name || googleUserData.name || '',
              email: googleUserData.email || '',
              picture: googleUserData.picture || googleUserData.avatar_url || '',
              emailVerified: googleUserData.email_verified || false
            };
            setGoogleData(extractedData);
          }
          
          // Se não tem perfil, redirecionar para seleção de tipo de usuário com dados do Google
          navigate('/cadastro/tipo-usuario', { 
            state: { googleData: googleUserData ? {
              fullName: googleUserData.full_name || googleUserData.name || '',
              email: googleUserData.email || '',
              picture: googleUserData.picture || googleUserData.avatar_url || '',
              emailVerified: googleUserData.email_verified || false
            } : null }
          });
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [user, hasProfile, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center bg-card rounded-lg p-8 shadow-lg border">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Processando autenticação...</h2>
          <p className="text-muted-foreground mb-4">
            Aguarde enquanto configuramos sua conta e verificamos suas informações.
          </p>
          
          <div className="text-sm text-muted-foreground">
            <p>• Verificando credenciais</p>
            <p>• Carregando perfil</p>
            <p>• Preparando dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;