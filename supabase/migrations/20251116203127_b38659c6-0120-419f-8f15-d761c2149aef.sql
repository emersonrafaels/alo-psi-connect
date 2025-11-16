-- =====================================================
-- FASE 3.1 - FUNDAÇÃO: Tabelas, Views e Funções
-- =====================================================

-- =====================================================
-- 1) ENUM para permissões granulares
-- =====================================================
CREATE TYPE institution_permission AS ENUM (
  'view_users',
  'add_users',
  'remove_users',
  'edit_users',
  'view_professionals',
  'add_professionals',
  'remove_professionals',
  'edit_professionals',
  'view_coupons',
  'create_coupons',
  'edit_coupons',
  'delete_coupons',
  'view_analytics',
  'export_data',
  'manage_permissions',
  'view_audit_log'
);

-- =====================================================
-- 2) TABELA: institution_audit_log
-- =====================================================
CREATE TABLE institution_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES educational_institutions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'link_user', 'unlink_user', 'add_professional', 'remove_professional', 'create_coupon', 'update_coupon', 'delete_coupon'
  entity_type TEXT NOT NULL, -- 'institution', 'user', 'professional', 'coupon'
  entity_id UUID,
  performed_by UUID,
  changes_summary JSONB, -- {"field": "name", "old": "Antiga", "new": "Nova"}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_audit_institution ON institution_audit_log(institution_id);
CREATE INDEX idx_audit_performed_by ON institution_audit_log(performed_by);
CREATE INDEX idx_audit_created_at ON institution_audit_log(created_at DESC);
CREATE INDEX idx_audit_action_type ON institution_audit_log(action_type);
CREATE INDEX idx_audit_entity_type ON institution_audit_log(entity_type);

-- RLS
ALTER TABLE institution_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all audit logs"
ON institution_audit_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Institution admins podem ver logs de suas instituições
CREATE POLICY "Institution admins can view their institution logs"
ON institution_audit_log FOR SELECT
TO authenticated
USING (user_belongs_to_institution(auth.uid(), institution_id));

-- Sistema pode inserir logs
CREATE POLICY "System can insert audit logs"
ON institution_audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = performed_by);

-- =====================================================
-- 3) TABELA: institution_user_permissions
-- =====================================================
CREATE TABLE institution_user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_user_id UUID REFERENCES institution_users(id) ON DELETE CASCADE,
  permission institution_permission NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_user_id, permission)
);

-- Índices
CREATE INDEX idx_permissions_user ON institution_user_permissions(institution_user_id);
CREATE INDEX idx_permissions_permission ON institution_user_permissions(permission);

-- RLS
ALTER TABLE institution_user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
ON institution_user_permissions FOR SELECT
TO authenticated
USING (
  institution_user_id IN (
    SELECT id FROM institution_users WHERE user_id = auth.uid()
  )
);

-- Institution admins can manage permissions
CREATE POLICY "Institution admins can manage permissions"
ON institution_user_permissions FOR ALL
TO authenticated
USING (
  institution_user_id IN (
    SELECT iu.id FROM institution_users iu
    WHERE iu.institution_id IN (
      SELECT institution_id FROM institution_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Super admins can manage all permissions
CREATE POLICY "Super admins can manage all permissions"
ON institution_user_permissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =====================================================
-- 4) TABELA: saved_filters
-- =====================================================
CREATE TABLE saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_default ON saved_filters(is_default);

-- RLS
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can manage their own saved filters
CREATE POLICY "Users can manage their own saved filters"
ON saved_filters FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 5) MATERIALIZED VIEW: institution_metrics
-- =====================================================
CREATE MATERIALIZED VIEW institution_metrics AS
SELECT 
  ei.id,
  ei.name,
  ei.type,
  ei.is_active,
  ei.has_partnership,
  COUNT(DISTINCT iu.user_id) FILTER (WHERE iu.is_active = true) as total_users,
  COUNT(DISTINCT pi.professional_id) FILTER (WHERE pi.is_active = true) as total_professionals,
  COUNT(DISTINCT ic.id) FILTER (WHERE ic.is_active = true) as total_active_coupons,
  COUNT(DISTINCT cu.id) as total_coupon_uses,
  COALESCE(SUM(cu.discount_amount), 0) as total_discount_given,
  MAX(iu.created_at) as last_user_added,
  MAX(pi.created_at) as last_professional_added,
  ei.created_at as institution_created_at
FROM educational_institutions ei
LEFT JOIN institution_users iu ON ei.id = iu.institution_id
LEFT JOIN professional_institutions pi ON ei.id = pi.institution_id
LEFT JOIN institution_coupons ic ON ei.id = ic.institution_id
LEFT JOIN coupon_usage cu ON ic.id = cu.coupon_id
GROUP BY ei.id, ei.name, ei.type, ei.is_active, ei.has_partnership, ei.created_at;

-- Índice na view materializada
CREATE UNIQUE INDEX idx_institution_metrics_id ON institution_metrics(id);
CREATE INDEX idx_institution_metrics_type ON institution_metrics(type);
CREATE INDEX idx_institution_metrics_active ON institution_metrics(is_active);

-- =====================================================
-- 6) FUNÇÃO: has_institution_permission
-- =====================================================
CREATE OR REPLACE FUNCTION has_institution_permission(
  _user_id UUID,
  _institution_id UUID,
  _permission institution_permission
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admins têm todas as permissões
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role IN ('super_admin'::app_role, 'admin'::app_role)
  ) THEN
    RETURN TRUE;
  END IF;

  -- Admin da instituição tem todas as permissões
  IF EXISTS (
    SELECT 1 FROM institution_users
    WHERE user_id = _user_id
    AND institution_id = _institution_id
    AND role = 'admin'
    AND is_active = true
  ) THEN
    RETURN TRUE;
  END IF;

  -- Verificar permissão específica
  RETURN EXISTS (
    SELECT 1 
    FROM institution_user_permissions iup
    JOIN institution_users iu ON iup.institution_user_id = iu.id
    WHERE iu.user_id = _user_id
    AND iu.institution_id = _institution_id
    AND iup.permission = _permission
    AND iu.is_active = true
  );
END;
$$;

-- =====================================================
-- 7) FUNÇÃO: refresh_institution_metrics
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_institution_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY institution_metrics;
END;
$$;

-- =====================================================
-- 8) TRIGGER: atualizar updated_at em saved_filters
-- =====================================================
CREATE OR REPLACE FUNCTION update_saved_filters_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER saved_filters_updated_at
BEFORE UPDATE ON saved_filters
FOR EACH ROW
EXECUTE FUNCTION update_saved_filters_updated_at();

-- =====================================================
-- 9) COMENTÁRIOS nas tabelas (documentação)
-- =====================================================
COMMENT ON TABLE institution_audit_log IS 'Registro de todas as ações realizadas em instituições e entidades relacionadas';
COMMENT ON TABLE institution_user_permissions IS 'Permissões granulares para usuários de instituições';
COMMENT ON TABLE saved_filters IS 'Filtros salvos pelos usuários para busca de instituições';
COMMENT ON MATERIALIZED VIEW institution_metrics IS 'Métricas agregadas de instituições para analytics e dashboard';
COMMENT ON FUNCTION has_institution_permission IS 'Verifica se um usuário tem uma permissão específica em uma instituição';
COMMENT ON FUNCTION refresh_institution_metrics IS 'Atualiza a view materializada de métricas de instituições';