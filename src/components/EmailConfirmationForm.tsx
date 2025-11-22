import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

interface EmailConfirmationFormProps {
  token?: string;
}

export const EmailConfirmationForm: React.FC<EmailConfirmationFormProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setError('Token de confirmação não encontrado');
        setLoading(false);
        return;
      }

      try {
        console.log('Confirmando email com token:', token);
        
        const { data, error } = await supabase.functions.invoke('confirm-email', {
          body: { token }
        });

        if (error) {
          console.error('Erro na confirmação:', error);
          throw error;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setSuccess(true);
        toast({
          title: "Email confirmado!",
          description: "Sua conta foi ativada com sucesso.",
        });

      } catch (error: any) {
        console.error('Email confirmation error:', error);
        setError(error.message || 'Erro ao confirmar email');
        toast({
          title: "Erro na confirmação",
          description: error.message || "O link de confirmação é inválido ou expirou.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [token, toast, navigate]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="relative">
        {success && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'), { replace: true })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <CardTitle className="text-center">Confirmação de Email</CardTitle>
        <CardDescription className="text-center">
          {loading && "Confirmando seu email..."}
          {success && "Email confirmado com sucesso!"}
          {error && "Erro na confirmação"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {loading && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Processando confirmação...</p>
          </div>
        )}

        {success && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-600">
                Email confirmado com sucesso!
              </h3>
              <p className="text-muted-foreground mt-2">
                Sua conta foi ativada com sucesso!
              </p>
            </div>
            <Button 
              onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'), { replace: true })}
              className="mt-4"
            >
              Ir para login agora
            </Button>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-600">
                Erro na confirmação
              </h3>
              <p className="text-muted-foreground mt-2">
                {error}
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'), { replace: true })}
              className="mt-4"
            >
              Voltar ao login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};