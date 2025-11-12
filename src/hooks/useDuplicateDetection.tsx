import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfessionalSummary {
  id: number;
  name: string;
  email: string;
  secondary_email?: string;
  photo?: string;
  completeness_score: number;
  has_schedules: boolean;
  schedule_count: number;
  is_orphan: boolean;
  user_id?: number;
  normalized_services?: string[];
  normalized_education?: string[];
  has_summary: boolean;
}

export interface DuplicateMatch {
  source_id: number;
  target_id: number;
  source_profile_id: string;
  target_profile_id: string;
  confidence_score: number;
  match_reasons: string[];
  recommended_action: 'merge' | 'review' | 'ignore';
  source_data: ProfessionalSummary;
  target_data: ProfessionalSummary;
}

export interface DuplicateDetectionResult {
  success: boolean;
  duplicates_found: number;
  matches: DuplicateMatch[];
}

export const useDuplicateDetection = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const detectDuplicates = async (tenantId?: string): Promise<DuplicateDetectionResult> => {
    setLoading(true);
    
    try {
      toast({
        title: "🔍 Detectando duplicatas...",
        description: "Analisando profissionais cadastrados"
      });

      const { data, error } = await supabase.functions.invoke('detect-duplicate-professionals', {
        body: { tenant_id: tenantId }
      });

      if (error) throw error;

      const result = data as DuplicateDetectionResult;

      toast({
        title: "✅ Verificação concluída",
        description: result.duplicates_found > 0 
          ? `${result.duplicates_found} duplicata(s) encontrada(s)`
          : "Nenhuma duplicata detectada"
      });

      return result;
    } catch (error: any) {
      console.error('Error detecting duplicates:', error);
      toast({
        title: "Erro ao detectar duplicatas",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, duplicates_found: 0, matches: [] };
    } finally {
      setLoading(false);
    }
  };

  const consolidateDuplicate = async (match: DuplicateMatch) => {
    setLoading(true);
    
    try {
      const photoUrl = match.source_data.photo || match.target_data.photo;

      const { data, error } = await supabase.functions.invoke('consolidate-duplicate-professional', {
        body: {
          sourceProfessionalId: match.source_id,
          targetProfessionalId: match.target_id,
          sourceProfileId: match.source_profile_id,
          targetProfileId: match.target_profile_id,
          photoUrl
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Falha ao consolidar perfis');
      }

      toast({
        title: "✅ Consolidação concluída",
        description: `${match.source_data.name} consolidado em ${match.target_data.name}`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error consolidating duplicate:', error);
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

  const consolidateMultiple = async (matches: DuplicateMatch[]) => {
    setLoading(true);
    
    try {
      const results = await Promise.all(
        matches.map(match => consolidateDuplicate(match))
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      toast({
        title: "Consolidação em lote concluída",
        description: `${successCount} consolidação(ões) bem-sucedida(s)${failCount > 0 ? `, ${failCount} falha(s)` : ''}`,
      });

      return results;
    } catch (error: any) {
      console.error('Error consolidating multiple duplicates:', error);
      toast({
        title: "Erro ao consolidar múltiplas duplicatas",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    detectDuplicates,
    consolidateDuplicate,
    consolidateMultiple
  };
};
