// Canonical list of every email the site sends. Mirrored by src/features/admin-emails (imports this file).
export type EmailGroup = 'Conta e acesso' | 'Agendamentos' | 'Encontros' | 'Instituições' | 'Cuidado e mensagens' | 'Outros';

export interface EmailDef {
  key: string;
  name: string;
  group: EmailGroup;
  description: string;
  recipients: string;
  essential?: boolean;
  defaultAdmin?: boolean;
}

export const EMAIL_CATALOG: EmailDef[] = [
  { key: 'email-confirmation', name: 'Confirmação de cadastro', group: 'Conta e acesso', description: 'Link para confirmar o email após o cadastro.', recipients: 'Usuário que se cadastrou', essential: true },
  { key: 'magic-link', name: 'Link de acesso', group: 'Conta e acesso', description: 'Link mágico para entrar sem senha.', recipients: 'Usuário', essential: true },
  { key: 'password-reset', name: 'Redefinição de senha', group: 'Conta e acesso', description: 'Link para criar uma nova senha.', recipients: 'Usuário', essential: true },
  { key: 'patient-profile', name: 'Boas-vindas do paciente', group: 'Conta e acesso', description: 'Enviado quando o perfil de paciente é criado.', recipients: 'Paciente' },
  { key: 'professional-profile', name: 'Problema no cadastro profissional', group: 'Conta e acesso', description: 'Aviso quando o cadastro do profissional apresenta problema.', recipients: 'Profissional' },
  { key: 'appointment', name: 'Agendamento de consulta', group: 'Agendamentos', description: 'Confirmação de consulta para paciente, profissional e admin.', recipients: 'Paciente, profissional e admin', defaultAdmin: true },
  { key: 'appointment-auto-cancel', name: 'Cancelamento por falta de pagamento', group: 'Agendamentos', description: 'Consulta cancelada automaticamente sem pagamento.', recipients: 'Paciente' },
  { key: 'group-session', name: 'Encontros', group: 'Encontros', description: 'Inscrição, lembretes e avisos de encontros.', recipients: 'Participantes e facilitador', defaultAdmin: true },
  { key: 'session-theme', name: 'Sugestão de tema', group: 'Encontros', description: 'Quando alguém sugere um tema de encontro.', recipients: 'Quem sugeriu e admin', defaultAdmin: true },
  { key: 'institution-link-request', name: 'Pedido de vínculo', group: 'Instituições', description: 'Quando alguém pede vínculo a uma instituição.', recipients: 'Admins da instituição' },
  { key: 'institution-link-review', name: 'Resposta ao pedido de vínculo', group: 'Instituições', description: 'Pedido de vínculo aprovado ou recusado.', recipients: 'Quem pediu o vínculo' },
  { key: 'institution-link-reminder', name: 'Lembrete de pedidos pendentes', group: 'Instituições', description: 'Lembrete de pedidos de vínculo aguardando análise.', recipients: 'Admins da instituição' },
  { key: 'institution-link', name: 'Vínculo com instituição', group: 'Instituições', description: 'Aviso de vínculo criado com uma instituição.', recipients: 'Usuário vinculado' },
  { key: 'institution-action', name: 'Ações da instituição', group: 'Instituições', description: 'Triagens, notas e outras ações da equipe institucional.', recipients: 'Equipe da instituição' },
  { key: 'radar-submitted', name: 'Radar enviado', group: 'Instituições', description: 'Quando um radar institucional é enviado.', recipients: 'Equipe responsável' },
  { key: 'support-request', name: 'Pedido de apoio', group: 'Cuidado e mensagens', description: 'Aluno pede apoio à equipe de cuidado.', recipients: 'Admins da instituição', defaultAdmin: true },
  { key: 'message', name: 'Mensagens', group: 'Cuidado e mensagens', description: 'Mensagens enviadas pela mensageria do site.', recipients: 'Destinatários escolhidos' },
  { key: 'reminders', name: 'Lembretes diários', group: 'Cuidado e mensagens', description: 'Lembretes de diário, Radar e encontros (opt-in).', recipients: 'Alunos que ativaram lembretes' },
  { key: 'contact', name: 'Formulário de contato', group: 'Outros', description: 'Mensagem enviada pelo formulário de contato.', recipients: 'Admin e quem enviou', defaultAdmin: true },
  { key: 'newsletter', name: 'Newsletter', group: 'Outros', description: 'Confirmação de inscrição na newsletter.', recipients: 'Inscrito' },
  { key: 'test-email', name: 'Email de teste', group: 'Outros', description: 'Envio de teste pelo painel admin.', recipients: 'Endereço informado', essential: true },
];

export const SITE_ADMIN_KEY = '_site_admin';

export interface EmailSettingRow {
  email_key: string;
  enabled: boolean;
  site_admin_receives: boolean;
  extra_recipients: string[];
}

const valid = (e: unknown): e is string => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Pure rule: given a catalog key and the stored settings, decide whether to send and which addresses get a hidden copy. */
export function resolveEmailRouting(key: string, rows: EmailSettingRow[], alreadyTo: string[] = []) {
  const def = EMAIL_CATALOG.find((d) => d.key === key);
  const row = rows.find((r) => r.email_key === key);
  const site = rows.find((r) => r.email_key === SITE_ADMIN_KEY);
  const enabled = def?.essential ? true : row ? row.enabled : true;
  const adminOn = row ? row.site_admin_receives : !!def?.defaultAdmin;
  const siteAdmins = (site?.extra_recipients ?? []).filter(valid);
  const taken = new Set(alreadyTo.map((e) => e.toLowerCase()));
  const bcc = [...new Set([...(adminOn ? siteAdmins : []), ...(row?.extra_recipients ?? []).filter(valid)].map((e) => e.trim().toLowerCase()))]
    .filter((e) => !taken.has(e));
  return { enabled, bcc };
}
