
CREATE TABLE public.institution_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  note_type text NOT NULL DEFAULT 'info' CHECK (note_type IN ('event', 'info', 'alert', 'reminder')),
  start_date date,
  end_date date,
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.institution_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with institution notes"
ON public.institution_notes
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_institution_notes_institution ON public.institution_notes(institution_id);
CREATE INDEX idx_institution_notes_pinned ON public.institution_notes(is_pinned DESC, created_at DESC);
