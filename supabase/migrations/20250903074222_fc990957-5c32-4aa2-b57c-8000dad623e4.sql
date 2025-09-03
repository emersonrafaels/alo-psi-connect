-- Criar enum para roles administrativos
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'moderator');

-- Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é admin (qualquer tipo)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin', 'moderator')
  )
$$;

-- Policies para user_roles
CREATE POLICY "Super admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view admin roles" 
ON public.user_roles 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Super admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Políticas administrativas para a tabela profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Políticas administrativas para a tabela profissionais
CREATE POLICY "Admins can manage all professionals" 
ON public.profissionais 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Políticas administrativas para a tabela agendamentos
CREATE POLICY "Admins can view all appointments" 
ON public.agendamentos 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update appointments" 
ON public.agendamentos 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Políticas administrativas para a tabela pacientes
CREATE POLICY "Admins can view all patients" 
ON public.pacientes 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update patients" 
ON public.pacientes 
FOR UPDATE 
USING (public.is_admin(auth.uid()));