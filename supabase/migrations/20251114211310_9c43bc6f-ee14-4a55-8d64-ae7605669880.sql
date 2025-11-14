-- Adicionar política RLS direta para super_admins na tabela profiles
-- Isso permite que super_admins vejam todos os perfis, necessário para o JOIN com patient_institutions

CREATE POLICY "super_admins_select_all_profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'::app_role
  )
);