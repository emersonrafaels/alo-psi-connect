CREATE TABLE public.professional_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id INTEGER NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professional_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert education" ON public.professional_education FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view education" ON public.professional_education FOR SELECT USING (true);

CREATE INDEX idx_professional_education_professional_id ON public.professional_education(professional_id);