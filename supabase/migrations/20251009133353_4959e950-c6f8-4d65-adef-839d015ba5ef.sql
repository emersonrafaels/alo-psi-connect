-- Add unique constraint and validation for tenant slugs
ALTER TABLE tenants 
  ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);

-- Add check constraint for valid slug format (lowercase, alphanumeric, hyphens)
ALTER TABLE tenants 
  ADD CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9-]+$');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_professional_tenants_tenant_id ON professional_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_professional_tenants_professional_id ON professional_tenants(professional_id);