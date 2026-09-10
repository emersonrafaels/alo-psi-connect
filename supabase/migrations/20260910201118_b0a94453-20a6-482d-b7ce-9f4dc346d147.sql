-- 1. Catálogo base de apoios
CREATE TABLE public.support_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  origin_type text NOT NULL DEFAULT 'platform',
  category text NOT NULL,
  format text NOT NULL,
  access_type text NOT NULL,
  icon text NOT NULL DEFAULT 'sparkles',
  description text NOT NULL DEFAULT '',
  details text,
  how_to text,
  when_to text,
  provider text,
  cta_label text,
  cta_route text,
  featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.support_catalog TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_catalog TO authenticated;
GRANT ALL ON public.support_catalog TO service_role;

ALTER TABLE public.support_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogo ativo é público"
  ON public.support_catalog FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins gerenciam o catálogo"
  ON public.support_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_support_catalog_updated_at
  BEFORE UPDATE ON public.support_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Configurações do plano da instituição
CREATE TABLE public.institution_support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL UNIQUE REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  allowed_categories text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institution_support_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_support_settings TO authenticated;
GRANT ALL ON public.institution_support_settings TO service_role;

ALTER TABLE public.institution_support_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configurações do plano são legíveis"
  ON public.institution_support_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins gerenciam configurações do plano"
  ON public.institution_support_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_institution_support_settings_updated_at
  BEFORE UPDATE ON public.institution_support_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Apoios da plataforma incluídos no plano da instituição
CREATE TABLE public.institution_support_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  catalog_id uuid NOT NULL REFERENCES public.support_catalog(id) ON DELETE CASCADE,
  is_included boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, catalog_id)
);

GRANT SELECT ON public.institution_support_plan TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_support_plan TO authenticated;
GRANT ALL ON public.institution_support_plan TO service_role;

ALTER TABLE public.institution_support_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plano de apoios é legível"
  ON public.institution_support_plan FOR SELECT
  USING (true);

CREATE POLICY "Admins gerenciam o plano de apoios"
  ON public.institution_support_plan FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_institution_support_plan_updated_at
  BEFORE UPDATE ON public.institution_support_plan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Apoios publicados pela instituição
CREATE TABLE public.institution_supports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.support_catalog(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL,
  format text NOT NULL DEFAULT 'Orientação',
  access_type text NOT NULL DEFAULT 'Consultar instituição',
  icon text NOT NULL DEFAULT 'sparkles',
  description text NOT NULL DEFAULT '',
  details text,
  how_to text,
  when_to text,
  provider text,
  contact_channel text,
  contact_value text,
  notes text,
  featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_supports TO authenticated;
GRANT ALL ON public.institution_supports TO service_role;

ALTER TABLE public.institution_supports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros e estudantes vinculados veem apoios publicados"
  ON public.institution_supports FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.user_belongs_to_institution(auth.uid(), institution_id)
    OR (
      is_published = true
      AND EXISTS (
        SELECT 1 FROM public.patient_institutions pi
        WHERE pi.institution_id = institution_supports.institution_id
          AND pi.patient_id = public.current_patient_id()
      )
    )
  );

CREATE POLICY "Gestores da instituição gerenciam apoios"
  ON public.institution_supports FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.user_belongs_to_institution(auth.uid(), institution_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.user_belongs_to_institution(auth.uid(), institution_id)
  );

CREATE TRIGGER update_institution_supports_updated_at
  BEFORE UPDATE ON public.institution_supports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Favoritos do estudante
CREATE TABLE public.support_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  support_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, support_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_favorites TO authenticated;
GRANT ALL ON public.support_favorites TO service_role;

ALTER TABLE public.support_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Favoritos pertencem ao usuário"
  ON public.support_favorites FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Histórico de visitas
CREATE TABLE public.support_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  support_key text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, support_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_visits TO authenticated;
GRANT ALL ON public.support_visits TO service_role;

ALTER TABLE public.support_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Histórico pertence ao usuário"
  ON public.support_visits FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. Plano de apoio do estudante
CREATE TABLE public.support_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  support_key text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, support_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_plan_items TO authenticated;
GRANT ALL ON public.support_plan_items TO service_role;

ALTER TABLE public.support_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plano de apoio pertence ao usuário"
  ON public.support_plan_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_institution_supports_institution ON public.institution_supports(institution_id);
CREATE INDEX idx_institution_support_plan_institution ON public.institution_support_plan(institution_id);
CREATE INDEX idx_support_catalog_origin ON public.support_catalog(origin_type, is_active);