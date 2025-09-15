import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasProfile, loading } = useUserProfile();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [googleData, setGoogleData] = useState<any>(null);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'processing' | 'success' | 'error' | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is an email confirmation callback
        const callbackType = searchParams.get('type');
        const token = searchParams.get('token');
        
        if (callbackType === 'email_confirmation' && token) {
          await handleEmailConfirmation(token);
          return;
        }

        // Regular OAuth callback handling
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

    const handleEmailConfirmation = async (token: string) => {
      setIsConfirmingEmail(true);
      setConfirmationStatus('processing');
      
      try {
        const { data, error } = await supabase.functions.invoke('confirm-email', {
          body: { token }
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setConfirmationStatus('error');
          toast({
            title: "Erro na confirmação",
            description: "Não foi possível confirmar seu email. O link pode estar expirado.",
            variant: "destructive",
          });
          
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
          return;
        }

        setConfirmationStatus('success');
        toast({
          title: "Email confirmado!",
          description: "Sua conta foi ativada com sucesso. Você pode fazer login agora.",
          variant: "default",
        });

        setTimeout(() => {
          navigate('/auth');
        }, 3000);
        
      } catch (error) {
        console.error('Error confirming email:', error);
        setConfirmationStatus('error');
        toast({
          title: "Erro na confirmação",
          description: "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [user, hasProfile, loading, navigate, searchParams, toast]);

  // Email confirmation specific UI
  if (isConfirmingEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="text-center bg-card rounded-lg p-8 shadow-lg border">
            <div className="mb-6">
              {confirmationStatus === 'processing' && (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
                  <div className="w-full bg-muted rounded-full h-2 mb-4">
                    <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </>
              )}
              
              {confirmationStatus === 'success' && (
                <div className="text-green-500 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {confirmationStatus === 'error' && (
                <div className="text-red-500 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            
            {confirmationStatus === 'processing' && (
              <>
                <h2 className="text-xl font-semibold mb-2">Confirmando seu email...</h2>
                <p className="text-muted-foreground mb-4">
                  Aguarde enquanto processamos a confirmação do seu email.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>• Validando token de confirmação</p>
                  <p>• Ativando sua conta</p>
                  <p>• Finalizando processo</p>
                </div>
              </>
            )}
            
            {confirmationStatus === 'success' && (
              <>
                <h2 className="text-xl font-semibold mb-2 text-green-600">Email confirmado com sucesso!</h2>
                <p className="text-muted-foreground mb-4">
                  Sua conta foi ativada. Você será redirecionado para a página de login em alguns segundos.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>✓ Conta ativada</p>
                  <p>✓ Redirecionando para login...</p>
                </div>
              </>
            )}
            
            {confirmationStatus === 'error' && (
              <>
                <h2 className="text-xl font-semibold mb-2 text-red-600">Erro na confirmação</h2>
                <p className="text-muted-foreground mb-4">
                  Não foi possível confirmar seu email. O link pode estar expirado ou inválido.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>✗ Token inválido ou expirado</p>
                  <p>→ Redirecionando para login...</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

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