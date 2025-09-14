-- Fix security definer functions to be more secure
-- The linter flags security definer functions, but these are necessary for RLS
-- We'll ensure they are properly restricted and secure

-- The handle_new_user function is currently not used, so we can remove it
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Keep has_role and is_admin functions as they are essential for RLS policies
-- but add additional security by ensuring they only work for authenticated users
-- and are properly documented

-- Update has_role function with additional security checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow checking roles for authenticated users
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    WHEN _user_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.user_roles 
      WHERE role IN ('admin', 'super_admin')
    ) THEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
    ELSE false
  END
$$;

-- Update is_admin function with additional security checks  
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow checking admin status for authenticated users
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    WHEN _user_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.user_roles 
      WHERE role IN ('admin', 'super_admin')
    ) THEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('admin', 'super_admin', 'moderator')
    )
    ELSE false
  END
$$;

-- Add function comments for security documentation
COMMENT ON FUNCTION public.has_role(_user_id uuid, _role app_role) IS 
'Security definer function required for RLS policies. Only allows role checking for the authenticated user or by admins.';

COMMENT ON FUNCTION public.is_admin(_user_id uuid) IS 
'Security definer function required for RLS policies. Only allows admin status checking for the authenticated user or by admins.';