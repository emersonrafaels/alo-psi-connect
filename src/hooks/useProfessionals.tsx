import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProfessionals = (limit: number = 6) => {
  return useQuery({
    queryKey: ["professionals", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("*")
        .eq("ativo", true)
        .order("ordem_destaque", { ascending: true, nullsFirst: false })
        .order("display_name", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};
