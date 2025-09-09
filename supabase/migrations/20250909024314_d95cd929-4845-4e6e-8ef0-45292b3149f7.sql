-- Update tipo_usuario constraint to use 'paciente' instead of 'cliente'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

-- Update existing 'cliente' records to 'paciente'
UPDATE profiles SET tipo_usuario = 'paciente' WHERE tipo_usuario = 'cliente';

-- Add new constraint with 'paciente', 'profissional', and 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_tipo_usuario_check 
CHECK (tipo_usuario IN ('paciente', 'profissional', 'admin'));

-- Update table comment
COMMENT ON TABLE pacientes IS 'Informações específicas de pacientes (estudantes)';

-- Update admin user profile to use correct role
UPDATE profiles SET tipo_usuario = 'admin' 
WHERE email = 'alopsi.host@gmail.com' AND tipo_usuario != 'admin';