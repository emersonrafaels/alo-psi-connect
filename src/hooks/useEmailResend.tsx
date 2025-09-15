import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEmailResend = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resendEmailConfirmation = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resend-email-confirmation', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.alreadyConfirmed) {
        toast({
          title: "Email já confirmado",
          description: "Este usuário já confirmou o email.",
        });
      } else {
        toast({
          title: "Email enviado",
          description: "Link de confirmação reenviado com sucesso!",
        });
      }

      return { success: true, alreadyConfirmed: data.alreadyConfirmed };
    } catch (error: any) {
      console.error('Error resending email confirmation:', error);
      toast({
        title: "Erro ao reenviar confirmação",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resendPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Email enviado",
        description: "Link de redefinição de senha enviado com sucesso!",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error resending password reset:', error);
      toast({
        title: "Erro ao reenviar redefinição",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    resendEmailConfirmation,
    resendPasswordReset
  };
};