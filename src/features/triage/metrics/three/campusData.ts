import type { AcademicLevel, AcademicUnit } from '@/features/academic/hierarchy';
import type { Risk } from '../../priorities';
import { RISK_HEX } from './sceneData';
import type { SceneTheme } from './useSceneTheme';

/** Same privacy floor as the Comparador (`MIN_GROUP` in InstitutionComparator): smaller groups show only a head count. */
export const MIN_GROUP = 10;

/** Window order from the ground floor up, so each building reads like a stacked bar. */
export const WINDOW_ORDER: Risk[] = ['critical', 'alert', 'attention', 'healthy', 'no_data'];

export const UNPLACED_ID = '__unplaced';

export interface CampusStudent { patientId: string; riskLevel: Risk; lastTriageStatus: string | null }

export interface CampusBuilding {
  id: string;
  name: string;
  /** Unit (campus district) the building belongs to, when the hierarchy has units above it. */
  district: string | null;
  total: number;
  /** Null when the group is below MIN_GROUP: only the head count is shown. */
  byRisk: Record<Risk, number> | null;
  /** Em Risco students still waiting for triage; null when protected. */
  pendingCritical: number | null;
  floors: number;
  x: number;
  z: number;
}

export interface CampusDistrict { name: string | null; x: number; z: number; width: number; depth: number }

export const CAMPUS = { cell: 2.8, footprint: 1.5, floorHeight: 0.42, maxFloors: 12, columns: 4, districtGap: 2.4 } as const;

/** Buildings are courses when the hierarchy has them; otherwise the top active level (e.g. "Somente Turma"). */
export function buildingLevel(levels: AcademicLevel[]): AcademicLevel {
  return levels.includes('course') ? 'course' : levels[0] ?? 'class';
}

const emptyRisk = (): Record<Risk, number> => ({ critical: 0, alert: 0, attention: 0, healthy: 0, no_data: 0 });

/**
 * Splits `count` windows among risk levels in proportion to students (largest remainder), but every level
 * with at least one student keeps at least one window, so a single Em Risco student never disappears.
 */
export function windowShares(byRisk: Record<Risk, number>, count: number): Record<Risk, number> {
  const total = WINDOW_ORDER.reduce((a, r) => a + byRisk[r], 0);
  const out = emptyRisk();
  if (total === 0 || count === 0) return out;
  const present = WINDOW_ORDER.filter((r) => byRisk[r] > 0);
  if (present.length >= count) {
    // Not enough windows for everyone: most severe levels first.
    present.slice(0, count).forEach((r) => { out[r] = 1; });
    return out;
  }
  const exact = WINDOW_ORDER.map((r) => ({ r, v: (byRisk[r] / total) * count }));
  exact.forEach(({ r, v }) => { out[r] = byRisk[r] > 0 ? Math.max(1, Math.floor(v)) : 0; });
  let left = count - WINDOW_ORDER.reduce((a, r) => a + out[r], 0);
  const byRemainder = [...exact].filter(({ r }) => byRisk[r] > 0).sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
  for (let i = 0; left > 0; i = (i + 1) % byRemainder.length, left--) out[byRemainder[i].r]++;
  // The min-1 rule can overshoot; take the excess back from the largest groups.
  while (left < 0) {
    const biggest = WINDOW_ORDER.filter((r) => out[r] > 1).sort((a, b) => out[b] - out[a])[0];
    out[biggest]--; left++;
  }
  return out;
}

/** Flattened window colours, ground floor first, for `rows × cols` windows. */
export function windowRisks(byRisk: Record<Risk, number>, rows: number, cols: number): Risk[] {
  const shares = windowShares(byRisk, rows * cols);
  return WINDOW_ORDER.flatMap((r) => Array<Risk>(shares[r]).fill(r));
}

