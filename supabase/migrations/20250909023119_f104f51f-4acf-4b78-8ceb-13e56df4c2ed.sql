-- First, update existing 'paciente' data to 'cliente'
UPDATE public.profiles SET tipo_usuario = 'cliente' WHERE tipo_usuario = 'paciente';

-- Drop the old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

-- Add new constraint with cliente, profissional, admin
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_usuario_check 
CHECK (tipo_usuario IN ('cliente', 'profissional', 'admin'));

-- Update pacientes table comment to reflect the new naming
COMMENT ON TABLE public.pacientes IS 'Additional information for users with tipo_usuario = cliente (formerly paciente)';