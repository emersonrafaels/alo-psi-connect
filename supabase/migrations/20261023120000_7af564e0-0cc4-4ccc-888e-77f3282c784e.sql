-- Quick notes are internal annotations by the institution team. They live apart from student_triage
-- so writing one never changes a student's triage status, queue position, metrics or benchmarks.
CREATE TABLE public.student_triage_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  note text NOT NULL CHECK (length(btrim(note)) > 0),
  -- Risk level shown when the note was written, for context when reading it later.
  risk_level text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_triage_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all triage notes"
ON public.student_triage_notes
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Same membership rule as student_triage.
CREATE POLICY "Institution members can read triage notes"
ON public.student_triage_notes
FOR SELECT
USING (
  institution_id IN (
    SELECT iu.institution_id FROM institution_users iu
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
);

-- Notes are append-only and always signed by the person writing them.
CREATE POLICY "Institution members can add their own triage notes"
ON public.student_triage_notes
FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND institution_id IN (
    SELECT iu.institution_id FROM institution_users iu
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
);

CREATE INDEX idx_student_triage_notes_institution ON public.student_triage_notes(institution_id, created_at DESC);
CREATE INDEX idx_student_triage_notes_patient ON public.student_triage_notes(patient_id);
