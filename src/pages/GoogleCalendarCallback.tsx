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

      console.log('Callback iniciado:', { code: !!code, error, hasOpener: !!window.opener });

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

      if (code && session) {
        try {
          console.log('Chamando edge function para trocar code por tokens...');
          console.log('Authorization code:', code?.substring(0, 10) + '...');
          
          const { data, error: authError } = await supabase.functions.invoke('google-calendar-auth', {
            body: { action: 'connect', code },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
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

          console.log('Google Calendar conectado com sucesso!', data);
          
          // Extra verification step
          console.log('🔍 Verificando se tokens foram realmente salvos...');
          setTimeout(async () => {
            try {
              const { data: verifyData } = await supabase
                .from('profiles')
                .select('google_calendar_token, google_calendar_scope')
                .eq('user_id', session.user.id)
                .single();
              
              console.log('🔍 Verificação dos tokens após callback:', {
                hasToken: !!verifyData?.google_calendar_token,
                tokenLength: verifyData?.google_calendar_token?.length || 0,
                scope: verifyData?.google_calendar_scope
              });
            } catch (error) {
              console.error('🔍 Erro na verificação:', error);
            }
          }, 1000);

          toast({
            title: "Google Calendar conectado!",
            description: data?.message || "Sua conta foi conectada com sucesso.",
          });

          // Detecta se está em popup de múltiplas formas
          const isPopup = !!(window.opener || window.parent !== window || window.name === 'google-auth');
          console.log('Detectado como popup:', isPopup);
          console.log('window.opener existe:', !!window.opener);
          console.log('window.parent !== window:', window.parent !== window);
          console.log('window.name:', window.name);

          if (isPopup) {
            console.log('Enviando sucesso para janela principal');
            const targetOrigin = window.location.origin;
            
            // Tenta enviar para opener primeiro
            if (window.opener) {
              try {
                window.opener.postMessage({ 
                  type: 'GOOGLE_CALENDAR_SUCCESS', 
                  data 
                }, targetOrigin);
                console.log('Mensagem enviada via window.opener');
              } catch (error) {
                console.error('Erro ao enviar mensagem via opener:', error);
              }
            }
            
            // Também tenta enviar para parent como fallback
            if (window.parent && window.parent !== window) {
              try {
                window.parent.postMessage({ 
                  type: 'GOOGLE_CALENDAR_SUCCESS', 
                  data 
                }, targetOrigin);
                console.log('Mensagem enviada via window.parent');
              } catch (error) {
                console.error('Erro ao enviar mensagem via parent:', error);
              }
            }
            
            // Fechar popup com delay simples
            setTimeout(() => {
              try {
                window.close();
              } catch (error) {
                console.log('Could not close popup, redirecting...');
                const returnUrl = sessionStorage.getItem('googleCalendarReturnUrl') || '/professional-profile';
                sessionStorage.removeItem('googleCalendarReturnUrl');
                navigate(returnUrl);
              }
            }, 1000);
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
      } else {
        // No code parameter, redirect to return URL
        const returnUrl = sessionStorage.getItem('googleCalendarReturnUrl') || '/perfil';
        sessionStorage.removeItem('googleCalendarReturnUrl');
        navigate(returnUrl);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Conectando com Google Calendar...</p>
      </div>
    </div>
  );
}