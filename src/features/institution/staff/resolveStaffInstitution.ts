/** Active institution for RBE staff in the portal: URL first, then the last choice in this session; null means "show the picker". */
export function resolveStaffInstitution(urlInst: string | null, sessionInst: string | null): string | null {
  return urlInst || sessionInst || null;
}
