import type { BodyMapLayer } from "./types";

export type BodySide = "front" | "back";
export type BodyZoneShape = "ellipse" | "path";

export type BodyZone = {
  id: string;
  label: string;
  side: BodySide;
  sideLabel: string;
  shape: BodyZoneShape;
  values: number[] | string;
};

export const BODY_SILHOUETTE =
  "M110 11c-21 0-34 16-34 38 0 17 8 30 20 36l-6 12-29 11c-12 5-17 16-19 30L29 235c-2 16 22 20 26 4l15-75 7 69 4 151c0 18 25 19 27 2l2-142 2 142c2 17 27 16 27-2l4-151 7-69 15 75c4 16 28 12 26-4l-13-97c-2-14-7-25-19-30l-29-11-6-12c12-6 20-19 20-36 0-22-13-38-34-38Z";

export const BODY_ZONES: BodyZone[] = [
  { id: "head_front", label: "Cabeça", side: "front", sideLabel: "frente", shape: "ellipse", values: [110, 42, 27, 31] },
  { id: "throat_front", label: "Garganta", side: "front", sideLabel: "frente", shape: "ellipse", values: [110, 84, 19, 13] },
  { id: "chest_front", label: "Peito", side: "front", sideLabel: "frente", shape: "ellipse", values: [110, 127, 43, 40] },
  { id: "abdomen_front", label: "Abdômen", side: "front", sideLabel: "frente", shape: "ellipse", values: [110, 189, 35, 36] },
  { id: "low_belly_front", label: "Baixo ventre", side: "front", sideLabel: "frente", shape: "ellipse", values: [110, 231, 31, 18] },
  { id: "shoulders_front", label: "Ombros", side: "front", sideLabel: "frente", shape: "path", values: "M68 100c14-8 28-9 42-8 14-1 28 0 42 8l-8 23c-21-8-47-8-68 0Z" },
  { id: "arms_front", label: "Braços", side: "front", sideLabel: "frente", shape: "path", values: "M66 105C48 110 43 133 40 166l-8 73c-1 12 19 14 22 2l15-72 12-51Z M154 105c18 5 23 28 26 61l8 73c1 12-19 14-22 2l-15-72-12-51Z" },
  { id: "hands_front", label: "Mãos", side: "front", sideLabel: "frente", shape: "path", values: "M31 237c-9 5-10 27 3 31 11 3 20-9 19-23Z M189 237c9 5 10 27-3 31-11 3-20-9-19-23Z" },
  { id: "legs_front", label: "Pernas", side: "front", sideLabel: "frente", shape: "path", values: "M76 225l7 160c1 13 23 13 25 0l2-145 2 145c2 13 24 13 25 0l7-160Z" },
  { id: "feet_front", label: "Pés", side: "front", sideLabel: "frente", shape: "path", values: "M82 382c-12 2-25 9-23 18 2 8 43 8 48 1l1-15Z M138 382c12 2 25 9 23 18-2 8-43 8-48 1l-1-15Z" },
  { id: "neck_back", label: "Nuca", side: "back", sideLabel: "costas", shape: "ellipse", values: [110, 82, 20, 16] },
  { id: "upper_back", label: "Costas altas", side: "back", sideLabel: "costas", shape: "ellipse", values: [110, 129, 43, 42] },
  { id: "lower_back", label: "Lombar", side: "back", sideLabel: "costas", shape: "ellipse", values: [110, 194, 35, 36] },
  { id: "shoulders_back", label: "Ombros", side: "back", sideLabel: "costas", shape: "path", values: "M68 100c14-8 28-9 42-8 14-1 28 0 42 8l-8 23c-21-8-47-8-68 0Z" },
  { id: "arms_back", label: "Braços", side: "back", sideLabel: "costas", shape: "path", values: "M66 105C48 110 43 133 40 166l-8 73c-1 12 19 14 22 2l15-72 12-51Z M154 105c18 5 23 28 26 61l8 73c1 12-19 14-22 2l-15-72-12-51Z" },
  { id: "hands_back", label: "Mãos", side: "back", sideLabel: "costas", shape: "path", values: "M31 237c-9 5-10 27 3 31 11 3 20-9 19-23Z M189 237c9 5 10 27-3 31-11 3-20-9-19-23Z" },
  { id: "legs_back", label: "Pernas", side: "back", sideLabel: "costas", shape: "path", values: "M76 225l7 160c1 13 23 13 25 0l2-145 2 145c2 13 24 13 25 0l7-160Z" },
  { id: "feet_back", label: "Pés", side: "back", sideLabel: "costas", shape: "path", values: "M82 382c-12 2-25 9-23 18 2 8 43 8 48 1l1-15Z M138 382c12 2 25 9 23 18-2 8-43 8-48 1l-1-15Z" },
];

export const BODY_REGION_OPTIONS = BODY_ZONES.map((zone) => ({
  id: zone.id,
  label: `${zone.label} - ${zone.sideLabel}`,
}));

export const getBodyZone = (id: string | null | undefined) =>
  id ? BODY_ZONES.find((zone) => zone.id === id) ?? null : null;

export const getBodyRegionLabel = (id: string | null | undefined) => {
  const zone = getBodyZone(id);
  return zone ? `${zone.label} - ${zone.sideLabel}` : null;
};

export const summarizeBodyLayerRegions = (layer: Pick<BodyMapLayer, "zoneIds">) =>
  layer.zoneIds
    .map((id) => getBodyZone(id)?.label)
    .filter(Boolean)
    .join(", ") || "Nenhuma região marcada";
