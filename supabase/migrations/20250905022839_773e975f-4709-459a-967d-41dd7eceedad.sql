-- Migração para criar profiles para profissionais existentes e conectá-los adequadamente

-- 1. Criar profiles para profissionais que não têm profile_id
-- Usamos os dados existentes da tabela profissionais para popular os profiles
INSERT INTO public.profiles (
  user_id, 
  nome, 
  email, 
  tipo_usuario,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as user_id,  -- Gerar UUID temporário para user_id (será usado para auth futuramente)
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

-- 2. Atualizar profissionais para referenciar os profiles recém-criados
-- Fazemos o match baseado no email que é único
UPDATE profissionais 
SET profile_id = (
  SELECT profiles.id 
  FROM profiles 
  WHERE profiles.email = profissionais.user_email 
    AND profiles.tipo_usuario = 'profissional'
  ORDER BY profiles.created_at DESC
  LIMIT 1
)
WHERE profile_id IS NULL 
  AND user_email IS NOT NULL
  AND user_email != ''
  AND ativo = true;

-- 3. Verificar se a migração foi bem-sucedida
-- Esta query deve retornar 0 se todos os profissionais ativos agora têm profile_id
-- SELECT COUNT(*) as profissionais_sem_profile 
-- FROM profissionais 
-- WHERE profile_id IS NULL AND ativo = true;