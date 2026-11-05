// Email is suppressed only for synthetic requests or study cases with blocked notifications.
// Real students in demo institutions still notify admins and the Rede Bem-Estar inbox.
export function isEmailBlocked(requestIsSynthetic: boolean, studyCase: { notifications_blocked?: boolean | null } | null): boolean {
  return !!requestIsSynthetic || !!studyCase?.notifications_blocked;
}
