-- 1. Criar vínculo em patient_institutions (paciente → UniFOA)
INSERT INTO patient_institutions (patient_id, institution_id, enrollment_status, enrollment_date)
VALUES (
  '21dc6649-971c-4709-baaa-0caea07880bf',
  '33b11baa-2679-4673-a72e-b705c76c73f1',
  'enrolled',
  CURRENT_DATE
)
ON CONFLICT DO NOTHING;

-- 2. Criar vínculo em user_tenants usando profile_id (campo id de profiles)
INSERT INTO user_tenants (user_id, tenant_id, is_primary)
VALUES (
  '1ce43aa8-94ec-4623-9261-630a57668430',
  '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
  false
)
ON CONFLICT DO NOTHING;