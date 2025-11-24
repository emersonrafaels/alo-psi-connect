-- Corrigir recursão infinita na policy de visualização de perfis de alunos
-- Remover policy problemática
DROP POLICY IF EXISTS "institution_admins_view_student_profiles" ON public.profiles;

-- Criar security definer function que retorna profile_ids de alunos sem causar recursão
CREATE OR REPLACE FUNCTION public.get_student_profile_ids_for_institution_admin(_user_id uuid)
RETURNS TABLE(profile_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.profile_id
  FROM pacientes p
  INNER JOIN patient_institutions pi ON pi.patient_id = p.id
  INNER JOIN institution_users iu ON iu.institution_id = pi.institution_id
  WHERE iu.user_id = _user_id
    AND iu.is_active = true;
$$;

-- Recriar policy usando a security definer function
CREATE POLICY "institution_admins_view_student_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT profile_id 
    FROM public.get_student_profile_ids_for_institution_admin(auth.uid())
  )
);