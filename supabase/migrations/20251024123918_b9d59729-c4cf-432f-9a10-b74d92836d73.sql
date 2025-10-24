-- Adicionar campos de raça e sexualidade na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS raca TEXT,
ADD COLUMN IF NOT EXISTS sexualidade TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.profiles.raca IS 'Raça/etnia autodeclarada pelo usuário';
COMMENT ON COLUMN public.profiles.sexualidade IS 'Orientação sexual autodeclarada pelo usuário';