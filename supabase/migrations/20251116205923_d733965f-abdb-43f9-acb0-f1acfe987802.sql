-- =====================================================
-- FIX: Segurança da Materialized View institution_metrics
-- =====================================================

-- Revogar acesso público à materialized view
-- Apenas usuários autenticados poderão acessá-la através de funções
REVOKE ALL ON institution_metrics FROM PUBLIC;
REVOKE ALL ON institution_metrics FROM anon;

-- Conceder acesso apenas a authenticated users
GRANT SELECT ON institution_metrics TO authenticated;

-- Remover a view que tentamos criar (não funcionou)
DROP VIEW IF EXISTS institution_metrics_view;

-- Criar função security definer para buscar métricas de forma segura
CREATE OR REPLACE FUNCTION get_institution_metrics(p_institution_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  is_active BOOLEAN,
  has_partnership BOOLEAN,
  total_users BIGINT,
  total_professionals BIGINT,
  total_active_coupons BIGINT,
  total_coupon_uses BIGINT,
  total_discount_given NUMERIC,
  last_user_added TIMESTAMPTZ,
  last_professional_added TIMESTAMPTZ,
  institution_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins e super_admins podem ver todas
  IF has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN QUERY
    SELECT * FROM institution_metrics
    WHERE p_institution_id IS NULL OR institution_metrics.id = p_institution_id;
    RETURN;
  END IF;

  -- Institution admins podem ver suas instituições
  RETURN QUERY
  SELECT * FROM institution_metrics
  WHERE institution_metrics.id IN (
    SELECT institution_id 
    FROM institution_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
  AND (p_institution_id IS NULL OR institution_metrics.id = p_institution_id);
END;
$$;

COMMENT ON FUNCTION get_institution_metrics IS 'Retorna métricas de instituições com verificação de permissões. Admins veem todas, institution admins veem apenas suas instituições.';