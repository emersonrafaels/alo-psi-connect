-- =============================================
-- FASE 1: Multi-Tenant Database Structure
-- =============================================

-- 1. Criar tabela tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  base_path TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  secondary_color TEXT,
  theme_config JSONB DEFAULT '{}'::jsonb,
  meta_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
CREATE POLICY "Anyone can view active tenants"
  ON public.tenants
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage tenants"
  ON public.tenants
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Adicionar tenant_id nas tabelas existentes
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.pacientes 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.agendamentos 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.blog_post_views_tracking 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.mood_entries 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 3. Criar tabela N:N professional_tenants
CREATE TABLE IF NOT EXISTS public.professional_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id BIGINT NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.professional_tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for professional_tenants
CREATE POLICY "Anyone can view professional tenants"
  ON public.professional_tenants
  FOR SELECT
  USING (true);

CREATE POLICY "Professionals can manage their own tenants"
  ON public.professional_tenants
  FOR ALL
  USING (
    professional_id IN (
      SELECT p.id 
      FROM public.profissionais p
      JOIN public.profiles pr ON p.profile_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all professional tenants"
  ON public.professional_tenants
  FOR ALL
  USING (is_admin(auth.uid()));

-- 4. Criar helper function para pegar tenant_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- 5. Inserir seed data (AloPsi + Medcos)
INSERT INTO public.tenants (slug, name, base_path, primary_color, accent_color, secondary_color, theme_config, meta_config) VALUES
(
  'alopsi',
  'Alô, Psi!',
  '/',
  '217 91% 21%',
  '65 92% 76%',
  '173 80% 40%',
  '{"muted": "210 40% 96.1%", "muted_foreground": "215.4 16.3% 46.9%"}'::jsonb,
  '{"title": "Alô, Psi! - Atendimento Psicológico para Estudantes", "description": "Profissionais especializados em saúde mental", "favicon": "/favicon.ico"}'::jsonb
),
(
  'medcos',
  'Medcos',
  '/medcos',
  '210 56% 59%',
  '111 40% 67%',
  '210 56% 40%',
  '{"muted": "210 30% 96%", "muted_foreground": "210 20% 46%"}'::jsonb,
  '{"title": "Medcos - Saúde Mental para Estudantes de Medicina", "description": "Apoio psicológico especializado para estudantes de medicina", "favicon": "/favicon.ico"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 6. Atualizar tenant_id existente para AloPsi (migration de dados existentes)
UPDATE public.profiles 
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'alopsi')
WHERE tenant_id IS NULL;

UPDATE public.pacientes 
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'alopsi')
WHERE tenant_id IS NULL;

UPDATE public.agendamentos 
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'alopsi')
WHERE tenant_id IS NULL;

UPDATE public.blog_posts 
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'alopsi')
WHERE tenant_id IS NULL;

UPDATE public.mood_entries 
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'alopsi')
WHERE tenant_id IS NULL;

-- 7. Associar todos os profissionais ativos existentes ao tenant AloPsi
INSERT INTO public.professional_tenants (professional_id, tenant_id, is_featured, featured_order)
SELECT 
  id as professional_id,
  (SELECT id FROM public.tenants WHERE slug = 'alopsi') as tenant_id,
  em_destaque as is_featured,
  ordem_destaque as featured_order
FROM public.profissionais
WHERE ativo = true
ON CONFLICT (professional_id, tenant_id) DO NOTHING;

-- 8. Atualizar RLS policies existentes para isolamento por tenant

-- Profiles: Manter acesso próprio + adicionar isolamento por tenant
DROP POLICY IF EXISTS "Tenant isolation for profiles" ON public.profiles;
CREATE POLICY "Tenant isolation for profiles"
  ON public.profiles
  FOR SELECT
  USING (
    is_admin(auth.uid()) OR 
    auth.uid() = user_id
  );

-- Pacientes: Isolar por tenant
DROP POLICY IF EXISTS "Tenant isolation for patients" ON public.pacientes;
CREATE POLICY "Tenant isolation for patients"
  ON public.pacientes
  FOR SELECT
  USING (
    is_admin(auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Blog Posts: Filtrar por tenant (blog separado)
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published posts from tenant"
  ON public.blog_posts
  FOR SELECT
  USING (
    status = 'published' AND (
      tenant_id = get_current_tenant_id() OR 
      tenant_id IS NULL OR
      is_admin(auth.uid())
    )
  );

-- Agendamentos: Manter policies existentes (já filtram por user_id e professional_id)
-- Não precisa alterar pois o isolamento já acontece via user_id

-- Mood Entries: Manter policies existentes (já filtram por user_id)
-- Não precisa alterar pois o isolamento já acontece via user_id

-- 9. Criar trigger para auto-update de updated_at
CREATE OR REPLACE FUNCTION public.update_tenants_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenants_updated_at();

CREATE TRIGGER update_professional_tenants_updated_at
  BEFORE UPDATE ON public.professional_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenants_updated_at();