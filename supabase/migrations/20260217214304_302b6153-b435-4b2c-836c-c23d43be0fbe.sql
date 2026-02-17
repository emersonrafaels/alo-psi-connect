
-- Create student_triage table
CREATE TABLE public.student_triage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  triaged_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'triaged',
  risk_level text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  recommended_action text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.student_triage ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all triage records"
ON public.student_triage
FOR ALL
USING (is_admin(auth.uid()));

-- Institution admins can manage triage for their institution
CREATE POLICY "Institution admins can manage triage"
ON public.student_triage
FOR ALL
USING (
  institution_id IN (
    SELECT iu.institution_id FROM institution_users iu
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
);

-- Indexes
CREATE INDEX idx_student_triage_institution ON public.student_triage(institution_id);
CREATE INDEX idx_student_triage_patient ON public.student_triage(patient_id);
CREATE INDEX idx_student_triage_status ON public.student_triage(status);

-- Trigger for updated_at
CREATE TRIGGER update_student_triage_updated_at
BEFORE UPDATE ON public.student_triage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
