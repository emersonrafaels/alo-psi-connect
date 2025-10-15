-- Limpar usuário órfão do Cicero de auth.users
-- Este usuário foi criado sem profile vinculado corretamente
DELETE FROM auth.users 
WHERE email = 'ciseso4681@gta5hx.com';

-- Também garantir que não há profile órfão
DELETE FROM profiles 
WHERE email = 'ciseso4681@gta5hx.com' 
AND user_id IS NULL;