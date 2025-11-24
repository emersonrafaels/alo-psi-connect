-- Atualizar todos os profissionais para relationship_type 'partner'
-- Forçar atualização de todos os registros na tabela professional_institutions

UPDATE public.professional_institutions
SET 
  relationship_type = 'partner',
  updated_at = NOW()
WHERE relationship_type != 'partner' OR relationship_type IS NULL;

-- Verificar se há algum registro que ainda não é 'partner'
DO $$
DECLARE
  non_partner_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO non_partner_count
  FROM public.professional_institutions
  WHERE relationship_type != 'partner' OR relationship_type IS NULL;
  
  IF non_partner_count > 0 THEN
    RAISE NOTICE 'Ainda existem % registros que não são parceiros', non_partner_count;
  ELSE
    RAISE NOTICE 'Todos os registros foram atualizados para parceiros com sucesso';
  END IF;
END $$;