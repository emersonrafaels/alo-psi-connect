CREATE TABLE public.student_triage_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  author_id uuid NOT NULL,
  note text NOT NULL,
  risk_level text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_triage_notes TO authenticated;
GRANT ALL ON public.student_triage_notes TO service_role;
ALTER TABLE public.student_triage_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_triage_notes_inst_patient ON public.student_triage_notes (institution_id, patient_id, created_at DESC);
CREATE POLICY "Institution members read notes" ON public.student_triage_notes FOR SELECT TO authenticated
  USING (public.user_belongs_to_institution(auth.uid(), institution_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Institution members add notes" ON public.student_triage_notes FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (public.user_belongs_to_institution(auth.uid(), institution_id) OR public.is_admin(auth.uid())));
CREATE POLICY "Authors edit own notes" ON public.student_triage_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own notes" ON public.student_triage_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid());
CREATE TRIGGER trg_triage_notes_updated BEFORE UPDATE ON public.student_triage_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();