import { useMemo } from 'react';
import { AcademicUnit } from '@/features/academic/hierarchy';

/** Aggregate counts only — no student identities — so the structure view stays privacy-safe. */
export const useStructureStats = (units: AcademicUnit[], placements: Map<string, string>) =>
  useMemo(() => {
    const byId = new Map(units.map((u) => [u.id, u]));
    const studentCount = new Map<string, number>();
    const descendantCount = new Map<string, number>();
    let placedTotal = 0;
    // Walk each placement's class up through its ancestors.
    placements.forEach((classId) => {
      let cur = byId.get(classId);
      if (cur) placedTotal++;
      while (cur) {
        studentCount.set(cur.id, (studentCount.get(cur.id) ?? 0) + 1);
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
      }
    });
    units.forEach((u) => {
      let cur = u.parent_id ? byId.get(u.parent_id) : undefined;
      while (cur) {
        descendantCount.set(cur.id, (descendantCount.get(cur.id) ?? 0) + 1);
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
      }
    });
    return { byId, studentCount, descendantCount, placedTotal };
  }, [units, placements]);
