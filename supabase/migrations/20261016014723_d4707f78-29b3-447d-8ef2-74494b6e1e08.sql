-- Permite que membros/admins da própria instituição atualizem somente o modelo de hierarquia
CREATE POLICY "Institution members can update their institution"
ON public.educational_institutions
FOR UPDATE
TO authenticated
USING (public.user_has_institution_access(auth.uid(), id))
WITH CHECK (public.user_has_institution_access(auth.uid(), id));

-- Restringe a coluna que a instituição pode editar
REVOKE UPDATE ON public.educational_institutions FROM authenticated;
GRANT UPDATE (academic_hierarchy_levels) ON public.educational_institutions TO authenticated;