export type Audience =
  | { kind: 'all' }
  | { kind: 'institutions'; institutionIds?: string[] }
  | { kind: 'users'; userIds: string[] }
  | { kind: 'students'; institutionId: string }
  | { kind: 'units'; institutionId: string; unitIds: string[] }
  | { kind: 'student_ids'; institutionId: string; patientIds: string[] };

export interface SenderRights {
  isPlatformAdmin: boolean;
  institutionIds: string[];
}

/** Platform admins send to everyone/institutions/users; institution admins only to their own students. */
export function canSend(rights: SenderRights, a: Audience): boolean {
  if (a.kind === 'all' || a.kind === 'institutions' || a.kind === 'users') return rights.isPlatformAdmin;
  return rights.isPlatformAdmin || rights.institutionIds.includes(a.institutionId);
}

/** Selected units plus every unit below them (a unit's students live on its leaf classes). */
export function expandUnits(selected: string[], units: { id: string; parent_id: string | null }[]): Set<string> {
  const children = new Map<string, string[]>();
  for (const u of units) {
    if (!u.parent_id) continue;
    children.set(u.parent_id, [...(children.get(u.parent_id) ?? []), u.id]);
  }
  const out = new Set<string>();
  const stack = [...selected];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

/**
 * Which recipients may get an email copy. Study cases follow their own toggle
 * (activated cases receive emails even inside a demo institution); every other
 * student of a demo institution never does.
 */
export function emailableRecipients(
  userIds: string[],
  cases: { user_id: string | null; notifications_blocked: boolean | null }[],
  institutionIsDemo: boolean,
): string[] {
  const caseMap = new Map<string, boolean>();
  for (const c of cases) if (c.user_id) caseMap.set(c.user_id, c.notifications_blocked !== false);
  return userIds.filter((id) => (caseMap.has(id) ? !caseMap.get(id) : !institutionIsDemo));
}
