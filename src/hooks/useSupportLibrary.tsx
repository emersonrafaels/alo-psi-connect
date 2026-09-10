import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePatientInstitutions } from "./usePatientInstitutions";
import {
  catalogToItem,
  institutionToItem,
  type InstitutionSupportRow,
  type SupportCatalogRow,
  type SupportItem,
} from "@/features/apoios/types";

/** Catálogo base de apoios (plataforma e modelos institucionais). */
export const useSupportCatalog = (includeInactive = false) => {
  return useQuery({
    queryKey: ["support-catalog", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("support_catalog")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!includeInactive) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SupportCatalogRow[];
    },
  });
};

/** Apoios publicados por uma instituição. */
export const useInstitutionSupports = (institutionId?: string, onlyPublished = false) => {
  return useQuery({
    queryKey: ["institution-supports", institutionId, onlyPublished],
    queryFn: async () => {
      if (!institutionId) return [];
      let query = supabase
        .from("institution_supports")
        .select("*")
        .eq("institution_id", institutionId)
        .order("sort_order", { ascending: true });
      if (onlyPublished) query = query.eq("is_published", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as InstitutionSupportRow[];
    },
    enabled: !!institutionId,
  });
};

/** Apoios da plataforma excluídos do plano da instituição + categorias liberadas. */
export const useInstitutionSupportPlan = (institutionId?: string) => {
  const plan = useQuery({
    queryKey: ["institution-support-plan", institutionId],
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
    queryKey: ["institution-support-settings", institutionId],
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

  const excludedCatalogIds = useMemo(
    () => new Set((plan.data || []).filter((p) => !p.is_included).map((p) => p.catalog_id)),
    [plan.data]
  );

  return {
    planRows: plan.data || [],
    excludedCatalogIds,
    allowedCategories: (settings.data?.allowed_categories as string[] | undefined) || [],
    settings: settings.data,
    isLoading: plan.isLoading || settings.isLoading,
  };
};

/** Biblioteca completa na visão do estudante. */
export const useStudentSupportLibrary = () => {
  const { linkedInstitutions, isLoading: loadingInstitutions } = usePatientInstitutions();
  const institution = linkedInstitutions?.[0];
  const institutionId = institution?.institution_id;

  const { data: catalog = [], isLoading: loadingCatalog } = useSupportCatalog();
  const { data: instSupports = [], isLoading: loadingInst } = useInstitutionSupports(
    institutionId,
    true
  );
  const { excludedCatalogIds, isLoading: loadingPlan } = useInstitutionSupportPlan(institutionId);

  const items = useMemo<SupportItem[]>(() => {
    const platform = catalog
      .filter((c) => c.origin_type === "platform" && !excludedCatalogIds.has(c.id))
      .map(catalogToItem);
    const institutional = instSupports.map((row) =>
      institutionToItem(row, institution?.institution_name)
    );
    return [...institutional, ...platform];
  }, [catalog, excludedCatalogIds, instSupports, institution?.institution_name]);

  return {
    items,
    institutionName: institution?.institution_name as string | undefined,
    hasInstitution: !!institutionId,
    isLoading: loadingInstitutions || loadingCatalog || loadingInst || loadingPlan,
  };
};

const toggleKeyTable = {
  favorites: "support_favorites",
  plan: "support_plan_items",
} as const;

/** Favoritos e "Meu plano de apoio" do estudante. */
export const useSupportUserLists = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const favorites = useQuery({
    queryKey: ["support-favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_favorites").select("support_key");
      if (error) throw error;
      return (data || []).map((r) => r.support_key);
    },
    enabled: !!user,
  });

  const planItems = useQuery({
    queryKey: ["support-plan-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_plan_items").select("support_key");
      if (error) throw error;
      return (data || []).map((r) => r.support_key);
    },
    enabled: !!user,
  });

  const history = useQuery({
    queryKey: ["support-visits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_visits")
        .select("support_key, visited_at")
        .order("visited_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => r.support_key);
    },
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async ({
      list,
      supportKey,
      active,
    }: {
      list: "favorites" | "plan";
      supportKey: string;
      active: boolean;
    }) => {
      const table = toggleKeyTable[list];
      if (!user) throw new Error("not-authenticated");
      if (active) {
        const { error } = await supabase.from(table).delete().eq("support_key", supportKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .upsert({ support_key: supportKey, user_id: user.id }, { onConflict: "user_id,support_key" });
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: [vars.list === "favorites" ? "support-favorites" : "support-plan-items"],
      });
    },
  });

  const registerVisit = useMutation({
    mutationFn: async (supportKey: string) => {
      if (!user) return;
      await supabase
        .from("support_visits")
        .upsert(
          { support_key: supportKey, user_id: user.id, visited_at: new Date().toISOString() },
          { onConflict: "user_id,support_key" }
        );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-visits"] }),
  });

  return {
    favorites: favorites.data || [],
    planItems: planItems.data || [],
    history: history.data || [],
    isAuthenticated: !!user,
    toggle,
    registerVisit,
  };
};
