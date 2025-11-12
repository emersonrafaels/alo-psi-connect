import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProfileConsolidation = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const consolidateDuplicateProfiles = async (
    sourceProfessionalId: number,
    targetProfessionalId: number,
    sourceProfileId: string,
    targetProfileId: string,
    photoUrl: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('consolidate-duplicate-professional', {
        body: {
          sourceProfessionalId,
          targetProfessionalId,
          sourceProfileId,
          targetProfileId,
          photoUrl
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao consolidar perfis');
      }

      toast({
        title: "Perfis consolidados com sucesso",
        description: `Perfil ${sourceProfessionalId} foi consolidado no perfil ${targetProfessionalId}`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error consolidating profiles:', error);
      toast({
        title: "Erro ao consolidar perfis",
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
    consolidateDuplicateProfiles
  };
};
