-- Estratégia alternativa: Alterar temporariamente a constraint de user_id para permitir valores NULL
-- e depois criar profiles sem user_id para os profissionais existentes

-- 1. Tornar user_id nullable temporariamente (se não for já)
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- 2. Criar profiles para profissionais que não têm profile_id (sem user_id por enquanto)
INSERT INTO public.profiles (
  nome, 
  email, 
  tipo_usuario,
  created_at,
  updated_at
)
SELECT 
  COALESCE(display_name, first_name || ' ' || last_name, 'Profissional') as nome,
  user_email as email,
  'profissional' as tipo_usuario,
  NOW() as created_at,
  NOW() as updated_at
FROM profissionais 
WHERE profile_id IS NULL 
  AND user_email IS NOT NULL
  AND user_email != ''
  AND ativo = true;

-- 3. Atualizar profissionais para referenciar os profiles recém-criados
UPDATE profissionais 
SET profile_id = (
  SELECT profiles.id 
  FROM profiles 
  WHERE profiles.email = profissionais.user_email 
    AND profiles.tipo_usuario = 'profissional'
    AND profiles.user_id IS NULL  -- Garantir que estamos pegando os profiles novos
  ORDER BY profiles.created_at DESC
  LIMIT 1
)
WHERE profile_id IS NULL 
  AND user_email IS NOT NULL
  AND user_email != ''
  AND ativo = true;