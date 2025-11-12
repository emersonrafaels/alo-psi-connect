-- ==============================================
-- FIX: Infinite Recursion in Institution RLS
-- ==============================================

-- Passo 1: Criar função de verificação segura
CREATE OR REPLACE FUNCTION public.user_belongs_to_institution(
  _user_id uuid,
  _institution_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institution_users
    WHERE user_id = _user_id
      AND institution_id = _institution_id
      AND is_active = true
  )
$$;

-- Passo 2: Corrigir política recursiva em institution_users
DROP POLICY IF EXISTS "Institution users can view colleagues" ON public.institution_users;

CREATE POLICY "Institution users can view colleagues"
ON public.institution_users
FOR SELECT
USING (
  public.user_belongs_to_institution(auth.uid(), institution_id)
);

-- Passo 3: Atualizar política SELECT de cupons
DROP POLICY IF EXISTS "Institution admins can view their coupons" ON public.institution_coupons;

CREATE POLICY "Institution admins can view their coupons"
ON public.institution_coupons
FOR SELECT
USING (
  public.user_belongs_to_institution(auth.uid(), institution_id)
);

-- Passo 4: Adicionar políticas INSERT, UPDATE, DELETE para cupons institucionais
CREATE POLICY "Institution admins can create their coupons"
ON public.institution_coupons
FOR INSERT
WITH CHECK (
  public.user_belongs_to_institution(auth.uid(), institution_id)
);

CREATE POLICY "Institution admins can update their coupons"
ON public.institution_coupons
FOR UPDATE
USING (
  public.user_belongs_to_institution(auth.uid(), institution_id)
);

CREATE POLICY "Institution admins can delete their coupons"
ON public.institution_coupons
FOR DELETE
USING (
  public.user_belongs_to_institution(auth.uid(), institution_id)
);

-- Passo 5: Comentar função para documentação
COMMENT ON FUNCTION public.user_belongs_to_institution IS 
'Security definer function to check if user belongs to institution without RLS recursion';