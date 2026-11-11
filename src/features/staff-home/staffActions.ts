// Pure rules for the staff "Meu espaço" (Admin RBE and Coordenação clínica).
import { CLINICAL_ADMIN_PATHS, canAccessAdminPath } from '@/features/admin/rolePermissions';

export type StaffKind = 'admin_rbe' | 'clinical' | null;

export interface StaffSummary {
  institutions: number; students: number; professionals_active: number; professionals_pending: number;
  appointments_week: number; payments_pending: number; triage_open: number; triage_urgent: number;
  followups_overdue: number; care_open: number; care_stalled: number; radar_semester: string; radar_answered: number;
  by_institution: { id: string; name: string; logo_url: string | null; students: number; triage_open: number; triage_urgent: number; care_open: number }[];
}

export interface StaffAction { id: string; title: string; detail: string; to: string; tone: 'urgent' | 'warn' | 'info' }

/** Admin RBE wins when a person has both profiles; plain admins keep their usual space. */
export function staffKind(roles: string[]): StaffKind {
  if (roles.includes('admin_rbe')) return 'admin_rbe';
  if (roles.includes('clinical_coordinator')) return 'clinical';
  return null;
}

export function buildStaffActions(kind: Exclude<StaffKind, null>, s: StaffSummary): StaffAction[] {
  const a: StaffAction[] = [];
  if (s.triage_urgent > 0) a.push({ id: 'urgent', tone: 'urgent', title: `${s.triage_urgent} triagens com prioridade alta`, detail: 'Alunos com sinal elevado aguardando conclusão.', to: '/admin/portal-institucional' });
  if (s.care_stalled > 0) a.push({ id: 'stalled', tone: 'warn', title: `${s.care_stalled} pedidos de apoio parados`, detail: 'Sem triagem há mais de 3 dias.', to: '/admin/portal-institucional' });
  if (s.followups_overdue > 0) a.push({ id: 'followup', tone: 'warn', title: `${s.followups_overdue} retornos vencidos`, detail: 'Acompanhamentos com data de retorno já passada.', to: '/admin/portal-institucional' });
  if (kind === 'clinical') {
    a.push({ id: 'terms', tone: 'info', title: 'Revisar palavras críticas', detail: 'Mantenha a lista de termos sensíveis atualizada.', to: '/admin/palavras-criticas' });
  } else {
    if (s.professionals_pending > 0) a.push({ id: 'pros', tone: 'info', title: `${s.professionals_pending} profissionais aguardando aprovação`, detail: 'Cadastros inativos para revisar.', to: '/admin/professionals' });
    if (s.payments_pending > 0) a.push({ id: 'pay', tone: 'warn', title: `${s.payments_pending} agendamentos com pagamento pendente`, detail: 'Confira se o pagamento foi confirmado.', to: '/admin/appointments' });
  }
  return a;
}

const ALL_SHORTCUTS = [
  { title: 'Painel admin', to: '/admin' },
  { title: 'Portal Institucional', to: '/admin/portal-institucional' },
  { title: 'Radar Institucional', to: '/admin/radar-institucional' },
  { title: 'Agendamentos', to: '/admin/appointments' },
  { title: 'Palavras críticas', to: '/admin/palavras-criticas' },
  { title: 'Profissionais', to: '/admin/professionals' },
  { title: 'Instituições', to: '/admin/instituicoes' },
  { title: 'Financeiro', to: '/admin/financial' },
  { title: 'Configurações', to: '/admin/configuracoes' },
  { title: 'Emails', to: '/admin/emails' },
  { title: 'Traduções', to: '/admin/traducoes' },
];

export function staffShortcuts(roles: string[]) {
  return ALL_SHORTCUTS.filter((s) => (s.to === '/admin' ? !(staffKind(roles) === 'clinical') : canAccessAdminPath(roles, s.to)))
    .filter((s) => staffKind(roles) !== 'clinical' || CLINICAL_ADMIN_PATHS.includes(s.to));
}
