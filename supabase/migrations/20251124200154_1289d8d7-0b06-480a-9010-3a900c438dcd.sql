-- Adicionar role super_admin ao usuário alopsi.host@gmail.com (user_id correto)
INSERT INTO user_roles (user_id, role)
VALUES ('94d0ab31-07a9-4817-b21e-754653c2dc92', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;