CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  lang text NOT NULL CHECK (lang IN ('en','es')),
  auto_text text,
  human_text text,
  status text NOT NULL DEFAULT 'auto' CHECK (status IN ('auto','reviewed','needs_review')),
  pages text[] NOT NULL DEFAULT '{}',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_text, lang)
);
GRANT SELECT ON public.translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.translations TO authenticated;
GRANT ALL ON public.translations TO service_role;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "translations public read" ON public.translations FOR SELECT USING (true);
CREATE POLICY "translations admin write" ON public.translations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER translations_updated BEFORE UPDATE ON public.translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.translation_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_pt text NOT NULL,
  lang text NOT NULL CHECK (lang IN ('en','es')),
  term_target text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (term_pt, lang)
);
GRANT SELECT ON public.translation_glossary TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.translation_glossary TO authenticated;
GRANT ALL ON public.translation_glossary TO service_role;
ALTER TABLE public.translation_glossary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "glossary public read" ON public.translation_glossary FOR SELECT USING (true);
CREATE POLICY "glossary admin write" ON public.translation_glossary FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER glossary_updated BEFORE UPDATE ON public.translation_glossary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();