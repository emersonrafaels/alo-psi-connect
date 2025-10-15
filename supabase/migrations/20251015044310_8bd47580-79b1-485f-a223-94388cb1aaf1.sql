-- Limpar perfil órfão do Cicero (ciseso4681@gta5hx.com)
-- Este perfil foi criado sem user_id vinculado
DELETE FROM profiles 
WHERE email = 'ciseso4681@gta5hx.com' 
AND user_id IS NULL;