/**
 * Taxonomia emocional curatorial (Roda das Emocoes - 3 niveis).
 * Conteudo definido pela curadoria da Rede Bem-Estar. Nao alterar sem indicacao explicita.
 */
import type { EmotionFamily, EmotionNode } from "../domain/types";

export const TAXONOMY_VERSION = "rbe-emotion-taxonomy-1.0.0";

export const EMOTION_FAMILIES: EmotionFamily[] = [
  {
    id: "raiva",
    label: "Raiva",
    level: 1,
    color: "#EF6A78",
    children: [
      {
        id: "raiva_dor",
        label: "Dor",
        level: 2,
        children: [{ id: "raiva_dor_envergonhado", label: "Envergonhado", level: 3 }, { id: "raiva_dor_devastado", label: "Devastado", level: 3 }],
      },
      {
        id: "raiva_ameacado",
        label: "Ameaçado",
        level: 2,
        children: [{ id: "raiva_ameacado_inseguro", label: "Inseguro", level: 3 }, { id: "raiva_ameacado_ciumento", label: "Ciumento", level: 3 }],
      },
      {
        id: "raiva_odioso",
        label: "Odioso",
        level: 2,
        children: [{ id: "raiva_odioso_ressentido", label: "Ressentido", level: 3 }, { id: "raiva_odioso_violado", label: "Violado", level: 3 }],
      },
      {
        id: "raiva_bravo",
        label: "Bravo",
        level: 2,
        children: [{ id: "raiva_bravo_furioso", label: "Furioso", level: 3 }, { id: "raiva_bravo_enraivecido", label: "Enraivecido", level: 3 }],
      },
      {
        id: "raiva_agressivo",
        label: "Agressivo",
        level: 2,
        children: [{ id: "raiva_agressivo_provocado", label: "Provocado", level: 3 }, { id: "raiva_agressivo_hostil", label: "Hostil", level: 3 }],
      },
      {
        id: "raiva_frustrado",
        label: "Frustrado",
        level: 2,
        children: [{ id: "raiva_frustrado_enfurecido", label: "Enfurecido", level: 3 }, { id: "raiva_frustrado_irritado", label: "Irritado", level: 3 }],
      },
      {
        id: "raiva_distante",
        label: "Distante",
        level: 2,
        children: [{ id: "raiva_distante_arredio", label: "Arredio", level: 3 }, { id: "raiva_distante_desconfiado", label: "Desconfiado", level: 3 }],
      },
      {
        id: "raiva_critico",
        label: "Crítico",
        level: 2,
        children: [{ id: "raiva_critico_cetico", label: "Cético", level: 3 }, { id: "raiva_critico_sarcastico", label: "Sarcástico", level: 3 }],
      },
    ],
  },
  {
    id: "nojo",
    label: "Nojo",
    level: 1,
    color: "#57C9BF",
    children: [
      {
        id: "nojo_desaprovacao",
        label: "Desaprovação",
        level: 2,
        children: [{ id: "nojo_desaprovacao_julgador", label: "Julgador", level: 3 }, { id: "nojo_desaprovacao_aversao", label: "Aversão", level: 3 }],
      },
      {
        id: "nojo_desapontado",
        label: "Desapontado",
        level: 2,
        children: [{ id: "nojo_desapontado_repugnancia", label: "Repugnância", level: 3 }, { id: "nojo_desapontado_revoltado", label: "Revoltado", level: 3 }],
      },
      {
        id: "nojo_medonho",
        label: "Medonho",
        level: 2,
        children: [{ id: "nojo_medonho_asco", label: "Asco", level: 3 }, { id: "nojo_medonho_detestavel", label: "Detestável", level: 3 }],
      },
      {
        id: "nojo_esquiva",
        label: "Esquiva",
        level: 2,
        children: [{ id: "nojo_esquiva_antipatia", label: "Antipatia", level: 3 }, { id: "nojo_esquiva_hesitante", label: "Hesitante", level: 3 }],
      },
    ],
  },
  {
    id: "tristeza",
    label: "Tristeza",
    level: 1,
    color: "#6FA9E8",
    children: [
      {
        id: "tristeza_culpa",
        label: "Culpa",
        level: 2,
        children: [{ id: "tristeza_culpa_remorso", label: "Remorso", level: 3 }, { id: "tristeza_culpa_envergonhado", label: "Envergonhado", level: 3 }],
      },
      {
        id: "tristeza_abandonado",
        label: "Abandonado",
        level: 2,
        children: [{ id: "tristeza_abandonado_ignorado", label: "Ignorado", level: 3 }, { id: "tristeza_abandonado_vitimado", label: "Vitimado", level: 3 }],
      },
      {
        id: "tristeza_desespero",
        label: "Desespero",
        level: 2,
        children: [{ id: "tristeza_desespero_impotente", label: "Impotente", level: 3 }, { id: "tristeza_desespero_vulneravel", label: "Vulnerável", level: 3 }],
      },
      {
        id: "tristeza_depressivo",
        label: "Depressivo",
        level: 2,
        children: [{ id: "tristeza_depressivo_inferior", label: "Inferior", level: 3 }, { id: "tristeza_depressivo_vazio", label: "Vazio", level: 3 }],
      },
      {
        id: "tristeza_solitario",
        label: "Solitário",
        level: 2,
        children: [{ id: "tristeza_solitario_perdido", label: "Perdido", level: 3 }, { id: "tristeza_solitario_isolado", label: "Isolado", level: 3 }],
      },
      {
        id: "tristeza_entediado",
        label: "Entediado",
        level: 2,
        children: [{ id: "tristeza_entediado_apatico", label: "Apático", level: 3 }, { id: "tristeza_entediado_indiferente", label: "Indiferente", level: 3 }],
      },
    ],
  },
  {
    id: "alegria",
    label: "Alegria",
    level: 1,
    color: "#F3CA63",
    children: [
      {
        id: "alegria_contente",
        label: "Contente",
        level: 2,
        children: [{ id: "alegria_contente_liberto", label: "Liberto", level: 3 }, { id: "alegria_contente_estetico", label: "Estético", level: 3 }],
      },
      {
        id: "alegria_interessado",
        label: "Interessado",
        level: 2,
        children: [{ id: "alegria_interessado_divertido", label: "Divertido", level: 3 }, { id: "alegria_interessado_inquisitivo", label: "Inquisitivo", level: 3 }],
      },
      {
        id: "alegria_orgulhoso",
        label: "Orgulhoso",
        level: 2,
        children: [{ id: "alegria_orgulhoso_importante", label: "Importante", level: 3 }, { id: "alegria_orgulhoso_confiante", label: "Confiante", level: 3 }],
      },
      {
        id: "alegria_aceito",
        label: "Aceito",
        level: 2,
        children: [{ id: "alegria_aceito_respeitado", label: "Respeitado", level: 3 }, { id: "alegria_aceito_realizado", label: "Realizado", level: 3 }],
      },
      {
        id: "alegria_poderoso",
        label: "Poderoso",
        level: 2,
        children: [{ id: "alegria_poderoso_corajoso", label: "Corajoso", level: 3 }, { id: "alegria_poderoso_provocante", label: "Provocante", level: 3 }],
      },
      {
        id: "alegria_pacificador",
        label: "Pacificador",
        level: 2,
        children: [{ id: "alegria_pacificador_amoroso", label: "Amoroso", level: 3 }, { id: "alegria_pacificador_esperancoso", label: "Esperançoso", level: 3 }],
      },
      {
        id: "alegria_intimo",
        label: "Íntimo",
        level: 2,
        children: [{ id: "alegria_intimo_sensivel", label: "Sensível", level: 3 }, { id: "alegria_intimo_brincalhao", label: "Brincalhão", level: 3 }],
      },
      {
        id: "alegria_otimista",
        label: "Otimista",
        level: 2,
        children: [{ id: "alegria_otimista_aberto", label: "Aberto", level: 3 }, { id: "alegria_otimista_inspirado", label: "Inspirado", level: 3 }],
      },
    ],
  },
  {
    id: "surpresa",
    label: "Surpresa",
    level: 1,
    color: "#9F7DDD",
    children: [
      {
        id: "surpresa_assustado",
        label: "Assustado",
        level: 2,
        children: [{ id: "surpresa_assustado_chocado", label: "Chocado", level: 3 }, { id: "surpresa_assustado_desanimado", label: "Desanimado", level: 3 }],
      },
      {
        id: "surpresa_confuso",
        label: "Confuso",
        level: 2,
        children: [{ id: "surpresa_confuso_desiludido", label: "Desiludido", level: 3 }, { id: "surpresa_confuso_perplexo", label: "Perplexo", level: 3 }],
      },
      {
        id: "surpresa_espantado",
        label: "Espantado",
        level: 2,
        children: [{ id: "surpresa_espantado_abismado", label: "Abismado", level: 3 }, { id: "surpresa_espantado_boquiaberto", label: "Boquiaberto", level: 3 }],
      },
      {
        id: "surpresa_animado",
        label: "Animado",
        level: 2,
        children: [{ id: "surpresa_animado_irado", label: "Irado", level: 3 }, { id: "surpresa_animado_energetico", label: "Energético", level: 3 }],
      },
    ],
  },
  {
    id: "medo",
    label: "Medo",
    level: 1,
    color: "#E69AC1",
    children: [
      {
        id: "medo_humilhado",
        label: "Humilhado",
        level: 2,
        children: [{ id: "medo_humilhado_ridicularizado", label: "Ridicularizado", level: 3 }, { id: "medo_humilhado_desrespeitoso", label: "Desrespeitoso", level: 3 }],
      },
      {
        id: "medo_rejeitado",
        label: "Rejeitado",
        level: 2,
        children: [{ id: "medo_rejeitado_alienado", label: "Alienado", level: 3 }, { id: "medo_rejeitado_inadequado", label: "Inadequado", level: 3 }],
      },
      {
        id: "medo_submisso",
        label: "Submisso",
        level: 2,
        children: [{ id: "medo_submisso_insignificante", label: "Insignificante", level: 3 }, { id: "medo_submisso_desvalorizado", label: "Desvalorizado", level: 3 }],
      },
      {
        id: "medo_inseguro",
        label: "Inseguro",
        level: 2,
        children: [{ id: "medo_inseguro_inferior", label: "Inferior", level: 3 }, { id: "medo_inseguro_inadequado", label: "Inadequado", level: 3 }],
      },
      {
        id: "medo_ansioso",
        label: "Ansioso",
        level: 2,
        children: [{ id: "medo_ansioso_preocupado", label: "Preocupado", level: 3 }, { id: "medo_ansioso_sobrecarregado", label: "Sobrecarregado", level: 3 }],
      },
      {
        id: "medo_nervoso",
        label: "Nervoso",
        level: 2,
        children: [{ id: "medo_nervoso_assustado", label: "Assustado", level: 3 }, { id: "medo_nervoso_aterrorizado", label: "Aterrorizado", level: 3 }],
      },
    ],
  },
];

