import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from '@/hooks/useTenant';

interface ThemeSuggestionData {
  email: string;
  nome?: string;
  tema: string;
  descricao?: string;
}

interface ThemeSuggestionResponse {
  message: string;
  success: boolean;
}

export const useThemeSuggestion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const suggest = async (data: ThemeSuggestionData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke(
        'suggest-session-theme',
        {
          body: {
            ...data,
            tenantId: tenant?.id
          }
        }
      );

      if (error) {
        console.error("Theme suggestion error:", error);
        toast({
          title: "Erro",
          description: "Erro ao processar sugestão. Tente novamente.",
          variant: "destructive",
        });
        return false;
      }

      const result = response as ThemeSuggestionResponse;
      
      if (result.success) {
        toast({
          title: "Sugestão enviada! 💡",
          description: result.message,
          variant: "default",
        });
        return true;
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao processar sugestão",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Theme suggestion error:", error);
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
    suggest,
    isLoading,
  };
};