export function campusBuildings(
  units: AcademicUnit[],
  placements: Map<string, string>,
  levels: AcademicLevel[],
  students: CampusStudent[],
): { buildings: CampusBuilding[]; districts: CampusDistrict[]; level: AcademicLevel; placed: number } {
  const level = buildingLevel(levels);
  const byId = new Map(units.map((u) => [u.id, u]));
  const ancestorAt = (unitId: string | undefined, target: AcademicLevel) => {
    let cur = unitId ? byId.get(unitId) : undefined;
    while (cur && cur.level !== target) cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    return cur;
  };
  const withDistricts = levels.includes('unit') && level !== 'unit';

  const groups = new Map<string, { name: string; district: string | null; members: CampusStudent[] }>();
  units.filter((u) => u.level === level).forEach((u) => {
    groups.set(u.id, { name: u.name, district: withDistricts ? ancestorAt(u.id, 'unit')?.name ?? null : null, members: [] });
  });
  let placed = 0;
  students.forEach((s) => {
    const building = ancestorAt(placements.get(s.patientId), level);
    if (building && groups.has(building.id)) { groups.get(building.id)!.members.push(s); placed++; return; }
    if (!groups.has(UNPLACED_ID)) groups.set(UNPLACED_ID, { name: 'Sem turma definida', district: null, members: [] });
    groups.get(UNPLACED_ID)!.members.push(s);
  });

  const maxTotal = Math.max(1, ...[...groups.values()].map((g) => g.members.length));
  const raw = [...groups.entries()].map(([id, g]) => {
    const total = g.members.length;
    const counts = emptyRisk();
    g.members.forEach((m) => counts[m.riskLevel]++);
    const protectedGroup = total < MIN_GROUP;
    const pendingCritical = g.members.filter((m) => m.riskLevel === 'critical' && (!m.lastTriageStatus || m.lastTriageStatus === 'pending')).length;
    return {
      id,
      name: g.name,
      district: g.district,
      total,
      byRisk: protectedGroup ? null : counts,
      pendingCritical: protectedGroup ? null : pendingCritical,
      // Square-root scale keeps small courses visible next to very large ones.
      floors: Math.max(1, Math.round(1 + (CAMPUS.maxFloors - 1) * Math.sqrt(total / maxTotal))),
    };
  });

  // Districts side by side along x; buildings in a grid inside each district; "Sem turma" last.
  const districtNames = [...new Set(raw.map((b) => b.district))].sort((a, b) => (a ?? '').localeCompare(b ?? '', 'pt-BR'));
  const buildings: CampusBuilding[] = [];
  const districts: CampusDistrict[] = [];
  let cursorX = 0;
  districtNames.forEach((d) => {
    const inD = raw.filter((b) => b.district === d)
      .sort((a, b) => Number(a.id === UNPLACED_ID) - Number(b.id === UNPLACED_ID) || a.name.localeCompare(b.name, 'pt-BR'));
    const cols = Math.min(CAMPUS.columns, inD.length);
    const rows = Math.ceil(inD.length / cols);
    inD.forEach((b, i) => buildings.push({ ...b, x: cursorX + (i % cols) * CAMPUS.cell, z: Math.floor(i / cols) * CAMPUS.cell }));
    districts.push({ name: d, x: cursorX + ((cols - 1) * CAMPUS.cell) / 2, z: ((rows - 1) * CAMPUS.cell) / 2, width: cols * CAMPUS.cell, depth: rows * CAMPUS.cell });
    cursorX += cols * CAMPUS.cell + CAMPUS.districtGap;
  });

  // Centre the campus on the origin.
  const minX = Math.min(...buildings.map((b) => b.x)), maxX = Math.max(...buildings.map((b) => b.x));
  const minZ = Math.min(...buildings.map((b) => b.z)), maxZ = Math.max(...buildings.map((b) => b.z));
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  buildings.forEach((b) => { b.x -= cx; b.z -= cz; });
  districts.forEach((d) => { d.x -= cx; d.z -= cz; });

  return { buildings, districts, level, placed };
}

/** Lit but uninformative windows for protected groups (fewer than MIN_GROUP students). */
export const PROTECTED_WINDOW = '#fde68a';
export const NO_DATA_WINDOW = '#cbd5e1';
export const WINDOW_COLS = 4;

/** Window colours of a campus building; levels filtered out in the toolbar stay unlit (null). */
export function buildingWindows(b: Pick<CampusBuilding, 'byRisk' | 'floors'>, litRisks: Set<Risk>): (string | null)[] {
  if (!b.byRisk) return Array(b.floors * WINDOW_COLS).fill(PROTECTED_WINDOW);
  return windowRisks(b.byRisk, b.floors, WINDOW_COLS).map((r) =>
    r === 'no_data' ? NO_DATA_WINDOW : litRisks.has(r) ? RISK_HEX[r] : null);
}

/** Campus palette per theme: lawn, paths, building concrete, roofs, unlit glass. */
export function campusColors(theme: SceneTheme) {
  return theme.dark
    ? { lawn: '#1d2b22', path: '#3a3f47', concrete: '#4b5563', roof: '#374151', glass: '#111827', trunk: '#5b4636', crown: '#2f5d3a' }
    : { lawn: '#d9ead3', path: '#e7e2d8', concrete: '#efece6', roof: '#c9c3b8', glass: '#5b6b7d', trunk: '#8a6a4f', crown: '#7fb069' };
}
