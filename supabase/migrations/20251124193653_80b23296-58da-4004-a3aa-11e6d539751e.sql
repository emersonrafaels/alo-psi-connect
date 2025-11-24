-- Fase 1: Criar tabela user_tenants (junction table para multi-tenant)
CREATE TABLE IF NOT EXISTS user_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(user_id, tenant_id)
);

-- Índices para performance
CREATE INDEX idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX idx_user_tenants_primary ON user_tenants(user_id) WHERE is_primary = true;

-- Constraint: Garantir apenas um tenant primário por usuário
CREATE UNIQUE INDEX idx_user_tenants_one_primary_per_user 
ON user_tenants(user_id) 
WHERE is_primary = true;

-- Migrar dados existentes de profiles.tenant_id para user_tenants
INSERT INTO user_tenants (user_id, tenant_id, is_primary)
SELECT id, tenant_id, true
FROM profiles
WHERE tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Enable RLS
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- Super admins podem gerenciar todos
CREATE POLICY "super_admins_manage_all_user_tenants"
ON user_tenants FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Admins podem gerenciar tenants
CREATE POLICY "admins_manage_tenant_user_tenants"
ON user_tenants FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Usuários podem ver seus próprios tenants
CREATE POLICY "users_view_own_tenants"
ON user_tenants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION update_user_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tenants_updated_at_trigger
BEFORE UPDATE ON user_tenants
FOR EACH ROW
EXECUTE FUNCTION update_user_tenants_updated_at();

-- Trigger de sincronização: quando is_primary=true, atualizar profiles.tenant_id
CREATE OR REPLACE FUNCTION sync_profile_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando is_primary = true, atualizar profiles.tenant_id para compatibilidade
  IF NEW.is_primary = true THEN
    UPDATE profiles
    SET tenant_id = NEW.tenant_id
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_profile_tenant_id_trigger
AFTER INSERT OR UPDATE OF is_primary ON user_tenants
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION sync_profile_tenant_id();