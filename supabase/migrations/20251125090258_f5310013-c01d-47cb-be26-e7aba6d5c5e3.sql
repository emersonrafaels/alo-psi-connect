-- Atualizar sessões do Rede Bem Estar para serem organizadas pelo tenant
UPDATE group_sessions 
SET 
  organizer_type = 'tenant', 
  professional_id = NULL
WHERE 
  tenant_id = '472db0ac-0f45-4998-97da-490bc579efb1'  -- Rede Bem Estar
  AND organizer_type = 'professional';

-- Atualizar sessões do Medcos para serem organizadas pelo tenant (se necessário)
UPDATE group_sessions 
SET 
  organizer_type = 'tenant', 
  professional_id = NULL
WHERE 
  tenant_id = '3a9ae5ec-50a9-4674-b808-7735e5f0afb5'  -- Medcos
  AND organizer_type = 'professional';