-- ============================================
-- Migration: Limpeza e correção de cadastro profissional
-- Objetivo: Remover registros problemáticos e garantir integridade
-- ============================================

-- 1. Limpar profissionais com user_id NULL (registros problemáticos)
DELETE FROM profissionais WHERE user_id IS NULL;

-- 2. Garantir que user_id seja NOT NULL (prevenir problemas futuros)
ALTER TABLE profissionais 
  ALTER COLUMN user_id SET NOT NULL;

-- 3. Verificar e remover trigger handle_new_user se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Comentário explicativo
COMMENT ON TABLE profissionais IS 'Tabela de profissionais. user_id é obrigatório e gerenciado pela edge function create-professional-profile';
COMMENT ON COLUMN profissionais.user_id IS 'ID único do profissional, gerado pela edge function durante cadastro atômico';