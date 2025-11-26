-- Criar agendas para os 5 profissionais fake

-- Dra. Mariana Costa (user_id: 1001) - Segunda a Sexta, manhã e tarde
INSERT INTO profissionais_sessoes (user_id, day, start_time, end_time, time_slot) VALUES
(1001, 'mon', '08:00', '12:00', 50),
(1001, 'mon', '14:00', '18:00', 50),
(1001, 'tue', '08:00', '12:00', 50),
(1001, 'tue', '14:00', '18:00', 50),
(1001, 'wed', '08:00', '12:00', 50),
(1001, 'wed', '14:00', '18:00', 50),
(1001, 'thu', '08:00', '12:00', 50),
(1001, 'thu', '14:00', '18:00', 50),
(1001, 'fri', '08:00', '12:00', 50),
(1001, 'fri', '14:00', '18:00', 50);

-- Dr. Ricardo Almeida (user_id: 1002) - Terça e Quinta
INSERT INTO profissionais_sessoes (user_id, day, start_time, end_time, time_slot) VALUES
(1002, 'tue', '09:00', '12:00', 50),
(1002, 'tue', '15:00', '19:00', 50),
(1002, 'thu', '09:00', '12:00', 50),
(1002, 'thu', '15:00', '19:00', 50);

-- Dra. Julia Fernandes (user_id: 1003) - Segunda, Quarta, Sexta
INSERT INTO profissionais_sessoes (user_id, day, start_time, end_time, time_slot) VALUES
(1003, 'mon', '10:00', '13:00', 50),
(1003, 'mon', '16:00', '20:00', 50),
(1003, 'wed', '10:00', '13:00', 50),
(1003, 'wed', '16:00', '20:00', 50),
(1003, 'fri', '10:00', '13:00', 50),
(1003, 'fri', '16:00', '20:00', 50);

-- Pedro Santos (user_id: 1004) - Segunda a Sexta, tarde (estudante)
INSERT INTO profissionais_sessoes (user_id, day, start_time, end_time, time_slot) VALUES
(1004, 'mon', '14:00', '18:00', 50),
(1004, 'tue', '14:00', '18:00', 50),
(1004, 'wed', '14:00', '18:00', 50),
(1004, 'thu', '14:00', '18:00', 50),
(1004, 'fri', '14:00', '18:00', 50);

-- Dra. Camila Rodrigues (user_id: 1005) - Terça a Quinta
INSERT INTO profissionais_sessoes (user_id, day, start_time, end_time, time_slot) VALUES
(1005, 'tue', '08:00', '12:00', 50),
(1005, 'tue', '13:00', '17:00', 50),
(1005, 'wed', '08:00', '12:00', 50),
(1005, 'wed', '13:00', '17:00', 50),
(1005, 'thu', '08:00', '12:00', 50),
(1005, 'thu', '13:00', '17:00', 50);

-- Adicionar meeting links nas consultas futuras da Chiana
UPDATE agendamentos 
SET meeting_link = 'https://meet.google.com/rbe-mari-1512'
WHERE id = 'd92132c7-6fc5-4081-834e-977f5cd97052';

UPDATE agendamentos 
SET meeting_link = 'https://meet.google.com/rbe-pedr-2212'
WHERE id = '5a3686c8-b10a-4e78-92ba-43223feb5d6b';