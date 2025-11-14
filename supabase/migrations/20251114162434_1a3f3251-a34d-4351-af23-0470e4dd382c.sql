-- Adicionar política RLS direta para super_admins na tabela pacientes
-- Isso resolve o problema da função is_admin() não funcionar corretamente no contexto RLS

CREATE POLICY "super_admins_select_all_patients"
ON pacientes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'::app_role
  )
);