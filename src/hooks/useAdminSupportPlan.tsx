import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SupportCatalogRow } from "@/features/apoios/types";

export const useSupportInstitutions = () =>
  useQuery({
    queryKey: ["support-institutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_institutions")
        .select("id, name, type, is_active")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

/** Contagens agregadas de favoritos e acessos por apoio (somente admins). */
export const useSupportUsageMetrics = () =>
  useQuery({
    queryKey: ["support-usage-metrics"],
    queryFn: async () => {
      const [fav, vis] = await Promise.all([
        supabase.rpc("get_support_favorites_counts"),
        supabase.rpc("get_support_visits_counts"),
      ]);
      if (fav.error) throw fav.error;
      if (vis.error) throw vis.error;
      const toMap = (rows: { support_key: string; total: number }[] | null) => {
        const map = new Map<string, number>();
        (rows || []).forEach((r) => map.set(r.support_key, Number(r.total)));
        return map;
      };
      const favorites = toMap(fav.data as any);
      const visits = toMap(vis.data as any);
      const sum = (m: Map<string, number>) => Array.from(m.values()).reduce((a, b) => a + b, 0);
      return {
        favorites,
        visits,
        totalFavorites: sum(favorites),
        totalVisits: sum(visits),
      };
    },
  });

export const useAdminSupportCatalogMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["support-catalog"] });

  const createCatalog = useMutation({
    mutationFn: async (values: Partial<SupportCatalogRow>) => {
      const { error } = await supabase.from("support_catalog").insert(values as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Apoio criado" });
    },
    onError: (e: any) =>
      toast({ title: "Não foi possível criar", description: e.message, variant: "destructive" }),
  });


  const updateCatalog = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<SupportCatalogRow> }) => {
      const { error } = await supabase.from("support_catalog").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Apoio atualizado" });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  return { updateCatalog };
};

export const useAdminInstitutionPlan = (institutionId?: string) => {
  const queryClient = useQueryClient();

  const plan = useQuery({
    queryKey: ["admin-institution-support-plan", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from("institution_support_plan")
        .select("catalog_id, is_included")
        .eq("institution_id", institutionId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  const settings = useQuery({
    queryKey: ["admin-institution-support-settings", institutionId],
    queryFn: async () => {
      if (!institutionId) return null;
      const { data, error } = await supabase
        .from("institution_support_settings")
        .select("*")
        .eq("institution_id", institutionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  const setIncluded = useMutation({
    mutationFn: async ({ catalogId, included }: { catalogId: string; included: boolean }) => {
      if (!institutionId) return;
      const { error } = await supabase
        .from("institution_support_plan")
        .upsert(
          { institution_id: institutionId, catalog_id: catalogId, is_included: included },
          { onConflict: "institution_id,catalog_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institution-support-plan", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["institution-support-plan"] });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar o plano", description: e.message, variant: "destructive" }),
  });

  const setAllowedCategories = useMutation({
    mutationFn: async (categories: string[]) => {
      if (!institutionId) return;
      const { error } = await supabase
        .from("institution_support_settings")
        .upsert(
          { institution_id: institutionId, allowed_categories: categories },
          { onConflict: "institution_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institution-support-settings", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["institution-support-settings"] });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar categorias", description: e.message, variant: "destructive" }),
  });

  const excludedIds = new Set((plan.data || []).filter((p) => !p.is_included).map((p) => p.catalog_id));

  return {
    excludedIds,
    allowedCategories: (settings.data?.allowed_categories as string[] | undefined) || [],
    isLoading: plan.isLoading || settings.isLoading,
    setIncluded,
    setAllowedCategories,
  };
};
