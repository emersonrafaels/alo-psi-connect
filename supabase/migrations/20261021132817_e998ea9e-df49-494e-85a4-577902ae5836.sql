CREATE TABLE public.synthetic_student_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 institution_id uuid NOT NULL REFERENCES public.educational_institutions(id),
 case_key text NOT NULL,
 profile_id uuid REFERENCES public.profiles(id),
 patient_id uuid REFERENCES public.pacientes(id),
 user_id uuid,
 credentials_assigned boolean NOT NULL DEFAULT false,
 notifications_blocked boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(institution_id,case_key)
);
GRANT SELECT ON public.synthetic_student_cases TO authenticated;
GRANT ALL ON public.synthetic_student_cases TO service_role;
ALTER TABLE public.synthetic_student_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins or own case can read" ON public.synthetic_student_cases FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER synthetic_student_cases_updated_at BEFORE UPDATE ON public.synthetic_student_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();