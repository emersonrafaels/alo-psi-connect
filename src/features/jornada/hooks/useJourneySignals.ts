import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEmotionNode } from "../config/emotion-taxonomy";

export interface JourneyHistoryRow {
  emotion_id: string;
  family_id: string | null;
  practice_id: string | null;
  intensity_before: number | null;
  intensity_after: number | null;
  created_at: string;
}

export interface JourneyHistoryInsight {
  total: number;
  /** Emoção mais registrada nas últimas sessões. */
  topEmotionId: string | null;
  topEmotionLabel: string | null;
  topEmotionCount: number;
  /** Prática com maior alívio médio nas sessões da pessoa. */
  bestPracticeId: string | null;
  bestPracticeRelief: number | null;
  /** Média de alívio (intensidade antes - depois) de todas as sessões. */
  avgRelief: number | null;
}

const summarize = (rows: JourneyHistoryRow[]): JourneyHistoryInsight => {
  const byEmotion = new Map<string, number>();
  const byPractice = new Map<string, { relief: number; count: number }>();
  let reliefSum = 0;
  let reliefCount = 0;

  rows.forEach((row) => {
    byEmotion.set(row.emotion_id, (byEmotion.get(row.emotion_id) ?? 0) + 1);
    if (row.intensity_before != null && row.intensity_after != null) {
      const relief = row.intensity_before - row.intensity_after;
      reliefSum += relief;
      reliefCount += 1;
      if (row.practice_id) {
        const current = byPractice.get(row.practice_id) ?? { relief: 0, count: 0 };
        byPractice.set(row.practice_id, {
          relief: current.relief + relief,
          count: current.count + 1,
        });
      }
    }
  });

  const topEmotion = [...byEmotion.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const bestPractice =
    [...byPractice.entries()]
      .map(([id, value]) => ({ id, relief: value.relief / value.count }))
      .sort((a, b) => b.relief - a.relief)[0] ?? null;

  return {
    total: rows.length,
    topEmotionId: topEmotion?.[0] ?? null,
    topEmotionLabel: topEmotion ? (getEmotionNode(topEmotion[0])?.label ?? null) : null,
    topEmotionCount: topEmotion?.[1] ?? 0,
    bestPracticeId: bestPractice?.id ?? null,
    bestPracticeRelief: bestPractice ? Number(bestPractice.relief.toFixed(1)) : null,
    avgRelief: reliefCount ? Number((reliefSum / reliefCount).toFixed(1)) : null,
  };
};

/** Histórico de jornadas da própria pessoa (últimas 30 sessões). */
export const useJourneyHistory = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["jornada", "history", user?.id ?? "anon"],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<JourneyHistoryRow[]> => {
      const { data, error } = await supabase
        .from("journey_sessions")
        .select("emotion_id, family_id, practice_id, intensity_before, intensity_after, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) return [];
      return (data ?? []) as JourneyHistoryRow[];
    },
  });

  return {
    rows: query.data ?? [],
    insight: summarize(query.data ?? []),
    isLoading: query.isLoading,
  };
};

export interface PracticeStat {
  practice_id: string;
  sessions: number;
  avg_relief: number | null;
  relief_rate: number | null;
}

/** Agregados anônimos: o que ajudou quem registrou a mesma emoção. */
export const useJourneyAggregates = (emotionId: string | null) => {
  const query = useQuery({
    queryKey: ["jornada", "aggregates", emotionId],
    enabled: !!emotionId,
    staleTime: 1000 * 60 * 15,
    queryFn: async (): Promise<PracticeStat[]> => {
      const { data, error } = await supabase.rpc("journey_practice_stats", {
        _emotion_id: emotionId as string,
      });
      if (error) return [];
      return (data ?? []) as unknown as PracticeStat[];
    },
  });

  return { stats: query.data ?? [], isLoading: query.isLoading };
};

export interface MoodMomentum {
  entries: number;
  avgMood: number | null;
  trend: "up" | "down" | "flat" | null;
  lastDate: string | null;
}

/** Sinal do diário emocional: média e tendência dos últimos 7 dias. */
export const useMoodMomentum = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["jornada", "mood-momentum", user?.id ?? "anon"],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<MoodMomentum> => {
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const { data, error } = await supabase
        .from("mood_entries")
        .select("date, emotion_values")
        .gte("date", since.toISOString().slice(0, 10))
        .order("date", { ascending: false })
        .limit(14);

      if (error || !data?.length) {
        return { entries: 0, avgMood: null, trend: null, lastDate: null };
      }

      const moodOf = (row: { emotion_values: unknown }) => {
        const values = (row.emotion_values ?? {}) as Record<string, unknown>;
        const raw = values.humor ?? values.mood ?? values.geral;
        const num = Number(raw);
        return Number.isFinite(num) ? num : null;
      };

      const scored = data
        .map((row) => ({ date: row.date as string, mood: moodOf(row) }))
        .filter((row) => row.mood != null) as { date: string; mood: number }[];

      if (!scored.length) {
        return { entries: data.length, avgMood: null, trend: null, lastDate: data[0].date as string };
      }

      const recent = scored.slice(0, 7);
      const previous = scored.slice(7, 14);
      const mean = (list: { mood: number }[]) =>
        list.reduce((sum, item) => sum + item.mood, 0) / list.length;

      const avgRecent = mean(recent);
      const avgPrevious = previous.length ? mean(previous) : null;
      const delta = avgPrevious == null ? 0 : avgRecent - avgPrevious;

      return {
        entries: scored.length,
        avgMood: Number(avgRecent.toFixed(1)),
        trend: avgPrevious == null ? null : delta > 0.2 ? "up" : delta < -0.2 ? "down" : "flat",
        lastDate: scored[0].date,
      };
    },
  });

  return (
    query.data ?? { entries: 0, avgMood: null, trend: null, lastDate: null }
  );
};

/** Grava a sessão concluída (funciona também para visitantes, sem identificação). */
export const saveJourneySession = async (payload: {
  userId?: string | null;
  sessionKey: string;
  familyId: string | null;
  emotionId: string;
  intensityBefore: number | null;
  intensityAfter: number | null;
  practiceId: string | null;
  durationMinutes: number | null;
  perceivedChangeIds: string[];
  usefulness: number | null;
}) => {
  try {
    await supabase.from("journey_sessions").insert({
      user_id: payload.userId ?? null,
      session_key: payload.sessionKey,
      family_id: payload.familyId,
      emotion_id: payload.emotionId,
      intensity_before: payload.intensityBefore,
      intensity_after: payload.intensityAfter,
      practice_id: payload.practiceId,
      duration_minutes: payload.durationMinutes,
      perceived_change_ids: payload.perceivedChangeIds,
      usefulness: payload.usefulness,
    });
  } catch {
    /* silencioso: a jornada não é bloqueada por falha de registro */
  }
};
