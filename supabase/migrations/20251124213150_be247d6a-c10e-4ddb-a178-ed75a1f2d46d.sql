-- Allow admins and super_admins to view all user roles
CREATE POLICY "admins_view_all_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);