-- Adicionar policies de DELETE para patient_institutions
-- Permite admins e institution admins removerem vínculos de pacientes

-- Policy para admins/super_admins deletarem qualquer vínculo
CREATE POLICY "admins_delete_patient_institutions" 
ON public.patient_institutions
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
  )
);

-- Policy para institution admins deletarem vínculos das suas instituições
CREATE POLICY "institution_admins_delete_own_patient_institutions" 
ON public.patient_institutions
FOR DELETE 
TO authenticated
USING (
  institution_id IN (
    SELECT institution_id 
    FROM institution_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND role = 'admin'
  )
);