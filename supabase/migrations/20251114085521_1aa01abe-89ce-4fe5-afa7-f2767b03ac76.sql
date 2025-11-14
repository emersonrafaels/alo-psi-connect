-- Corrigir tipo_usuario dos Admin FCMS para 'admin'
UPDATE profiles 
SET tipo_usuario = 'admin'
WHERE email IN ('cigiv31164@gyknife.com', 'nofof72963@gyknife.com');