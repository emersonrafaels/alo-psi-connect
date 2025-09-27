-- Add super_admin role for the current admin user
INSERT INTO public.user_roles (user_id, role, created_by) 
VALUES ('b4047cab-d939-45f9-8471-379508a2c71a', 'super_admin', 'b4047cab-d939-45f9-8471-379508a2c71a')
ON CONFLICT (user_id, role) DO NOTHING;