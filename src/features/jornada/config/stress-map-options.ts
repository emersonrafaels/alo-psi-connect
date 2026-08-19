/** Opções curatoriais do Mapa do Estresse. */
import type { OptionItem } from "../domain/types";

export const STRESS_MAP_VERSION = "rbe-stress-map-1.0.0";

export const STRESS_SOURCES: OptionItem[] = [
  { id: "estudos", label: "Estudos" },
  { id: "trabalho", label: "Trabalho" },
  { id: "relacoes", label: "Relações" },
  { id: "financas", label: "Finanças" },
  { id: "saude_rotina", label: "Saúde e rotina" },
  { id: "outro", label: "Outro" },
];

export const BODY_REACTIONS: OptionItem[] = [
  { id: "coracao_acelerado", label: "Coração acelerado" },
  { id: "tensao_muscular", label: "Tensão muscular" },
  { id: "respiracao_curta", label: "Respiração curta" },
  { id: "cansaco", label: "Cansaço" },
  { id: "no_garganta", label: "Nó na garganta" },
  { id: "sem_percepcao", label: "Nenhuma percepção clara" },
];

export const BEHAVIORS: OptionItem[] = [
  { id: "evitei", label: "Evitei a situação" },
  { id: "impulsivo", label: "Respondi impulsivamente" },
  { id: "afastei", label: "Me afastei" },
  { id: "resolvi_imediato", label: "Tentei resolver imediatamente" },
  { id: "pedi_ajuda", label: "Pedi ajuda" },
  { id: "nao_sei", label: "Não sei dizer" },
];
