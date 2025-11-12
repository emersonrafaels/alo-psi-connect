-- =====================================================
-- PORTAL INSTITUCIONAL - PARTE 2: Estrutura Completa
-- =====================================================

-- 1. Criar tabela institution_users
CREATE TABLE IF NOT EXISTS public.institution_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  role TEXT NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, institution_id)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_institution_users_user_id ON public.institution_users(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_users_institution_id ON public.institution_users(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_users_tenant_id ON public.institution_users(tenant_id);

-- Comentário da tabela
COMMENT ON TABLE public.institution_users IS 'Vincula usuários a instituições de ensino para acesso ao portal institucional';

-- 2. Habilitar RLS
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;

-- 3. Função para verificar acesso institucional
CREATE OR REPLACE FUNCTION public.user_has_institution_access(_user_id UUID, _institution_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institution_users iu
    INNER JOIN public.user_roles ur ON ur.user_id = iu.user_id
    WHERE iu.user_id = _user_id
      AND iu.institution_id = _institution_id
      AND iu.is_active = true
      AND ur.role = 'institution_admin'
  )
$$;

-- 4. Função para buscar instituições de um usuário
CREATE OR REPLACE FUNCTION public.get_user_institutions(_user_id UUID)
RETURNS TABLE(institution_id UUID, role TEXT, tenant_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT iu.institution_id, iu.role, iu.tenant_id
  FROM public.institution_users iu
  WHERE iu.user_id = _user_id
    AND iu.is_active = true
$$;

-- 5. RLS Policies para institution_users
CREATE POLICY "Super admins can manage institution users"
ON public.institution_users
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view institution users"
ON public.institution_users
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own institutions"
ON public.institution_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Institution users can view colleagues"
ON public.institution_users
FOR SELECT
USING (
  institution_id IN (
    SELECT institution_id 
    FROM public.institution_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 6. Atualizar RLS de professional_institutions
CREATE POLICY "Institution admins can view their professionals"
ON public.professional_institutions
FOR SELECT
USING (
  institution_id IN (
    SELECT institution_id 
    FROM public.institution_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 7. Atualizar RLS de patient_institutions
CREATE POLICY "Institution admins can view their patients"
ON public.patient_institutions
FOR SELECT
USING (
  institution_id IN (
    SELECT institution_id 
    FROM public.institution_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 8. Atualizar RLS de profissionais
CREATE POLICY "Institution admins can view linked professionals"
ON public.profissionais
FOR SELECT
USING (
  id IN (
    SELECT pi.professional_id
    FROM public.professional_institutions pi
    INNER JOIN public.institution_users iu 
      ON iu.institution_id = pi.institution_id
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
);

-- 9. Atualizar RLS de pacientes
CREATE POLICY "Institution admins can view linked patients"
ON public.pacientes
FOR SELECT
USING (
  id IN (
    SELECT pit.patient_id
    FROM public.patient_institutions pit
    INNER JOIN public.institution_users iu 
      ON iu.institution_id = pit.institution_id
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
);