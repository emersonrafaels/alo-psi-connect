import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { InstitutionSupportRow } from "@/features/apoios/types";

export type InstitutionSupportInput = Partial<InstitutionSupportRow> & {
  institution_id: string;
  title: string;
  category: string;
};

export const useInstitutionSupportsManager = (institutionId?: string) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["institution-supports"] });

  const save = useMutation({
    mutationFn: async (input: InstitutionSupportInput) => {
      if (input.id) {
        const { id, ...values } = input;
        const { error } = await supabase.from("institution_supports").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("institution_supports").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Apoio salvo" });
    },
    onError: (e: any) =>
      toast({ title: "Não foi possível salvar o apoio", description: e.message, variant: "destructive" }),
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("institution_supports")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_supports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Apoio removido" });
    },
    onError: (e: any) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  /** Cria um apoio a partir de um modelo do catálogo. */
  const addFromCatalog = useMutation({
    mutationFn: async (catalog: {
      id: string;
      title: string;
      category: string;
      format: string;
      access_type: string;
      icon: string;
      description: string;
      details: string | null;
      how_to: string | null;
      when_to: string | null;
    }) => {
      if (!institutionId) throw new Error("Instituição não identificada");
      const { error } = await supabase.from("institution_supports").insert({
        institution_id: institutionId,
        catalog_id: catalog.id,
        title: catalog.title,
        category: catalog.category,
        format: catalog.format,
        access_type: catalog.access_type,
        icon: catalog.icon,
        description: catalog.description,
        details: catalog.details,
        how_to: catalog.how_to,
        when_to: catalog.when_to,
        is_published: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Apoio ativado para os seus alunos" });
    },
    onError: (e: any) => toast({ title: "Erro ao ativar", description: e.message, variant: "destructive" }),
  });

  return { save, togglePublished, remove, addFromCatalog };
};
