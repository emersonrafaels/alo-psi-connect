-- Update the tipo_usuario constraint to allow the new role names
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

-- Add new constraint with cliente, profissional, admin
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_usuario_check 
CHECK (tipo_usuario IN ('cliente', 'profissional', 'admin'));

-- Migrate existing 'paciente' data to 'cliente'
UPDATE public.profiles SET tipo_usuario = 'cliente' WHERE tipo_usuario = 'paciente';

-- Update pacientes table references (this table stores additional patient info)
-- The table name will remain 'pacientes' for backwards compatibility but represents 'clientes' now
COMMENT ON TABLE public.pacientes IS 'Additional information for users with tipo_usuario = cliente (formerly paciente)';