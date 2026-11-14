/** Portal URL that opens a given institution already selected for RBE staff (the portal reads `?inst=`). */
export function portalFor(institutionId: string, subPath = '', extraQuery = ''): string {
  const q = new URLSearchParams(extraQuery);
  q.set('inst', institutionId);
  return `/portal-institucional${subPath}?${q.toString()}`;
}
