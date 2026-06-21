import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Pratica, PraticaGrupo, PraticaAtalho } from "./usePraticas";

export const useAdminPraticas = () => {
  return useQuery({
    queryKey: ["admin-praticas"],
    queryFn: async () => {
      const [g, p, a, c] = await Promise.all([
        supabase.from("praticas_grupos").select("*").order("ordem"),
        supabase.from("praticas").select("*").order("ordem"),
        supabase.from("praticas_atalhos").select("*").order("ordem"),
        supabase
          .from("praticas_checkouts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (g.error) throw g.error;
      if (p.error) throw p.error;
      if (a.error) throw a.error;
      // checkouts may fail for non-admin; that's fine
      return {
        grupos: (g.data ?? []) as PraticaGrupo[],
        praticas: (p.data ?? []) as unknown as Pratica[],
        atalhos: (a.data ?? []) as PraticaAtalho[],
        checkouts: (c.data ?? []) as any[],
      };
    },
  });
};

export const useSavePratica = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pratica> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("praticas")
          .update(rest as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("praticas").insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-praticas"] });
      qc.invalidateQueries({ queryKey: ["praticas-public"] });
    },
  });
};

export const useDeletePratica = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("praticas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-praticas"] });
      qc.invalidateQueries({ queryKey: ["praticas-public"] });
    },
  });
};

export const useSaveGrupo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PraticaGrupo> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("praticas_grupos")
          .update(rest as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("praticas_grupos").insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-praticas"] }),
  });
};

export const useDeleteGrupo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("praticas_grupos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-praticas"] }),
  });
};

export const useSaveAtalho = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PraticaAtalho> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("praticas_atalhos")
          .update(rest as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("praticas_atalhos").insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-praticas"] }),
  });
};

export const useDeleteAtalho = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("praticas_atalhos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-praticas"] }),
  });
};
