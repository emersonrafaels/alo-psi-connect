INSERT INTO public.user_roles (user_id, role)
SELECT id, CASE WHEN email = 'test-adminrbe@test.com' THEN 'admin_rbe'::app_role ELSE 'clinical_coordinator'::app_role END
FROM auth.users WHERE email IN ('test-adminrbe@test.com','test-clinica@test.com')
ON CONFLICT DO NOTHING;