import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasProfile, loading } = useUserProfile();

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
          // Se não tem perfil, redirecionar para seleção de tipo de usuário
          navigate('/cadastro/tipo-usuario');
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
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold">Processando autenticação...</h2>
        <p className="text-muted-foreground">Aguarde enquanto configuramos sua conta.</p>
      </div>
    </div>
  );
};

export default AuthCallback;