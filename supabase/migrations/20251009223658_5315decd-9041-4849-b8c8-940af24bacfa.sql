-- Add header_color column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS header_color TEXT;

-- Add comment to column
COMMENT ON COLUMN tenants.header_color IS 'Specific color for the header (hexadecimal or HSL format)';