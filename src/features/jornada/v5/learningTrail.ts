/**
 * Seleção do recurso de aprendizagem.
 *
 * Base: trilha de aprendizagem — o próximo recurso que a pessoa ainda não conheceu,
 * que caiba no tempo disponível. Ajustes: intensidade registrada (quanto mais alta,
 * mais curto e mais corporal) e histórico de utilidade da própria pessoa.
 * A emoção escolhida na roda NÃO determina a seleção — só entra como desempate final.
 */
import { PRACTICES, getPractice } from "../config/practices";
import { getProtocol } from "../config/practice-protocols";
import type { Practice } from "../domain/types";

export interface KnownPractice {
  practice_id: string;
  times_seen: number;
  avg_usefulness: number | null;
  last_at: string | null;
}

export interface LearningPick {
  practice: Practice;
  reason: string;
  isNew: boolean;
  timesSeen: number;
}

const isPlayable = (practice: Practice) =>
  practice.status === "active" && !!getProtocol(practice.protocolId);

/** Ordem curatorial da trilha: do mais simples ao mais elaborado. */
const TRAIL_ORDER = [
  "nomear_acolher",
  "suspiro_alivio",
  "respiracao_lenta_ritmada",
  "grounding_5_4_3_2_1",
  "pausa_3_minutos",
  "coerencia_cardiaca",
  "respiracao_quatro_etapas",
  "saborear_momento",
];

const trailRank = (id: string) => {
  const index = TRAIL_ORDER.indexOf(id);
  return index === -1 ? TRAIL_ORDER.length : index;
};

export interface LearningInput {
  known: KnownPractice[];
  /** Maior intensidade registrada na sessão (1 a 5). */
  peakIntensity: number | null;
  /** Minutos que a pessoa tem disponível. */
  availableMinutes?: number;
  /** Recursos dispensados nesta sessão. */
  rejectedIds?: string[];
}

export const selectLearningResource = ({
  known,
  peakIntensity,
  availableMinutes = 5,
  rejectedIds = [],
}: LearningInput): LearningPick | null => {
  const knownMap = new Map(known.map((row) => [row.practice_id, row]));

  const candidates = PRACTICES.filter(
    (practice) =>
      isPlayable(practice) &&
      !rejectedIds.includes(practice.id) &&
      Math.min(...practice.durations) <= availableMinutes
  );

  if (!candidates.length) return null;

  const high = (peakIntensity ?? 3) >= 4;

  const scored = candidates.map((practice) => {
    const row = knownMap.get(practice.id);
    const timesSeen = row?.times_seen ?? 0;
    let score = 0;

    // 1. trilha: recurso novo tem prioridade
    score += timesSeen === 0 ? 100 : Math.max(0, 40 - timesSeen * 8);

    // 2. posição na trilha curatorial
    score += (TRAIL_ORDER.length - trailRank(practice.id)) * 4;

    // 3. tempo disponível: quanto mais curto cabe melhor
    score += Math.max(0, 10 - Math.min(...practice.durations) * 2);

    // 4. intensidade alta favorece respiração e ancoragem curtas
    if (high && (practice.category === "breathwork" || practice.category === "grounding")) {
      score += 18;
    }
    if (!high && (practice.category === "awareness" || practice.category === "positive")) {
      score += 8;
    }

    // 5. histórico de utilidade da própria pessoa
    if (row?.avg_usefulness != null) score += (row.avg_usefulness - 3) * 10;

    return { practice, score, timesSeen };
  });

  scored.sort((a, b) => b.score - a.score || trailRank(a.practice.id) - trailRank(b.practice.id));
  const best = scored[0];

  const parts: string[] = [];
  parts.push(
    best.timesSeen === 0
      ? "Ela é o próximo recurso da sua trilha de aprendizagem"
      : `Você já conheceu esta prática ${best.timesSeen}${best.timesSeen === 1 ? " vez" : " vezes"} e ela ajudou`
  );
  parts.push(`cabe em ${Math.min(...best.practice.durations)} minutos`);
  if (high) parts.push("e é mais corporal, o que costuma ajudar quando a intensidade está alta");
  const reason = `${parts.join(", ")}. Não foi escolhida por causa de uma emoção específica.`;

  return {
    practice: best.practice,
    reason,
    isNew: best.timesSeen === 0,
    timesSeen: best.timesSeen,
  };
};

/** Prática curta usada na pausa opcional de regulação imediata. */
export const IMMEDIATE_PAUSE_PRACTICE_ID = "coerencia_cardiaca";

export const getImmediatePausePractice = () =>
  getPractice(IMMEDIATE_PAUSE_PRACTICE_ID) ?? getPractice("suspiro_alivio");