export type FlatEmotionNode = EmotionNode & {
  familyId: string;
  parentId: string | null;
};

const flat: Record<string, FlatEmotionNode> = {};
for (const family of EMOTION_FAMILIES) {
  flat[family.id] = { ...family, familyId: family.id, parentId: null };
  for (const l2 of family.children ?? []) {
    flat[l2.id] = { ...l2, familyId: family.id, parentId: family.id };
    for (const l3 of l2.children ?? []) {
      flat[l3.id] = { ...l3, familyId: family.id, parentId: l2.id };
    }
  }
}

export const EMOTION_INDEX = flat;

export const getEmotionNode = (id: string | null | undefined): FlatEmotionNode | null =>
  (id && flat[id]) || null;

export const getEmotionPath = (id: string | null | undefined): FlatEmotionNode[] => {
  const node = getEmotionNode(id);
  if (!node) return [];
  const chain: FlatEmotionNode[] = [node];
  let cursor = node;
  while (cursor.parentId) {
    const parent = flat[cursor.parentId];
    if (!parent) break;
    chain.unshift(parent);
    cursor = parent;
  }
  return chain;
};

export const getFamilyOf = (id: string | null | undefined): EmotionFamily | null => {
  const node = getEmotionNode(id);
  if (!node) return null;
  return EMOTION_FAMILIES.find((f) => f.id === node.familyId) ?? null;
};

/** Lista plana (niveis 2 e 3) para a alternativa acessivel em lista/busca. */
export const SELECTABLE_EMOTIONS: FlatEmotionNode[] = Object.values(flat).filter(
  (n) => n.level > 1
);
