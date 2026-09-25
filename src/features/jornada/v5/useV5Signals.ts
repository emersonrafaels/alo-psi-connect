/**
 * Sinais reais da pessoa para a Jornada V5:
 * Paisagem Emocional, trilha de recursos já conhecidos e frequência recente por emoção.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEmotionLabel } from "../config/emotion-taxonomy";
import type { KnownPractice } from "./learningTrail";

export interface JourneyEmotionHistoryRow {
  emotion_id: string;
  family_id: string | null;
  intensity_before: number | null;
  intensity_after: number | null;
  created_at: string;
  position: number | null;
  label: string;
}

export interface LandscapeRow {
  emotion_id: string;
  family_id: string | null;
  occurrences: number;
  avg_intensity: number | null;
  last_at: string | null;
}

export interface LandscapeBubble extends LandscapeRow {
  label: string;
}

/** Paisagem Emocional: frequência e intensidade média por emoção. */
export const useEmotionLandscape = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["jornada-v5", "landscape", userId ?? "anon"],
    enabled: !!userId,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<LandscapeBubble[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("journey_landscape", {
        _user_id: userId,
      });
      if (error) return [];
      return ((data ?? []) as unknown as LandscapeRow[]).map((row) => ({
        ...row,
        occurrences: Number(row.occurrences ?? 0),
        avg_intensity: row.avg_intensity == null ? null : Number(row.avg_intensity),
        label: getEmotionLabel(row.emotion_id),
      }));
    },
  });

  return { bubbles: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch };
};

/** Histórico recente por emoção para desenhar a linha da Paisagem. */
export const useJourneyEmotionHistory = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["jornada-v5", "emotion-history", userId ?? "anon"],
    enabled: !!userId,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<JourneyEmotionHistoryRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("journey_session_emotions")
        .select("emotion_id,family_id,intensity_before,intensity_after,created_at,position")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(80);
      if (error) return [];
      return ((data ?? []) as unknown as Omit<JourneyEmotionHistoryRow, "label">[]).map((row) => ({
        ...row,
        intensity_before: row.intensity_before == null ? null : Number(row.intensity_before),
        intensity_after: row.intensity_after == null ? null : Number(row.intensity_after),
        position: row.position == null ? null : Number(row.position),
        label: getEmotionLabel(row.emotion_id),
      }));
    },
  });

  return { history: query.data ?? [], isLoading: query.isLoading };
};

/** Trilha: práticas que a pessoa já conheceu e o quanto ajudaram. */
export const useKnownPractices = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["jornada-v5", "known-practices", userId ?? "anon"],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<KnownPractice[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("journey_next_resource", {
        _user_id: userId,
      });
      if (error) return [];
      return ((data ?? []) as unknown as KnownPractice[]).map((row) => ({
        ...row,
        times_seen: Number(row.times_seen ?? 0),
        avg_usefulness: row.avg_usefulness == null ? null : Number(row.avg_usefulness),
      }));
    },
  });

  return { known: query.data ?? [], isLoading: query.isLoading };
};

export interface EmotionFrequency {
  count30d: number;
  avgIntensity: number | null;
}

/** Frequência de uma emoção nos últimos 30 dias, a partir da Paisagem. */
export const emotionFrequency = (
  bubbles: LandscapeBubble[],
  emotionId: string | null
): EmotionFrequency => {
  if (!emotionId) return { count30d: 0, avgIntensity: null };
  const row = bubbles.find((item) => item.emotion_id === emotionId);
  return { count30d: row?.occurrences ?? 0, avgIntensity: row?.avg_intensity ?? null };
};
