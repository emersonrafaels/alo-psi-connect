-- Remove política recursiva problemática
DROP POLICY IF EXISTS "Institution admins can view users" ON institution_users;

-- Cria nova política sem recursão usando has_role()
CREATE POLICY "Institution admins can view all institution users"
ON institution_users
FOR SELECT
TO authenticated
USING (
  -- Super admins e admins podem ver tudo
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'institution_admin'::app_role)
  -- Ou o usuário está vendo seu próprio vínculo
  OR user_id = auth.uid()
);