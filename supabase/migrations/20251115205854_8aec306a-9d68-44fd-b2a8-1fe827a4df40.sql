-- Adiciona política RLS para permitir admins visualizarem perfis de usuários institucionais
CREATE POLICY "Admins can view institution user profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Super admins e admins podem ver todos os perfis
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  -- Ou usuários vinculados à mesma instituição ativa
  OR EXISTS (
    SELECT 1
    FROM institution_users iu1
    JOIN institution_users iu2 ON iu1.institution_id = iu2.institution_id
    WHERE iu1.user_id = auth.uid()
      AND iu2.user_id = profiles.user_id
      AND iu1.is_active = true
      AND iu2.is_active = true
  )
);