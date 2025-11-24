-- Sincronizar tenant_id de profiles para user_tenants (CORRIGIDO v2)
-- Corrige usuários criados antes da migração multi-tenant
-- usa profiles.id (não user_id) para foreign key correta

INSERT INTO user_tenants (user_id, tenant_id, is_primary)
SELECT 
  p.id,  -- profiles.id é a foreign key correta para user_tenants.user_id
  p.tenant_id,
  true as is_primary
FROM profiles p
WHERE p.tenant_id IS NOT NULL
  AND p.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_tenants ut 
    WHERE ut.user_id = p.id  -- Comparar com profiles.id
    AND ut.tenant_id = p.tenant_id
  )
ON CONFLICT (user_id, tenant_id) DO NOTHING;