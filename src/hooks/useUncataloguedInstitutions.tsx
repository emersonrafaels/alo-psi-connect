import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UncataloguedInstitution {
  name: string;
  patient_count: number;
  first_mention: string;
  last_mention: string;
}

export interface CatalogueRequest {
  customName: string;
  officialData: {
    name: string;
    type: 'public' | 'private';
    has_partnership: boolean;
    is_active: boolean;
  };
}

export interface LinkRequest {
  customName: string;
  targetInstitutionId: string;
}

export const useUncataloguedInstitutions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar instituições não catalogadas
  const { data: uncatalogued, isLoading } = useQuery({
    queryKey: ['uncatalogued-institutions'],
    queryFn: async () => {
      // Query SQL direta para buscar instituições não catalogadas
      const { data: pacientes, error: pacientesError } = await supabase
        .from('pacientes')
        .select('instituicao_ensino, created_at');

      if (pacientesError) throw pacientesError;

      const { data: institutions, error: institutionsError } = await supabase
        .from('educational_institutions')
        .select('name');

      if (institutionsError) throw institutionsError;

      // Normalizar nomes de instituições catalogadas para comparação
      const cataloguedNames = new Set(
        institutions.map((i) => i.name.toLowerCase().trim())
      );

      // Agrupar pacientes por instituição não catalogada
      const grouped = new Map<string, { count: number; firstMention: string; lastMention: string }>();

      pacientes.forEach((p) => {
        if (!p.instituicao_ensino) return;

        const normalizedName = p.instituicao_ensino.toLowerCase().trim();
        if (cataloguedNames.has(normalizedName)) return;

        const existing = grouped.get(p.instituicao_ensino);
        if (existing) {
          existing.count++;
          if (p.created_at < existing.firstMention) {
            existing.firstMention = p.created_at;
          }
          if (p.created_at > existing.lastMention) {
            existing.lastMention = p.created_at;
          }
        } else {
          grouped.set(p.instituicao_ensino, {
            count: 1,
            firstMention: p.created_at,
            lastMention: p.created_at,
          });
        }
      });

      // Converter para array e ordenar
      const result: UncataloguedInstitution[] = Array.from(grouped.entries())
        .map(([name, stats]) => ({
          name,
          patient_count: stats.count,
          first_mention: stats.firstMention,
          last_mention: stats.lastMention,
        }))
        .sort((a, b) => b.patient_count - a.patient_count);

      return result;
    },
  });

  // Stats das instituições não catalogadas
  const stats = {
    total: uncatalogued?.length || 0,
    affectedPatients: uncatalogued?.reduce((sum, inst) => sum + inst.patient_count, 0) || 0,
  };

  // Catalogar instituição
  const catalogueMutation = useMutation({
    mutationFn: async (data: CatalogueRequest) => {
      const { data: result, error } = await supabase.functions.invoke('normalize-institutions', {
        body: {
          action: 'catalogue',
          custom_name: data.customName,
          official_data: data.officialData,
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['uncatalogued-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['educational-institutions'] });
      toast({
        title: 'Instituição catalogada',
        description: `${result.updated_count} paciente(s) atualizado(s) com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao catalogar instituição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Vincular a instituição existente
  const linkMutation = useMutation({
    mutationFn: async (data: LinkRequest) => {
      const { data: result, error } = await supabase.functions.invoke('normalize-institutions', {
        body: {
          action: 'link',
          custom_name: data.customName,
          target_institution_id: data.targetInstitutionId,
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['uncatalogued-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['educational-institutions'] });
      toast({
        title: 'Instituição vinculada',
        description: `${result.updated_count} paciente(s) atualizado(s) com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao vincular instituição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    uncatalogued: uncatalogued || [],
    isLoading,
    stats,
    catalogueInstitution: catalogueMutation.mutate,
    linkInstitution: linkMutation.mutate,
    isCataloguing: catalogueMutation.isPending,
    isLinking: linkMutation.isPending,
  };
};
