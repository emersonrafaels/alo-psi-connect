import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SharingChoice = "psicologo" | "psiquiatra" | "ambos" | "only_me";

export type BuddyPrivacyPreferences = {
  id: string;
  user_id: string;
  preferences: Record<string, { psicologo: boolean; psiquiatra: boolean }>;
  consent_registered_at: string | null;
  updated_at: string;
};

export function useBuddyPrivacy() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["buddy", "privacy", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buddy_privacy_preferences" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data as any as BuddyPrivacyPreferences) ?? null;
    },
    staleTime: 60 * 1000,
  });

  const save = useMutation({
    mutationFn: async (input: {
      preferences: BuddyPrivacyPreferences["preferences"];
      registerConsent?: boolean;
    }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const payload: any = {
        user_id: user.id,
        preferences: input.preferences,
      };
      if (input.registerConsent) payload.consent_registered_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("buddy_privacy_preferences" as any)
        .upsert(payload, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      return data as any as BuddyPrivacyPreferences;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buddy", "privacy", user?.id] }),
  });

  return { ...query, save };
}

export function useRemoveBuddyPortraitField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ patientId, field }: { patientId: string; field: string }) => {
      const { error } = await supabase
        .from("buddy_portraits" as any)
        .update({ [field]: null } as any)
        .eq("patient_id", patientId);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["buddy", "portrait", vars.patientId] });
    },
  });
}
