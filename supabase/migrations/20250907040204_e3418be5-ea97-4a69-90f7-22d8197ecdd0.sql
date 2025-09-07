-- Remove a política atual que está falhando para visitantes
DROP POLICY IF EXISTS "Allow booking creation" ON public.agendamentos;

-- Criar nova política simples e robusta para criação de agendamentos
-- Permite: usuários logados (auth.uid() = user_id) OU visitantes (user_id = UUID fixo)
CREATE POLICY "Allow booking creation for users and guests" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id = '11111111-1111-1111-1111-111111111111')
);

-- Atualizar política de visualização para excluir agendamentos de visitantes
-- (visitantes não devem ver histórico)
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.agendamentos;

CREATE POLICY "Users can view their own appointments" 
ON public.agendamentos 
FOR SELECT 
USING (
  auth.uid() = user_id AND 
  user_id != '11111111-1111-1111-1111-111111111111'
);