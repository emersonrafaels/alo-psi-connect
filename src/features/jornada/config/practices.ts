/**
 * Practice Registry curatorial.
 * Somente práticas com status "active" e curadoria aprovada podem ser recomendadas,
 * salvo autorização explícita em ALLOW_NON_ACTIVE_PRACTICE_IDS.
 */
import type { Practice } from "../domain/types";

export const PRACTICES_VERSION = "rbe-practices-1.0.0";

export const CURATOR = {
  id: "curadoria_anne_kaufmann",
  name: "Anne Kaufmann",
  role: "Curadoria das práticas",
  note: "Orientações e protocolos revisados para a experiência da Rede Bem-Estar.",
};

/** Práticas em revisão liberadas explicitamente para recomendação. */
export const ALLOW_NON_ACTIVE_PRACTICE_IDS: string[] = [];

export const PRACTICES: Practice[] = [
  {
    id: "suspiro_alivio",
    version: "1.0.0",
    slug: "suspiro-de-alivio",
    title: "Suspiro de Alívio",
    category: "breathwork",
    categoryLabel: "Respiração",
    playerType: "breathing",
    status: "active",
    description:
      "Uma técnica breve para reduzir tensão e criar uma pequena pausa antes de responder.",
    durations: [2, 3],
    protocolId: "protocolo_suspiro_alivio",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "≋",
    benefits: [
      "Reduzir ativação imediata",
      "Criar espaço antes de agir",
      "Retomar a respiração natural",
    ],
    safetyInstructions: [
      "Respire de forma confortável, sem forçar.",
      "Interrompa se sentir tontura ou desconforto.",
    ],
  },
  {
    id: "pausa_3_minutos",
    version: "1.0.0",
    slug: "pausa-de-3-minutos",
    title: "Pausa de 3 Minutos",
    category: "awareness",
    categoryLabel: "Consciência",
    playerType: "awareness",
    status: "active",
    description:
      "Uma pausa estruturada para observar o momento, respirar naturalmente e ampliar a consciência.",
    durations: [3, 5],
    protocolId: "protocolo_pausa_3_minutos",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "❀",
    benefits: [
      "Interromper o piloto automático",
      "Observar corpo e pensamentos",
      "Retomar o que importa",
    ],
    safetyInstructions: [
      "Não é necessário modificar a respiração.",
      "Encontre uma posição estável e confortável.",
    ],
  },
  {
    id: "grounding_5_4_3_2_1",
    version: "1.0.0",
    slug: "grounding-5-4-3-2-1",
    title: "Grounding 5-4-3-2-1",
    category: "grounding",
    categoryLabel: "Aterramento",
    playerType: "grounding",
    status: "active",
    description:
      "Uma prática sensorial para voltar ao presente por meio do corpo e do ambiente.",
    durations: [3, 5],
    protocolId: "protocolo_grounding_54321",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "✋",
    benefits: ["Redirecionar a atenção", "Aumentar presença", "Reduzir desorientação"],
    safetyInstructions: [
      "Faça no seu ritmo.",
      "Se algum sentido estiver desconfortável, pule a etapa e continue.",
    ],
  },
  {
    id: "respiracao_lenta_ritmada",
    version: "1.0.0",
    slug: "respiracao-lenta-ritmada",
    title: "Respiração Lenta e Ritmada",
    category: "breathwork",
    categoryLabel: "Respiração",
    playerType: "breathing",
    status: "active",
    description:
      "Uma respiração confortável e ritmada para diminuir gradualmente a ativação.",
    durations: [5, 8],
    protocolId: "protocolo_respiracao_lenta",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "∿",
    benefits: ["Desacelerar o ritmo", "Reduzir tensão corporal", "Recuperar clareza"],
    safetyInstructions: [
      "Não respire o mais fundo possível: mantenha um ritmo confortável.",
      "Interrompa se sentir tontura ou desconforto.",
    ],
  },
  {
    id: "respiracao_quatro_etapas",
    version: "1.0.0",
    slug: "respiracao-quatro-etapas",
    title: "Respiração em Quatro Etapas",
    category: "breathwork",
    categoryLabel: "Respiração",
    playerType: "breathing",
    status: "active",
    description:
      "Uma sequência guiada que organiza atenção e ritmo respiratório em quatro momentos.",
    durations: [4, 6],
    protocolId: "protocolo_respiracao_quatro_etapas",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "□",
    benefits: ["Organizar a atenção", "Criar ritmo", "Apoiar foco e presença"],
    safetyInstructions: [
      "Mantenha cada etapa confortável.",
      "Não prolongue nem retenha o ar além do que for natural para você.",
    ],
  },
  {
    id: "coerencia_cardiaca",
    version: "1.0.0",
    slug: "coerencia-cardiaca",
    title: "Coerência Cardíaca",
    category: "breathwork",
    categoryLabel: "Respiração guiada",
    playerType: "breathing",
    status: "active",
    description:
      "Uma prática ritmada de regulação que utiliza uma animação para acompanhar a respiração.",
    durations: [5],
    protocolId: "protocolo_coerencia_cardiaca",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "♡",
    benefits: ["Regular ativação", "Aumentar foco e presença", "Favorecer equilíbrio emocional"],
    safetyInstructions: ["Acompanhe a animação sem forçar a respiração."],
  },
  {
    id: "nomear_acolher",
    version: "1.0.0",
    slug: "nomear-e-acolher",
    title: "Nomear e Acolher",
    category: "awareness",
    categoryLabel: "Acolhimento",
    playerType: "awareness",
    status: "active",
    description:
      "Uma prática para reconhecer a emoção, perceber como ela aparece e acolhê-la sem tentar eliminá-la imediatamente.",
    durations: [4, 6],
    protocolId: "protocolo_nomear_acolher",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "♡",
    benefits: [
      "Ampliar vocabulário emocional",
      "Reduzir luta com a emoção",
      "Identificar necessidades",
    ],
    safetyInstructions: [
      "A prática não exige aprofundamento.",
      "Você pode encerrar a qualquer momento e escolher outro recurso.",
    ],
  },
  {
    id: "saborear_momento",
    version: "1.0.0",
    slug: "saborear-o-momento",
    title: "Saborear o Momento",
    category: "positive",
    categoryLabel: "Bem-estar positivo",
    playerType: "awareness",
    status: "active",
    description:
      "Uma prática breve para perceber, guardar e fortalecer uma experiência positiva.",
    durations: [2, 3],
    protocolId: "protocolo_saborear_momento",
    audioAvailable: false,
    silentModeAvailable: true,
    curatorId: CURATOR.id,
    icon: "✦",
    benefits: [
      "Reconhecer fatores protetivos",
      "Guardar uma experiência positiva",
      "Aumentar consciência do que faz bem",
    ],
    safetyInstructions: ["Não é necessário intensificar a emoção: apenas observe o que já está presente."],
  },
];

export const PRACTICE_INDEX: Record<string, Practice> = Object.fromEntries(
  PRACTICES.map((p) => [p.id, p])
);

export const getPractice = (id: string | null | undefined): Practice | null =>
  (id && PRACTICE_INDEX[id]) || null;

export const isRecommendable = (practice: Practice | null | undefined): boolean => {
  if (!practice) return false;
  if (practice.status === "active") return true;
  return ALLOW_NON_ACTIVE_PRACTICE_IDS.includes(practice.id);
};
