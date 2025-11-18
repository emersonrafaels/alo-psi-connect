-- Migration: Fix institution_users constraint for multi-tenant support
-- This migration allows the same user to be an admin of the same institution across different tenants

-- Step 1: Remove old constraint that prevents multi-tenancy
ALTER TABLE institution_users 
DROP CONSTRAINT institution_users_user_id_institution_id_key;

-- Step 2: Add new multi-tenant constraint
ALTER TABLE institution_users 
ADD CONSTRAINT institution_users_user_id_institution_id_tenant_key 
UNIQUE (user_id, institution_id, tenant_id);

-- Step 3: Link user cigiv31164@gyknife.com to FCMS in Medcos tenant
INSERT INTO institution_users (
  institution_id, 
  user_id, 
  role, 
  tenant_id, 
  is_active,
  created_by
)
VALUES (
  '06295e70-578d-490e-b1d5-40167ab8075e', -- FCMS
  '6980c820-4979-4b90-913d-8001e67a21a4', -- cigiv31164@gyknife.com
  'admin',
  '3a9ae5ec-50a9-4674-b808-7735e5f0afb5', -- Medcos
  true,
  '6980c820-4979-4b90-913d-8001e67a21a4'
);

-- Step 4: Create Black Friday coupon for FCMS in Medcos tenant
INSERT INTO institution_coupons (
  institution_id,
  tenant_id,
  name,
  code,
  description,
  discount_type,
  discount_value,
  max_discount_amount,
  valid_from,
  valid_until,
  is_active,
  uses_per_user,
  target_audience,
  professional_scope,
  professional_scope_ids,
  created_by
)
VALUES (
  '06295e70-578d-490e-b1d5-40167ab8075e', -- FCMS
  '3a9ae5ec-50a9-4674-b808-7735e5f0afb5', -- Medcos
  'Black Friday FCMS',
  'BLACKFRIDAY2024',
  'Promoção especial Black Friday - 30% de desconto até R$ 150 para alunos da FCMS',
  'percentage',
  30,
  150,
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  1,
  'institution_students',
  'institution_professionals',
  ARRAY[28::bigint], -- Yasmin Gouveia
  '6980c820-4979-4b90-913d-8001e67a21a4'
);

-- Step 5: Log user link action in audit log
INSERT INTO institution_audit_log (
  institution_id,
  action_type,
  entity_type,
  entity_id,
  performed_by,
  changes_summary,
  metadata
)
VALUES (
  '06295e70-578d-490e-b1d5-40167ab8075e',
  'link',
  'user',
  '6980c820-4979-4b90-913d-8001e67a21a4',
  '6980c820-4979-4b90-913d-8001e67a21a4',
  jsonb_build_object(
    'action', 'Usuário admin vinculado à instituição no tenant Medcos',
    'role', 'admin',
    'tenant_id', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5'
  ),
  jsonb_build_object(
    'migration', 'constraint_fix_and_medcos_replication',
    'email', 'cigiv31164@gyknife.com'
  )
);

-- Step 6: Log coupon creation in audit log
INSERT INTO institution_audit_log (
  institution_id,
  action_type,
  entity_type,
  performed_by,
  changes_summary,
  metadata
)
VALUES (
  '06295e70-578d-490e-b1d5-40167ab8075e',
  'create',
  'coupon',
  '6980c820-4979-4b90-913d-8001e67a21a4',
  jsonb_build_object(
    'action', 'Cupom Black Friday criado para o tenant Medcos',
    'code', 'BLACKFRIDAY2024',
    'discount', '30%',
    'max_discount', 'R$ 150'
  ),
  jsonb_build_object(
    'migration', 'constraint_fix_and_medcos_replication',
    'tenant_id', '3a9ae5ec-50a9-4674-b808-7735e5f0afb5'
  )
);