/**
 * Paisagem Emocional — coordenadas de valência e ativação.
 *
 * IMPORTANTE: estas coordenadas são definidas exclusivamente pela curadoria da
 * Rede Bem-Estar. Nada aqui deve ser inferido, estimado ou inventado pelo código.
 * Enquanto a curadoria não fornecer os valores, a lista permanece vazia e a
 * Paisagem Emocional exibe um estado de "aguardando curadoria".
 */
import type { LandscapeCoordinate } from "../domain/types";

export const LANDSCAPE_VERSION = "rbe-landscape-coordinates-0.0.0-pending-curation";

export const LANDSCAPE_COORDINATES: LandscapeCoordinate[] = [];

export const hasLandscapeCoordinates = () => LANDSCAPE_COORDINATES.length > 0;

export const getLandscapeCoordinate = (
  emotionId: string | null | undefined
): LandscapeCoordinate | null =>
  LANDSCAPE_COORDINATES.find((c) => c.emotionId === emotionId) ?? null;
