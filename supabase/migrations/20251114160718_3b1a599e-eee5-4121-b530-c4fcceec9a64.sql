-- Adicionar política para super_admin ver todos os patient_institutions
CREATE POLICY "Super admins can view all patient institutions"
ON patient_institutions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Adicionar política para super_admin ver todos os professional_institutions
CREATE POLICY "Super admins can view all professional institutions"
ON professional_institutions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);