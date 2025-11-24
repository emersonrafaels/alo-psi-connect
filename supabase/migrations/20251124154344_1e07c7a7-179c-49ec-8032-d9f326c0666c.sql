-- Criar RLS policy para institution admins visualizarem perfis de alunos
-- Problema: alunos podem ter user_id = NULL, então a policy existente não funciona
CREATE POLICY "institution_admins_view_student_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Permitir se o profile está vinculado a um paciente que está em uma instituição do admin
  id IN (
    SELECT p.profile_id
    FROM pacientes p
    INNER JOIN patient_institutions pi ON pi.patient_id = p.id
    INNER JOIN institution_users iu ON iu.institution_id = pi.institution_id
    WHERE iu.user_id = auth.uid()
      AND iu.is_active = true
  )
);