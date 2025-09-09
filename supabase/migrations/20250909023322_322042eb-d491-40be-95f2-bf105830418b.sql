-- Create admin user profile if it doesn't exist
INSERT INTO profiles (user_id, nome, email, tipo_usuario, created_at, updated_at) 
VALUES ('ca482962-8f91-4944-9350-51668c9c3e36', 'Administrador AloPsi', 'alopsi.host@gmail.com', 'admin', now(), now())
ON CONFLICT (user_id) 
DO UPDATE SET tipo_usuario = 'admin';