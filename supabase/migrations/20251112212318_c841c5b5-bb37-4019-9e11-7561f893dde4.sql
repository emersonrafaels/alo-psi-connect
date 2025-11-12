-- ==============================================
-- FIX: Infinite Recursion in Profissionais RLS
-- ==============================================

-- Passo 1: Criar função para verificar se usuário é profissional específico
CREATE OR REPLACE FUNCTION public.user_is_professional(
  _user_id uuid,
  _professional_id bigint
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profissionais p
    JOIN public.profiles pr ON p.profile_id = pr.id
    WHERE p.id = _professional_id
      AND pr.user_id = _user_id
  )
$$;

-- Passo 2: Criar função para obter IDs de profissionais de uma instituição
CREATE OR REPLACE FUNCTION public.get_institution_professional_ids(
  _user_id uuid
)
RETURNS TABLE(professional_id bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pi.professional_id
  FROM public.professional_institutions pi
  WHERE pi.institution_id IN (
    SELECT iu.institution_id
    FROM public.institution_users iu
    WHERE iu.user_id = _user_id
      AND iu.is_active = true
  )
$$;

-- Passo 3: Corrigir política recursiva em professional_institutions
DROP POLICY IF EXISTS "Professionals can view their own institutions" ON public.professional_institutions;

CREATE POLICY "Professionals can view their own institutions"
ON public.professional_institutions
FOR SELECT
USING (
  public.user_is_professional(auth.uid(), professional_id)
);

-- Passo 4: Atualizar política para institution admins em professional_institutions
DROP POLICY IF EXISTS "Institution admins can view their professionals" ON public.professional_institutions;

CREATE POLICY "Institution admins can view their professionals"
ON public.professional_institutions
FOR SELECT
USING (
  public.user_belongs_to_institution(auth.uid(), institution_id)
);

-- Passo 5: Corrigir política recursiva em profissionais
DROP POLICY IF EXISTS "Institution admins can view linked professionals" ON public.profissionais;

CREATE POLICY "Institution admins can view linked professionals"
ON public.profissionais
FOR SELECT
USING (
  id IN (SELECT * FROM public.get_institution_professional_ids(auth.uid()))
);

-- Passo 6: Adicionar comentários para documentação
COMMENT ON FUNCTION public.user_is_professional IS 
'Security definer function to check if user owns a professional profile without RLS recursion';

COMMENT ON FUNCTION public.get_institution_professional_ids IS 
'Security definer function to get professional IDs linked to user institutions without RLS recursion';