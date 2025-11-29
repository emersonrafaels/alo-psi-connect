import { WebhookField } from './WebhookFieldItem';

export const bookingWebhookFields: WebhookField[] = [
  // Appointment Fields
  {
    key: 'appointment.id',
    variable: '{{appointment.id}}',
    label: 'ID do Agendamento',
    description: 'Identificador único do agendamento',
    category: 'appointment',
    required: true
  },
  {
    key: 'appointment.data_consulta',
    variable: '{{appointment.data_consulta}}',
    label: 'Data da Consulta',
    description: 'Data agendada para a consulta',
    category: 'appointment'
  },
  {
    key: 'appointment.horario',
    variable: '{{appointment.horario}}',
    label: 'Horário',
    description: 'Horário da consulta',
    category: 'appointment'
  },
  {
    key: 'appointment.valor',
    variable: '{{appointment.valor}}',
    label: 'Valor',
    description: 'Valor da consulta',
    category: 'appointment'
  },
  {
    key: 'appointment.status',
    variable: '{{appointment.status}}',
    label: 'Status',
    description: 'Status atual do agendamento',
    category: 'appointment'
  },
  {
    key: 'appointment.meeting_link',
    variable: '{{appointment.meeting_link}}',
    label: 'Link da Reunião',
    description: 'Link do Google Meet',
    category: 'appointment'
  },
  {
    key: 'appointment.observacoes',
    variable: '{{appointment.observacoes}}',
    label: 'Observações',
    description: 'Notas adicionais do paciente',
    category: 'appointment'
  },

  // Patient Fields
  {
    key: 'appointment.nome_paciente',
    variable: '{{appointment.nome_paciente}}',
    label: 'Nome do Paciente',
    description: 'Nome completo do paciente',
    category: 'patient',
    required: true
  },
  {
    key: 'appointment.email_paciente',
    variable: '{{appointment.email_paciente}}',
    label: 'Email do Paciente',
    description: 'Email de contato do paciente',
    category: 'patient',
    required: true
  },
  {
    key: 'appointment.telefone_paciente',
    variable: '{{appointment.telefone_paciente}}',
    label: 'Telefone do Paciente',
    description: 'Telefone de contato',
    category: 'patient'
  },

  // Professional Fields
  {
    key: 'professional.display_name',
    variable: '{{professional.display_name}}',
    label: 'Nome do Profissional',
    description: 'Nome de exibição do profissional',
    category: 'professional'
  },
  {
    key: 'professional.user_email',
    variable: '{{professional.user_email}}',
    label: 'Email do Profissional',
    description: 'Email de contato do profissional',
    category: 'professional'
  },
  {
    key: 'professional.profissao',
    variable: '{{professional.profissao}}',
    label: 'Profissão',
    description: 'Especialidade/profissão',
    category: 'professional'
  },
  {
    key: 'professional.crp_crm',
    variable: '{{professional.crp_crm}}',
    label: 'CRP/CRM',
    description: 'Registro profissional',
    category: 'professional'
  },
  {
    key: 'professional.preco_consulta',
    variable: '{{professional.preco_consulta}}',
    label: 'Preço da Consulta',
    description: 'Valor padrão da consulta',
    category: 'professional'
  },

  // Payment Fields
  {
    key: 'appointment.payment_status',
    variable: '{{appointment.payment_status}}',
    label: 'Status do Pagamento',
    description: 'Status atual do pagamento',
    category: 'payment'
  },

  // System Fields
  {
    key: 'timestamp',
    variable: '{{timestamp}}',
    label: 'Timestamp',
    description: 'Data/hora do evento',
    category: 'system',
    required: true
  },
  {
    key: 'event',
    variable: '{{event}}',
    label: 'Tipo de Evento',
    description: 'Identificador do tipo de evento',
    category: 'system',
    required: true
  }
];

export const paymentWebhookFields: WebhookField[] = [
  // Appointment Fields
  {
    key: 'appointment.id',
    variable: '{{appointment.id}}',
    label: 'ID do Agendamento',
    description: 'Identificador único do agendamento',
    category: 'appointment',
    required: true
  },

  // Patient Fields
  {
    key: 'appointment.email_paciente',
    variable: '{{appointment.email_paciente}}',
    label: 'Email do Paciente',
    description: 'Email de contato do paciente',
    category: 'patient',
    required: true
  },
  {
    key: 'appointment.nome_paciente',
    variable: '{{appointment.nome_paciente}}',
    label: 'Nome do Paciente',
    description: 'Nome completo do paciente',
    category: 'patient'
  },

  // Payment Fields
  {
    key: 'appointment.payment_status',
    variable: '{{appointment.payment_status}}',
    label: 'Status do Pagamento',
    description: 'Status atual do pagamento',
    category: 'payment',
    required: true
  },
  {
    key: 'appointment.valor',
    variable: '{{appointment.valor}}',
    label: 'Valor',
    description: 'Valor da transação',
    category: 'payment'
  },
  {
    key: 'appointment.stripe_session_id',
    variable: '{{appointment.stripe_session_id}}',
    label: 'Stripe Session ID',
    description: 'ID da sessão do Stripe',
    category: 'payment'
  },
  {
    key: 'appointment.mercado_pago_preference_id',
    variable: '{{appointment.mercado_pago_preference_id}}',
    label: 'Mercado Pago ID',
    description: 'ID da preferência do Mercado Pago',
    category: 'payment'
  },

  // System Fields
  {
    key: 'timestamp',
    variable: '{{timestamp}}',
    label: 'Timestamp',
    description: 'Data/hora do evento',
    category: 'system',
    required: true
  },
  {
    key: 'event',
    variable: '{{event}}',
    label: 'Tipo de Evento',
    description: 'Identificador do tipo de evento',
    category: 'system',
    required: true
  }
];
