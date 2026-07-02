import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type BuddyPortrait = {
  id: string;
  patient_id: string;
  mind_on: string | null;
  calms_me: string | null;
  wants_to_improve: string[] | null;
  dreams: string | null;
  message_to_buddy: string | null;
  triggers: string[] | null;
  values_list: string[] | null;
  current_mood: string | null;
  anxiety: number | null;
  sadness: number | null;
  motivation: number | null;
  audio_url: string | null;
  privacy: "only_me" | "with_professionals";
  updated_at: string;
  // Ampliação
  sleep_quality: number | null;
  stress_level: number | null;
  energy_level: number | null;
  three_words: string[] | null;
  strengths_self: string[] | null;
  next_3_months: string | null;
  biggest_challenge: string | null;
  support_people: string | null;
  self_care_rituals: string[] | null;
  hobbies: string[] | null;
  avoid_situations: string[] | null;
  ask_help_ease: number | null;
  preferred_tone: string | null;
  reminder_time: string | null;
  audio_answers: Record<string, string> | null;
};

export type BuddyInsight = {
  id: string;
  patient_id: string;
  period_start: string;
  period_end: string;
  wellbeing_score: number | null;
  emotional_stability: number | null;
  sleep_quality: number | null;
  habit_consistency: number | null;
  strengths: { title: string; description: string }[];
  attention_points: { title: string; description: string; severity?: string }[];
  map_topics: { id: string; label: string; weight: number }[];
  sources: Record<string, number>;
  narrative: string | null;
  recommendations: {
    id: string; title: string; description: string; category: string; cta?: string;
  }[];
  model: string | null;
  created_at: string;
};

export function useCurrentPatientId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["buddy", "patient-id", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles").select("id").eq("user_id", user!.id).maybeSingle();
      if (!profile) return null;
      const { data: pac } = await supabase
        .from("pacientes").select("id").eq("profile_id", profile.id).maybeSingle();
      return pac?.id ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuddyPortrait() {
  const { data: patientId } = useCurrentPatientId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["buddy", "portrait", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buddy_portraits" as any)
        .select("*").eq("patient_id", patientId!).maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data as any as BuddyPortrait) ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: async (portrait: Partial<BuddyPortrait>) => {
      if (!patientId) throw new Error("Estudante não identificado");
      const payload: any = { ...portrait, patient_id: patientId };
      const { data, error } = await supabase
        .from("buddy_portraits" as any)
        .upsert(payload, { onConflict: "patient_id" })
        .select("*").single();
      if (error) throw error;
      return data as any as BuddyPortrait;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buddy", "portrait", patientId] }),
  });

  return { ...query, save, patientId };
}

export function useLatestBuddyInsight(periodDays = 30) {
  const { data: patientId } = useCurrentPatientId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["buddy", "insight", patientId, periodDays],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buddy_insights" as any)
        .select("*").eq("patient_id", patientId!)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data as any as BuddyInsight) ?? null;
    },
    staleTime: 30 * 60 * 1000,
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("buddy-generate-insights", {
        body: { periodDays },
      });
      if (error) throw error;
      return data?.insight as BuddyInsight;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buddy", "insight", patientId] }),
  });

  return { ...query, regenerate };
}

export function useRecommendationFeedback() {
  const { data: patientId } = useCurrentPatientId();
  return useMutation({
    mutationFn: async ({ recommendationId, action }: { recommendationId: string; action: "accepted" | "dismissed" | "done" }) => {
      if (!patientId) return;
      const { error } = await supabase.from("buddy_recommendations_feedback" as any).insert({
        patient_id: patientId,
        recommendation_id: recommendationId,
        action,
      });
      if (error) throw error;
    },
  });
}
