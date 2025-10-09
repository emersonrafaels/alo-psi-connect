-- Associar todos os profissionais ativos a ambos os tenants (AloPsi e Medcos)
INSERT INTO professional_tenants (professional_id, tenant_id, is_featured, featured_order, created_at, updated_at)
SELECT 
  p.id as professional_id,
  t.id as tenant_id,
  false as is_featured,
  NULL as featured_order,
  now() as created_at,
  now() as updated_at
FROM profissionais p
CROSS JOIN tenants t
WHERE p.ativo = true
  AND t.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM professional_tenants pt 
    WHERE pt.professional_id = p.id 
    AND pt.tenant_id = t.id
  );

COMMENT ON TABLE professional_tenants IS 'Associação entre profissionais e tenants. Cada profissional pode estar em múltiplos tenants.';