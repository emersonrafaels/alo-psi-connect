import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

      // Detect if we're in a popup more reliably
      const isPopup = window.name === 'google-auth' || !!window.opener;
      console.log('🔍 Callback iniciado:', { 
        code: !!code, 
        error, 
        isPopup,
        windowName: window.name,
        hasOpener: !!window.opener,
        hasSession: !!session 
      });

      if (error) {
        console.error('Erro na autorização Google:', error);
        toast({
          variant: "destructive",
          title: "Erro na autorização",
          description: "Não foi possível conectar com o Google Calendar.",
        });
        
        // Notify parent window if opened in popup
        if (window.opener) {
          console.log('Enviando erro para janela principal');
          window.opener.postMessage({ 
            type: 'GOOGLE_CALENDAR_ERROR', 
            error: error 
          }, window.location.origin);
          
          // Auto-close popup after sending message
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          const returnUrl = sessionStorage.getItem('googleCalendarReturnUrl') || '/perfil';
          sessionStorage.removeItem('googleCalendarReturnUrl');
          navigate(returnUrl);
        }
        return;
      }

      if (code) {
        // Wait for session if not available yet (max 5 seconds)
        let currentSession = session;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!currentSession && attempts < maxAttempts) {
          console.log(`⏳ Aguardando sessão... tentativa ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data } = await supabase.auth.getSession();
          currentSession = data.session;
          attempts++;
        }

        if (!currentSession) {
          console.error('❌ Sessão não disponível após timeout');
          toast({
            variant: "destructive",
            title: "Erro de sessão",
            description: "Não foi possível obter a sessão. Faça login novamente.",
          });
          
          if (isPopup) {
            setTimeout(() => window.close(), 1000);
          } else {
            navigate('/auth');
          }
          return;
        }

        console.log('✅ Sessão obtida, user_id:', currentSession.user.id);

        try {
          console.log('🔄 Chamando edge function para trocar code por tokens...');
          console.log('Authorization code:', code?.substring(0, 10) + '...');
          
          const { data, error: authError } = await supabase.functions.invoke('google-calendar-auth', {
            body: { action: 'connect', code },
            headers: {
              Authorization: `Bearer ${currentSession.access_token}`,
            },
          });

          console.log('Response da edge function:', { data, error: authError });

          if (authError) {
            console.error('Erro da edge function:', authError);
            throw authError;
          }

          if (data?.error) {
            console.error('Erro retornado pela função:', data.error);
            throw new Error(data.error);
          }

          console.log('✅ Google Calendar conectado com sucesso!', data);
          
          // Verify tokens were saved
          console.log('🔍 Verificando se tokens foram salvos no banco...');
          const { data: verifyData, error: verifyError } = await supabase
            .from('profiles')
            .select('google_calendar_token, google_calendar_scope')
            .eq('user_id', currentSession.user.id)
            .single();
          
          console.log('🔍 Verificação dos tokens:', {
            hasToken: !!verifyData?.google_calendar_token,
            tokenLength: verifyData?.google_calendar_token?.length || 0,
            scope: verifyData?.google_calendar_scope,
            error: verifyError
          });

          // Send success message BEFORE showing toast or closing popup
          if (isPopup) {
            const targetOrigin = window.location.origin;
            const successMessage = { 
              type: 'GOOGLE_CALENDAR_SUCCESS', 
              data,
              tokenVerified: !!verifyData?.google_calendar_token
            };
            
            console.log('📤 Enviando mensagem de sucesso para janela principal...');
            
            // Send to opener
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage(successMessage, targetOrigin);
                console.log('✅ Mensagem enviada via window.opener');
              } catch (error) {
                console.error('❌ Erro ao enviar via opener:', error);
              }
            }
            
            // Send to parent as fallback
            if (window.parent && window.parent !== window) {
              try {
                window.parent.postMessage(successMessage, targetOrigin);
                console.log('✅ Mensagem enviada via window.parent');
              } catch (error) {
                console.error('❌ Erro ao enviar via parent:', error);
              }
            }
          }

          toast({
            title: "Google Calendar conectado!",
            description: data?.message || "Sua conta foi conectada com sucesso.",
          });

          if (isPopup) {
            console.log('🚪 Tentando fechar popup...');
            
            // Multiple close attempts
            const closePopup = () => {
              try {
                console.log('Tentativa de fechar popup...');
                window.close();
                
                // Check if still open after 100ms
                setTimeout(() => {
                  if (!window.closed) {
                    console.log('⚠️ Popup ainda aberto, tentando novamente...');
                    window.close();
                  }
                }, 100);
              } catch (error) {
                console.error('❌ Erro ao fechar popup:', error);
              }
            };
            
            // First attempt immediately after message
            setTimeout(closePopup, 300);
            
            // Second attempt as backup
            setTimeout(closePopup, 1000);
            
            // Final fallback: redirect if still open
            setTimeout(() => {
              if (!window.closed) {
                console.log('⚠️ Não foi possível fechar popup, redirecionando...');
                const returnUrl = sessionStorage.getItem('googleCalendarReturnUrl') || '/professional-profile';
                sessionStorage.removeItem('googleCalendarReturnUrl');
                navigate(returnUrl);
              }
            }, 2000);
          } else {
            const returnUrl = sessionStorage.getItem('googleCalendarReturnUrl') || '/professional-profile';
            sessionStorage.removeItem('googleCalendarReturnUrl');
            navigate(returnUrl);
          }
        } catch (error) {
          console.error('Erro ao conectar Google Calendar:', error);
          toast({
            variant: "destructive",
            title: "Erro na conexão",
            description: "Não foi possível conectar com o Google Calendar.",
          });

          // Notify parent window if opened in popup
          if (window.opener) {
            console.log('Enviando erro de conexão para janela principal');
            window.opener.postMessage({ 
              type: 'GOOGLE_CALENDAR_ERROR', 
              error: 'Connection failed' 
            }, window.location.origin);
            
            // Auto-close popup after sending message
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            const returnUrl = sessionStorage.getItem('googleCalendarReturnUrl') || '/perfil';
            sessionStorage.removeItem('googleCalendarReturnUrl');
            navigate(returnUrl);
          }
        }
      } else if (!error) {
        // No code and no error, just redirect
        console.log('⚠️ Nenhum code ou error encontrado, redirecionando...');
        const returnUrl = sessionStorage.getItem('googleCalendarReturnUrl') || '/perfil';
        sessionStorage.removeItem('googleCalendarReturnUrl');
        navigate(returnUrl);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast, session]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Conectando com Google Calendar...</p>
      </div>
    </div>
  );
}