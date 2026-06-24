import type { EmotionalScale, EmotionalScaleItem, ScaleResponse } from "@/hooks/useEmotionalScales";

export interface LocalScaleResult {
  response: Pick<
    ScaleResponse,
    "raw_score" | "normalized_score" | "severity" | "subscale_scores" | "answers" | "scale_code" | "taken_at"
  >;
  iseu: null;
  missing_scales: string[];
}

/**
 * Client-side mirror of the scoring logic in
 * supabase/functions/submit-scale-response/index.ts.
 * Used for guest (unauthenticated) responses — results are not persisted.
 */
export function computeScaleResult(
  scale: EmotionalScale,
  items: EmotionalScaleItem[],
  answers: number[],
): LocalScaleResult {
  const reverseSet = new Set<number>(scale.reverse_items ?? []);
  const scored = answers.map((v, i) =>
    reverseSet.has(i + 1) ? scale.item_max - v + scale.item_min : v,
  );
  const rawScore = scored.reduce((a, b) => a + b, 0);

  const maxRaw = scale.item_max * answers.length;
  const minRaw = scale.item_min * answers.length;
  const range = maxRaw - minRaw || 1;
  const rawPct = ((rawScore - minRaw) / range) * 100;
  const normalized = scale.iseu_direction === "positive" ? rawPct : 100 - rawPct;

  let subscaleScores: Record<string, { label: string; raw: number; normalized: number }> | null = null;
  if (scale.subscales && typeof scale.subscales === "object") {
    subscaleScores = {};
    for (const [key, def] of Object.entries(scale.subscales)) {
      const positions = def.items ?? [];
      if (positions.length === 0) continue;
      const sub = positions.reduce((acc, p) => acc + (scored[p - 1] ?? 0), 0);
      const subMax = scale.item_max * positions.length;
      const subMin = scale.item_min * positions.length;
      const subRange = subMax - subMin || 1;
      const subPct = ((sub - subMin) / subRange) * 100;
      const subNorm = scale.iseu_direction === "positive" ? subPct : 100 - subPct;
      subscaleScores[key] = {
        label: def.label,
        raw: sub,
        normalized: Number(subNorm.toFixed(2)),
      };
    }
  }

  let severity = "desconhecido";
  switch (scale.code) {
    case "WHO5":
      if (rawScore >= 18) severity = "Bem-estar adequado";
      else if (rawScore >= 13) severity = "Bem-estar baixo";
      else severity = "Bem-estar muito baixo";
      break;
    case "PHQ9":
      if (rawScore <= 4) severity = "Sintomas depressivos mínimos";
      else if (rawScore <= 9) severity = "Sintomas depressivos leves";
      else if (rawScore <= 14) severity = "Sintomas depressivos moderados";
      else if (rawScore <= 19) severity = "Sintomas depressivos moderadamente graves";
      else severity = "Sintomas depressivos graves";
      break;
    case "GAD7":
      if (rawScore <= 4) severity = "Ansiedade mínima";
      else if (rawScore <= 9) severity = "Ansiedade leve";
      else if (rawScore <= 14) severity = "Ansiedade moderada";
      else severity = "Ansiedade severa";
      break;
    case "PSS10":
      if (rawScore <= 13) severity = "Estresse percebido baixo";
      else if (rawScore <= 26) severity = "Estresse percebido moderado";
      else severity = "Estresse percebido alto";
      break;
    case "ISI":
      if (rawScore <= 7) severity = "Sem insônia significativa";
      else if (rawScore <= 14) severity = "Insônia subclínica";
      else if (rawScore <= 21) severity = "Insônia clínica moderada";
      else severity = "Insônia clínica severa";
      break;
    case "MHCSF": {
      const emoPositions = [1, 2, 3];
      const socPsyPositions = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      const highEmo = emoPositions.filter((p) => scored[p - 1] >= 4).length;
      const lowEmo = emoPositions.filter((p) => scored[p - 1] <= 1).length;
      const highSocPsy = socPsyPositions.filter((p) => scored[p - 1] >= 4).length;
      const lowSocPsy = socPsyPositions.filter((p) => scored[p - 1] <= 1).length;
      if (highEmo >= 1 && highSocPsy >= 6) severity = "florescimento";
      else if (lowEmo >= 1 && lowSocPsy >= 6) severity = "definhamento";
      else severity = "moderado";
      break;
    }
  }

  // Suppress unused warning while keeping the signature symmetric with the edge function
  void items;

  return {
    response: {
      raw_score: rawScore,
      normalized_score: Number(normalized.toFixed(2)),
      severity,
      subscale_scores: subscaleScores,
      answers,
      scale_code: scale.code,
      taken_at: new Date().toISOString(),
    },
    iseu: null,
    missing_scales: [],
  };
}
