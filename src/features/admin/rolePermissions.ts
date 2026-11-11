// Which admin-panel pages each staff profile can open.
// Admin RBE: everything a regular admin sees, except the technical areas.
// Clinical coordination: only student-health pages, across all institutions.

export const TECHNICAL_ADMIN_PATHS = ['/admin/configuracoes', '/admin/emails', '/admin/traducoes'];

export const CLINICAL_ADMIN_PATHS = [
  '/admin/portal-institucional',
  '/admin/radar-institucional',
  '/admin/appointments',
  '/admin/palavras-criticas',
];

const matches = (path: string, base: string) => path === base || path.startsWith(base + '/');

/** True when the roles allow opening this admin-panel path. */
export function canAccessAdminPath(roles: string[], path: string): boolean {
  if (roles.includes('super_admin') || roles.includes('admin')) return true;
  if (roles.includes('admin_rbe')) return !TECHNICAL_ADMIN_PATHS.some((p) => matches(path, p));
  if (roles.includes('clinical_coordinator')) return CLINICAL_ADMIN_PATHS.some((p) => matches(path, p));
  return roles.includes('moderator');
}

/** Clinical coordination always sees students as "Aluno #N". */
export const mustAnonymizeStudents = (roles: string[]) =>
  roles.includes('clinical_coordinator') && !roles.some((r) => ['admin', 'super_admin', 'admin_rbe'].includes(r));

export const STAFF_ROLE_LABELS: Record<string, string> = {
  admin_rbe: 'Admin RBE',
  clinical_coordinator: 'Coordenação clínica',
};
