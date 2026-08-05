CREATE TABLE public.institution_buddy_viewers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);

CREATE TABLE public.institution_buddy_students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (institution_id, patient_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_buddy_viewers TO authenticated;
GRANT ALL ON public.institution_buddy_viewers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_buddy_students TO authenticated;
GRANT ALL ON public.institution_buddy_students TO service_role;

ALTER TABLE public.institution_buddy_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_buddy_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage buddy viewers"
ON public.institution_buddy_viewers FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Viewers can see their own grant"
ON public.institution_buddy_viewers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins manage buddy students"
ON public.institution_buddy_students FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Allowed viewers can see released students"
ON public.institution_buddy_students FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.institution_buddy_viewers v
  WHERE v.institution_id = institution_buddy_students.institution_id
    AND v.user_id = auth.uid()
));

CREATE TRIGGER update_institution_buddy_viewers_updated_at
BEFORE UPDATE ON public.institution_buddy_viewers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institution_buddy_students_updated_at
BEFORE UPDATE ON public.institution_buddy_students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_view_student_buddy(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institution_buddy_students s
    JOIN public.institution_buddy_viewers v
      ON v.institution_id = s.institution_id
    WHERE s.patient_id = _patient_id
      AND v.user_id = _user_id
  )
$$;

CREATE POLICY "Allowed institution viewers can read student portraits"
ON public.buddy_portraits FOR SELECT TO authenticated
USING (public.can_view_student_buddy(auth.uid(), patient_id));

CREATE POLICY "Allowed institution viewers can read student insights"
ON public.buddy_insights FOR SELECT TO authenticated
USING (public.can_view_student_buddy(auth.uid(), patient_id));