-- Forçar drop da política conflitante
DROP POLICY IF EXISTS "Allow booking creation for users and guests" ON public.agendamentos;

-- Criar nova política corrigida que permite visitantes
CREATE POLICY "Allow booking creation for users and guests" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  -- Usuários logados: auth.uid() deve ser igual ao user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  -- Visitantes: auth.uid() é NULL e user_id é o UUID fixo de visitante
  (auth.uid() IS NULL AND user_id = '11111111-1111-1111-1111-111111111111'::uuid)
);