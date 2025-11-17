-- Corrigir tenant_id na institution_users para o usuário Admin FCMS
-- Define tenant como Alopsi (Rede Bem Estar) já que acessa via redebemestar.com.br
UPDATE institution_users
SET 
  tenant_id = '472db0ac-0f45-4998-97da-490bc579efb1',
  updated_at = NOW()
WHERE user_id = '6980c820-4979-4b90-913d-8001e67a21a4'
  AND institution_id = '06295e70-578d-490e-b1d5-40167ab8075e'
  AND tenant_id IS NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN institution_users.tenant_id IS 'Tenant ID da instituição - deve ser preenchido para garantir isolamento multi-tenant correto';