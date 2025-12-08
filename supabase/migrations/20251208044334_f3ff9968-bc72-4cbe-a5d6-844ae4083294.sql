-- Permitir que profissionais vejam seu próprio registro (ativo ou inativo)
CREATE POLICY "Professionals can view their own profile"
ON public.profissionais
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = profissionais.profile_id
    AND profiles.user_id = auth.uid()
  )
);