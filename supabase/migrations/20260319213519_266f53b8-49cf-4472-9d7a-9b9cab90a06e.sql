
CREATE TABLE public.patient_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  relacao text NOT NULL,
  telefone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contact_info_required CHECK (telefone IS NOT NULL OR email IS NOT NULL)
);

ALTER TABLE public.patient_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emergency contacts"
  ON public.patient_emergency_contacts FOR SELECT
  USING (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own emergency contacts"
  ON public.patient_emergency_contacts FOR INSERT
  WITH CHECK (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own emergency contacts"
  ON public.patient_emergency_contacts FOR UPDATE
  USING (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own emergency contacts"
  ON public.patient_emergency_contacts FOR DELETE
  USING (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all emergency contacts"
  ON public.patient_emergency_contacts FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access on emergency contacts"
  ON public.patient_emergency_contacts FOR ALL
  USING (true) WITH CHECK (true);
