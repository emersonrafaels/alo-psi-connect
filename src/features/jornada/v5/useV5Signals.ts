/**
 * Sinais reais da pessoa para a Jornada V5:
 * Paisagem Emocional, trilha de recursos já conhecidos e frequência recente por emoção.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEmotionNode } from "../config/emotion-taxonomy";
import type { KnownPractice } from "./learningTrail";

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

  const query = useQuery({
    queryKey: ["jornada-v5", "landscape", user?.id ?? "anon"],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<LandscapeBubble[]> => {
      const { data, error } = await supabase.rpc("journey_landscape", {
        _user_id: user!.id,
      });
      if (error) return [];
      return ((data ?? []) as unknown as LandscapeRow[]).map((row) => ({
        ...row,
        occurrences: Number(row.occurrences ?? 0),
        avg_intensity: row.avg_intensity == null ? null : Number(row.avg_intensity),
        label: getEmotionNode(row.emotion_id)?.label ?? row.emotion_id,
      }));
    },
  });

  return { bubbles: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch };
};

/** Trilha: práticas que a pessoa já conheceu e o quanto ajudaram. */
export const useKnownPractices = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["jornada-v5", "known-practices", user?.id ?? "anon"],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<KnownPractice[]> => {
      const { data, error } = await supabase.rpc("journey_next_resource", {
        _user_id: user!.id,
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
