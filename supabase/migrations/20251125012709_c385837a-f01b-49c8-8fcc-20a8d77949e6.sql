-- Consulta 1 - Dra. Mariana Costa (15/12/2025)
INSERT INTO agendamentos (
  user_id,
  professional_id,
  tenant_id,
  nome_paciente,
  email_paciente,
  telefone_paciente,
  data_consulta,
  horario,
  valor,
  status,
  payment_status,
  observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  76,
  '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Chiana Loud',
  'xikiva2804@moondyal.com',
  '(11) 98765-4321',
  '2025-12-15',
  '10:00',
  150.00,
  'confirmado',
  'paid',
  'Acompanhamento mensal - sessão de terapia cognitivo-comportamental'
);

-- Consulta 2 - Pedro Santos (22/12/2025)
INSERT INTO agendamentos (
  user_id,
  professional_id,
  tenant_id,
  nome_paciente,
  email_paciente,
  telefone_paciente,
  data_consulta,
  horario,
  valor,
  status,
  payment_status,
  observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  79,
  '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Chiana Loud',
  'xikiva2804@moondyal.com',
  '(11) 98765-4321',
  '2025-12-22',
  '14:30',
  80.00,
  'confirmado',
  'paid',
  'Sessão de suporte psicológico - preparação para férias acadêmicas'
);