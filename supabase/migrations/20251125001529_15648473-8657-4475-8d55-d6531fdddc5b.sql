
-- Criar 10 agendamentos para Chiana Loud (IPSP)
-- Paciente: Chiana Loud (user_id: 9d6a20e6-f905-475a-b4f8-7d805649fe50)
-- Instituição: IPSP (ID: a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d)
-- Tenant: Medcos (3a9ae5ec-50a9-4674-b808-7735e5f0afb5)

-- Consulta 1: 15/11/2024 - Pedro Santos (Primeira consulta com cupom)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  79, '2024-11-15', '14:00:00', 'confirmado', 'paid',
  40.00, '38d6aceb-afe0-4d6b-8abc-f7f9f297aea7', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5', 
  'Primeira consulta - Avaliação inicial'
);

-- Consulta 2: 22/11/2024 - Pedro Santos (Sem cupom)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  79, '2024-11-22', '14:00:00', 'confirmado', 'paid',
  80.00, '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Continuação do acompanhamento com estagiário'
);

-- Consulta 3: 29/11/2024 - Dra. Mariana Costa (Com cupom estudante)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  76, '2024-11-29', '10:00:00', 'confirmado', 'paid',
  112.50, '2df0e515-9021-451c-9b9c-d88e3089ed5a', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Primeira consulta com supervisora - Transferência de estagiário'
);

-- Consulta 4: 06/12/2024 - Dra. Mariana Costa (Com cupom estudante)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  76, '2024-12-06', '10:00:00', 'confirmado', 'paid',
  112.50, '2df0e515-9021-451c-9b9c-d88e3089ed5a', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Sessão de acompanhamento regular'
);

-- Consulta 5: 13/12/2024 - Dra. Mariana Costa (Com cupom estudante)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  76, '2024-12-13', '10:00:00', 'confirmado', 'paid',
  112.50, '2df0e515-9021-451c-9b9c-d88e3089ed5a', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Sessão de acompanhamento regular'
);

-- Consulta 6: 18/12/2024 - Dr. Ricardo Almeida (Cancelada)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  77, '2024-12-18', '15:00:00', 'cancelado', 'failed',
  140.00, '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Paciente cancelou com 2 dias de antecedência - Conflito de horário'
);

-- Consulta 7: 27/12/2024 - Dra. Mariana Costa (Futura, pendente pagamento)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  76, '2024-12-27', '10:00:00', 'confirmado', 'pending_payment',
  112.50, '2df0e515-9021-451c-9b9c-d88e3089ed5a', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Sessão de fechamento do ano'
);

-- Consulta 8: 03/01/2025 - Dra. Mariana Costa (Futura, paga)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  76, '2025-01-03', '10:00:00', 'confirmado', 'paid',
  112.50, '2df0e515-9021-451c-9b9c-d88e3089ed5a', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Retomada pós-feriados'
);

-- Consulta 9: 10/01/2025 - Dra. Mariana Costa (Futura, paga)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  76, '2025-01-10', '10:00:00', 'confirmado', 'paid',
  112.50, '2df0e515-9021-451c-9b9c-d88e3089ed5a', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Sessão de acompanhamento regular'
);

-- Consulta 10: 17/01/2025 - Dra. Mariana Costa (Futura, pendente)
INSERT INTO agendamentos (
  user_id, nome_paciente, email_paciente, telefone_paciente,
  professional_id, data_consulta, horario, status, payment_status,
  valor, coupon_id, tenant_id, observacoes
) VALUES (
  '9d6a20e6-f905-475a-b4f8-7d805649fe50', 'Chiana Loud', 'xikiva2804@moondyal.com', '(11) 98765-4321',
  76, '2025-01-17', '10:00:00', 'pendente', 'pending_payment',
  112.50, '2df0e515-9021-451c-9b9c-d88e3089ed5a', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  'Agendamento futuro'
);

-- Criar registros de uso de cupom para consultas com desconto
-- Consulta 1: PRIMEIRA-SESSAO-MEDCOS (R$ 40 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
) 
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '38d6aceb-afe0-4d6b-8abc-f7f9f297aea7',
  id,
  80.00, 40.00, 40.00,
  '2024-11-15 14:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2024-11-15' 
  AND horario = '14:00:00';

-- Consulta 3: ESTUDANTE-IPSP-MEDCOS (25% = R$ 37.50 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
)
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '2df0e515-9021-451c-9b9c-d88e3089ed5a',
  id,
  150.00, 37.50, 112.50,
  '2024-11-29 10:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2024-11-29' 
  AND horario = '10:00:00';

-- Consulta 4: ESTUDANTE-IPSP-MEDCOS (25% = R$ 37.50 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
)
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '2df0e515-9021-451c-9b9c-d88e3089ed5a',
  id,
  150.00, 37.50, 112.50,
  '2024-12-06 10:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2024-12-06' 
  AND horario = '10:00:00';

-- Consulta 5: ESTUDANTE-IPSP-MEDCOS (25% = R$ 37.50 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
)
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '2df0e515-9021-451c-9b9c-d88e3089ed5a',
  id,
  150.00, 37.50, 112.50,
  '2024-12-13 10:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2024-12-13' 
  AND horario = '10:00:00';

-- Consulta 7: ESTUDANTE-IPSP-MEDCOS (25% = R$ 37.50 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
)
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '2df0e515-9021-451c-9b9c-d88e3089ed5a',
  id,
  150.00, 37.50, 112.50,
  '2024-12-27 10:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2024-12-27' 
  AND horario = '10:00:00';

-- Consulta 8: ESTUDANTE-IPSP-MEDCOS (25% = R$ 37.50 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
)
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '2df0e515-9021-451c-9b9c-d88e3089ed5a',
  id,
  150.00, 37.50, 112.50,
  '2025-01-03 10:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2025-01-03' 
  AND horario = '10:00:00';

-- Consulta 9: ESTUDANTE-IPSP-MEDCOS (25% = R$ 37.50 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
)
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '2df0e515-9021-451c-9b9c-d88e3089ed5a',
  id,
  150.00, 37.50, 112.50,
  '2025-01-10 10:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2025-01-10' 
  AND horario = '10:00:00';

-- Consulta 10: ESTUDANTE-IPSP-MEDCOS (25% = R$ 37.50 desconto)
INSERT INTO coupon_usage (
  user_id, coupon_id, appointment_id,
  original_amount, discount_amount, final_amount, used_at
)
SELECT 
  '9d6a20e6-f905-475a-b4f8-7d805649fe50',
  '2df0e515-9021-451c-9b9c-d88e3089ed5a',
  id,
  150.00, 37.50, 112.50,
  '2025-01-17 10:00:00'
FROM agendamentos 
WHERE user_id = '9d6a20e6-f905-475a-b4f8-7d805649fe50' 
  AND data_consulta = '2025-01-17' 
  AND horario = '10:00:00';

-- Atualizar contadores de uso dos cupons
UPDATE institution_coupons 
SET current_usage_count = current_usage_count + 1
WHERE id = '38d6aceb-afe0-4d6b-8abc-f7f9f297aea7';

UPDATE institution_coupons 
SET current_usage_count = current_usage_count + 8
WHERE id = '2df0e515-9021-451c-9b9c-d88e3089ed5a';
