CREATE POLICY "Admins can manage all professional sessions"
ON public.profissionais_sessoes
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));