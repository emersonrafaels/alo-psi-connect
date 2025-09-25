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

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro na autorização",
          description: "Não foi possível conectar com o Google Calendar.",
        });
        
        // Notify parent window if opened in popup
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'GOOGLE_CALENDAR_ERROR', 
            error: error 
          }, '*');
          window.close();
        } else {
          navigate('/profile');
        }
        return;
      }

      if (code && session) {
        try {
          const { data, error: authError } = await supabase.functions.invoke('google-calendar-auth', {
            body: { action: 'connect', code },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (authError) throw authError;

          toast({
            title: "Google Calendar conectado!",
            description: "Sua conta foi conectada com sucesso.",
          });

          // Notify parent window if opened in popup
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'GOOGLE_CALENDAR_SUCCESS', 
              data 
            }, '*');
            window.close();
          } else {
            navigate('/profile');
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
            window.opener.postMessage({ 
              type: 'GOOGLE_CALENDAR_ERROR', 
              error: 'Connection failed' 
            }, '*');
            window.close();
          } else {
            navigate('/profile');
          }
        }
      } else {
        // No code parameter, redirect to profile
        navigate('/profile');
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