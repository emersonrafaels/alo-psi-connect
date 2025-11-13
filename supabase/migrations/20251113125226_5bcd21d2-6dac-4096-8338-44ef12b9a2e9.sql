-- Adicionar role super_admin ao usuário admin
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'super_admin'::app_role
FROM profiles
WHERE email = 'alopsi.host@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;