-- Adicionar UNIQUE constraint em user_id (permitindo NULL)
-- Usando índice parcial para permitir múltiplos NULL mas garantir unicidade quando não-NULL
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON profiles(user_id) WHERE user_id IS NOT NULL;

-- Adicionar UNIQUE constraint em email
ALTER TABLE profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email);