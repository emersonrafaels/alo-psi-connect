/** Vocabulário curatorial da Roda das Emoções — versão V11 validada. */
import type { EmotionFamily, EmotionNode } from "../domain/types";

export const TAXONOMY_VERSION = "rbe-emotion-taxonomy-v11";

const leaf = (id: string, label: string): EmotionNode => ({ id, label, level: 3 });
const branch = (id: string, label: string, children: EmotionNode[]): EmotionNode => ({ id, label, level: 2, children });

export const EMOTION_FAMILIES: EmotionFamily[] = [
  { id: "raiva", label: "Raiva", level: 1, color: "#e8647d", valence: "unpleasant", children: [
    branch("raiva_irritado", "Irritado", [leaf("raiva_irritado_frustrado", "Frustrado"), leaf("raiva_irritado_impaciente", "Impaciente")]),
    branch("raiva_magoado", "Magoado", [leaf("raiva_magoado_ressentido", "Ressentido"), leaf("raiva_magoado_provocado", "Provocado")]),
  ] },
  { id: "tristeza", label: "Tristeza", level: 1, color: "#718fda", valence: "unpleasant", children: [
    branch("tristeza_desanimado", "Desanimado", [leaf("tristeza_desanimado_solitario", "Solitário"), leaf("tristeza_desanimado_desesperancoso", "Desesperançoso")]),
    branch("tristeza_vulneravel", "Vulnerável", [leaf("tristeza_vulneravel_sensivel", "Sensível"), leaf("tristeza_vulneravel_impotente", "Impotente")]),
  ] },
  { id: "medo", label: "Medo", level: 1, color: "#906bc4", valence: "unpleasant", children: [
    branch("medo_ansioso", "Ansioso", [leaf("medo_ansioso_preocupado", "Preocupado"), leaf("medo_ansioso_sobrecarregado", "Sobrecarregado")]),
    branch("medo_inseguro", "Inseguro", [leaf("medo_inseguro_inadequado", "Inadequado"), leaf("medo_inseguro_assustado", "Assustado")]),
  ] },
  { id: "alegria", label: "Alegria", level: 1, color: "#e7bd45", valence: "pleasant", children: [
    branch("alegria_contente", "Contente", [leaf("alegria_contente_animado", "Animado"), leaf("alegria_contente_otimista", "Otimista")]),
    branch("alegria_conectado", "Conectado", [leaf("alegria_conectado_agradecido", "Agradecido"), leaf("alegria_conectado_acolhido", "Acolhido")]),
  ] },
  { id: "forca", label: "Força", level: 1, color: "#39a9b7", valence: "pleasant", children: [
    branch("forca_confiante", "Confiante", [leaf("forca_confiante_corajoso", "Corajoso"), leaf("forca_confiante_determinado", "Determinado")]),
    branch("forca_capaz", "Capaz", [leaf("forca_capaz_valorizado", "Valorizado"), leaf("forca_capaz_respeitado", "Respeitado")]),
  ] },
  { id: "tranquilidade", label: "Tranquilidade", level: 1, color: "#65ad83", valence: "pleasant", children: [
    branch("tranquilidade_calmo", "Calmo", [leaf("tranquilidade_calmo_aliviado", "Aliviado"), leaf("tranquilidade_calmo_seguro", "Seguro")]),
    branch("tranquilidade_presente", "Presente", [leaf("tranquilidade_presente_centrado", "Centrado"), leaf("tranquilidade_presente_satisfeito", "Satisfeito")]),
  ] },
];

export type FlatEmotionNode = EmotionNode & { familyId: string; parentId: string | null };
const flat: Record<string, FlatEmotionNode> = {};
for (const family of EMOTION_FAMILIES) {
  flat[family.id] = { ...family, familyId: family.id, parentId: null };
  for (const level2 of family.children) {
    flat[level2.id] = { ...level2, familyId: family.id, parentId: family.id };
    for (const level3 of level2.children ?? []) {
      flat[level3.id] = { ...level3, familyId: family.id, parentId: level2.id };
    }
  }
}

export const EMOTION_INDEX = flat;
export const getEmotionNode = (id: string | null | undefined): FlatEmotionNode | null => (id && flat[id]) || null;
export const getEmotionPath = (id: string | null | undefined): FlatEmotionNode[] => {
  const node = getEmotionNode(id);
  if (!node) return [];
  const chain = [node];
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
  return node ? EMOTION_FAMILIES.find((family) => family.id === node.familyId) ?? null : null;
};
export const SELECTABLE_EMOTIONS: FlatEmotionNode[] = Object.values(flat).filter((node) => node.level === 3);