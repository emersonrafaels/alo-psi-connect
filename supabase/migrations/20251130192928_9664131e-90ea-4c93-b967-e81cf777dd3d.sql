-- Correção com desabilitação temporária do trigger
-- Profile ID: 60d73dfa-f3c9-4a98-92fc-de9bfb19cff1
-- Professional ID: 82

-- 1. Desabilitar o trigger temporariamente
ALTER TABLE profiles DISABLE TRIGGER sync_profile_tipo_usuario_trigger;

-- 2. Ativar o registro profissional primeiro
UPDATE profissionais 
SET ativo = true
WHERE id = 82;

-- 3. Corrigir tipo_usuario no perfil para 'profissional'
UPDATE profiles 
SET tipo_usuario = 'profissional'
WHERE id = '60d73dfa-f3c9-4a98-92fc-de9bfb19cff1';

-- 4. Reabilitar o trigger
ALTER TABLE profiles ENABLE TRIGGER sync_profile_tipo_usuario_trigger;

-- 5. Verificar se existem outros casos similares
DO $$
DECLARE
  inconsistent_count INTEGER;
  inconsistent_users TEXT;
BEGIN
  SELECT COUNT(*), string_agg(p.email, ', ')
  INTO inconsistent_count, inconsistent_users
  FROM profiles p
  JOIN profissionais pr ON pr.profile_id = p.id
  WHERE p.tipo_usuario != 'profissional';
  
  IF inconsistent_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Existem % profissional(is) com tipo_usuario incorreto: %', inconsistent_count, inconsistent_users;
  ELSE
    RAISE NOTICE 'OK: Nenhuma outra inconsistência encontrada após correção';
  END IF;
END $$;