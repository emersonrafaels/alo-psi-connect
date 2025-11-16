-- Passo 1: Remover a FK incorreta que aponta para auth.users
ALTER TABLE institution_users
DROP CONSTRAINT institution_users_user_id_fkey;

-- Passo 2: Criar a FK correta apontando para profiles.user_id
-- (profiles.user_id já tem UNIQUE constraint, confirmado na query anterior)
ALTER TABLE institution_users
ADD CONSTRAINT institution_users_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- Passo 3: Criar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_institution_users_user_id 
ON institution_users(user_id);