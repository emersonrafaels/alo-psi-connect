CREATE OR REPLACE FUNCTION public.get_student_permanence_participation(_institution_id uuid, _patient_id uuid)
RETURNS TABLE(id uuid, semester text, created_at timestamptz, answered_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pr.id, pr.semester, pr.created_at,
         (SELECT count(*)::int FROM jsonb_object_keys(COALESCE(pr.answers, '{}'::jsonb))) AS answered_count
  FROM public.permanence_responses pr
  WHERE pr.patient_id = _patient_id
    AND pr.institution_id = _institution_id
    AND (public.is_admin(auth.uid()) OR public.user_belongs_to_institution(auth.uid(), _institution_id))
    AND EXISTS (
      SELECT 1 FROM public.patient_institutions pi
      WHERE pi.patient_id = _patient_id AND pi.institution_id = _institution_id
    )
  ORDER BY pr.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_permanence_participation(uuid, uuid) TO authenticated;