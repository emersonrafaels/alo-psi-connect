import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsletterData {
  email: string;
  nome?: string;
}

interface NewsletterResponse {
  message: string;
  success: boolean;
  already_subscribed?: boolean;
}

export const useNewsletter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const subscribe = async (data: NewsletterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke(
        'newsletter-signup',
        {
          body: data
        }
      );

      if (error) {
        console.error("Newsletter subscription error:", error);
        toast({
          title: "Erro",
          description: "Erro ao processar inscrição. Tente novamente.",
          variant: "destructive",
        });
        return false;
      }

      const result = response as NewsletterResponse;
      
      if (result.success) {
        if (result.already_subscribed) {
          toast({
            title: "Já inscrito",
            description: result.message,
            variant: "default",
          });
        } else {
          toast({
            title: "Sucesso!",
            description: result.message,
            variant: "default",
          });
        }
        return true;
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao processar inscrição",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscribe,
    isLoading,
  };
};