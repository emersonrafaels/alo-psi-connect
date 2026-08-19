/** Opções curatoriais de mudança percebida (checkout). Não presumem melhora. */
import type { OptionItem } from "../domain/types";

export const PERCEIVED_CHANGE_VERSION = "rbe-perceived-change-1.0.0";

export const PERCEIVED_CHANGE_OPTIONS: OptionItem[] = [
  { id: "corpo_desacelerou", label: "Meu corpo desacelerou" },
  { id: "pensamentos_claros", label: "Meus pensamentos estão mais claros" },
  { id: "mais_atencao", label: "Consigo prestar mais atenção" },
  { id: "intensidade_diminuiu", label: "A intensidade diminuiu" },
  { id: "sem_mudanca", label: "Não percebi mudança" },
  { id: "estou_pior", label: "Estou pior" },
  { id: "outro", label: "Outro" },
];

export const INTENSITY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Pouco",
  2: "Leve",
  3: "Moderado",
  4: "Forte",
  5: "Muito forte",
};

/** Utilidade percebida — não é avaliação comercial por estrelas. */
export const USEFULNESS_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Não me ajudou",
  2: "Ajudou pouco",
  3: "Ajudou um pouco",
  4: "Ajudou",
  5: "Ajudou muito",
};

export const EMOTION_STILL_SAME_OPTIONS: OptionItem[] = [
  { id: "sim", label: "Sim" },
  { id: "mudou_um_pouco", label: "Mudou um pouco" },
];
