-- Add cross-tenant navigation warning columns to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS cross_tenant_navigation_warning_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cross_tenant_navigation_warning_title TEXT,
ADD COLUMN IF NOT EXISTS cross_tenant_navigation_warning_message TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.tenants.cross_tenant_navigation_warning_enabled IS 'Enable/disable warning modal when navigating to this tenant from another';
COMMENT ON COLUMN public.tenants.cross_tenant_navigation_warning_title IS 'Custom title for the under construction modal';
COMMENT ON COLUMN public.tenants.cross_tenant_navigation_warning_message IS 'Custom message for the under construction modal';