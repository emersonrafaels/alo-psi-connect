-- Adicionar coluna tenant_id à tabela system_configurations
ALTER TABLE public.system_configurations 
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Comentário explicativo
COMMENT ON COLUMN public.system_configurations.tenant_id IS 
'ID do tenant. NULL = configuração global (fallback para todos os tenants)';

-- Remover constraint única antiga (usando DROP CONSTRAINT em vez de DROP INDEX)
ALTER TABLE public.system_configurations 
DROP CONSTRAINT IF EXISTS system_configurations_category_key_key;

-- Criar nova constraint única considerando tenant_id
-- Usa COALESCE para garantir unicidade quando tenant_id é NULL
CREATE UNIQUE INDEX IF NOT EXISTS system_configurations_category_key_tenant_key 
ON public.system_configurations(category, key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Criar índice para performance em queries por tenant
CREATE INDEX IF NOT EXISTS idx_system_configurations_tenant 
ON public.system_configurations(tenant_id, category) 
WHERE tenant_id IS NOT NULL;

-- Criar índice para configs globais
CREATE INDEX IF NOT EXISTS idx_system_configurations_global 
ON public.system_configurations(category, key) 
WHERE tenant_id IS NULL;

-- Remover policies antigas
DROP POLICY IF EXISTS "Admins can view all system configs" ON public.system_configurations;
DROP POLICY IF EXISTS "Super admins can manage system configs" ON public.system_configurations;

-- Policy para SELECT: admins veem configs do seu tenant + globais
CREATE POLICY "Users can view tenant and global configs"
ON public.system_configurations FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  (
    has_role(auth.uid(), 'admin'::app_role) AND 
    (
      tenant_id = get_current_tenant_id() OR
      tenant_id IS NULL
    )
  )
);

-- Policy para INSERT/UPDATE/DELETE: admins gerenciam configs do seu tenant
CREATE POLICY "Admins can manage their tenant configs"
ON public.system_configurations FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  (
    has_role(auth.uid(), 'admin'::app_role) AND 
    (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  (
    has_role(auth.uid(), 'admin'::app_role) AND 
    tenant_id = get_current_tenant_id()
  )
);