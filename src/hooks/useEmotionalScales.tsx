import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EmotionalScale {
  id: string;
  code: string;
  name: string;
  short_description: string | null;
  description: string | null;
  instructions: string | null;
  item_min: number;
  item_max: number;
  reverse_items: number[];
  iseu_weight: number;
  iseu_direction: "positive" | "inverse";
  frequency_days: number;
  estimated_minutes: number;
  active: boolean;
  display_order: number;
  subscales?: Record<string, { label: string; items: number[] }> | null;
}

export interface EmotionalScaleItem {
  id: string;
  scale_id: string;
  position: number;
  text: string;
  option_labels: Record<string, string>;
}

export interface ScaleResponse {
  id: string;
  user_id: string;
  scale_id: string;
  scale_code: string;
  answers: number[];
  raw_score: number;
  normalized_score: number;
  severity: string;
  subscale_scores?: Record<string, { label: string; raw: number; normalized: number }> | null;
  taken_at: string;
  created_at: string;
}

export interface IseuScore {
  id: string;
  user_id: string;
  score: number;
  band: "verde" | "amarelo" | "laranja" | "vermelho";
  components: Record<string, { name: string; normalized_score: number; weight: number; taken_at: string }>;
  scales_used: number;
  weights_total: number;
  computed_at: string;
}

export function useEmotionalScales() {
  return useQuery({
    queryKey: ["emotional-scales"],
    queryFn: async (): Promise<EmotionalScale[]> => {
      const { data, error } = await supabase
        .from("emotional_scales" as any)
        .select("*")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useEmotionalScale(code: string | undefined) {
  return useQuery({
    queryKey: ["emotional-scale", code],
    enabled: !!code,
    queryFn: async () => {
      const { data: scale, error } = await supabase
        .from("emotional_scales" as any)
        .select("*")
        .eq("code", code!)
        .maybeSingle();
      if (error) throw error;
      if (!scale) return null;
      const { data: items, error: itemsErr } = await supabase
        .from("emotional_scale_items" as any)
        .select("*")
        .eq("scale_id", (scale as any).id)
        .order("position");
      if (itemsErr) throw itemsErr;
      return { scale: scale as unknown as EmotionalScale, items: (items as unknown as EmotionalScaleItem[]) ?? [] };
    },
  });
}

export function useUserScaleResponses(scaleCode?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scale-responses", user?.id, scaleCode ?? "all"],
    enabled: !!user,
    queryFn: async (): Promise<ScaleResponse[]> => {
      let q = supabase
        .from("emotional_scale_responses" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("taken_at", { ascending: false });
      if (scaleCode) q = q.eq("scale_code", scaleCode);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

/**
 * Returns the codes of active ISEU-weighted scales the current user has NOT yet answered
 * (within the 180-day ISEU window). When empty, the ISEU-RBE can be computed.
 */
export function useMissingIseuScales() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["iseu-missing-scales", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const [scalesRes, respRes] = await Promise.all([
        supabase
          .from("emotional_scales" as any)
          .select("code")
          .eq("active", true)
          .gt("iseu_weight", 0),
        supabase
          .from("emotional_scale_responses" as any)
          .select("scale_code, taken_at")
          .eq("user_id", user!.id)
          .gte("taken_at", new Date(Date.now() - 180 * 86_400_000).toISOString()),
      ]);
      if (scalesRes.error) throw scalesRes.error;
      if (respRes.error) throw respRes.error;
      const answered = new Set(((respRes.data as any[]) ?? []).map((r) => r.scale_code));
      return ((scalesRes.data as any[]) ?? [])
        .map((s) => s.code as string)
        .filter((code) => !answered.has(code));
    },
  });
}

export function useLatestResponseByScale() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scale-responses-latest", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Record<string, ScaleResponse>> => {
      const { data, error } = await supabase
        .from("emotional_scale_responses" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("taken_at", { ascending: false });
      if (error) throw error;
      const out: Record<string, ScaleResponse> = {};
      for (const r of (data as any[]) ?? []) {
        if (!out[r.scale_code]) out[r.scale_code] = r as ScaleResponse;
      }
      return out;
    },
  });
}

export function useIseuHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["iseu-history", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<IseuScore[]> => {
      const { data, error } = await supabase
        .from("iseu_scores" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("computed_at", { ascending: true });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useSubmitScaleResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { scale_code: string; answers: number[]; force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("submit-scale-response", {
        body: payload,
      });
      if (error) {
        const ctx: any = (error as any).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const parsed = await ctx.json();
            throw Object.assign(
              new Error(parsed.message || parsed.error || error.message),
              { details: parsed }
            );
          } catch (e: any) {
            if (e?.details) throw e;
          }
        }
        throw error;
      }
      return data as { response: ScaleResponse; iseu: IseuScore | null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scale-responses"] });
      queryClient.invalidateQueries({ queryKey: ["scale-responses-latest"] });
      queryClient.invalidateQueries({ queryKey: ["iseu-history"] });
      queryClient.invalidateQueries({ queryKey: ["iseu-missing-scales"] });
    },
  });
}

export const ISEU_BAND_LABEL: Record<IseuScore["band"], string> = {
  verde: "Equilíbrio",
  amarelo: "Atenção leve",
  laranja: "Risco moderado",
  vermelho: "Risco elevado",
};

export const ISEU_BAND_COLOR: Record<IseuScore["band"], string> = {
  verde: "hsl(var(--success))",
  amarelo: "hsl(var(--warning))",
  laranja: "hsl(var(--chart-4))",
  vermelho: "hsl(var(--destructive))",
};

// Maps a scale-specific severity label to one of the ISEU bands for consistent coloring.
export function severityBand(scaleCode: string, severity: string): IseuScore["band"] {
  const s = (severity || "").toLowerCase();
  switch (scaleCode) {
    case "WHO5":
      if (s.includes("adequado") || s === "ótimo") return "verde";
      if (s === "bom") return "amarelo";
      if (s.includes("muito baixo")) return "vermelho";
      if (s.includes("baixo")) return "laranja";
      return "vermelho";
    case "PHQ9":
      if (s.includes("mínimo") || s.includes("mínimos")) return "verde";
      if (s.includes("moderadamente grave")) return "vermelho";
      if (s.includes("leve")) return "amarelo";
      if (s.includes("moderado")) return "laranja";
      return "vermelho";
    case "GAD7":
      if (s.includes("mínima") || s.includes("mínimo")) return "verde";
      if (s.includes("leve")) return "amarelo";
      if (s.includes("moderada") || s.includes("moderado")) return "laranja";
      return "vermelho";
    case "PSS10":
      if (s.includes("alto")) return "vermelho";
      if (s.includes("moderado")) return "amarelo";
      if (s.includes("baixo")) return "verde";
      return "amarelo";
    case "ISI":
      if (s.includes("sem insônia")) return "verde";
      if (s.includes("subclínica") || s.includes("subliminar")) return "amarelo";
      if (s.includes("severa")) return "vermelho";
      if (s.includes("moderada")) return "laranja";
      return "vermelho";
    case "MHCSF":
      if (s === "florescimento") return "verde";
      if (s === "moderado") return "amarelo";
      return "vermelho";
    default:
      return "amarelo";
  }
}

// Which scales measure "positive health" vs "symptoms/risk"
export const POSITIVE_SCALES = new Set(["WHO5", "MHCSF"]);

