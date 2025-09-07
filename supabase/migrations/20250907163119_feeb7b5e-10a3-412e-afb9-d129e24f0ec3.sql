-- Remover todas as políticas de INSERT conflitantes e recriar apenas uma
DROP POLICY IF EXISTS "Allow booking creation for users and guests" ON public.agendamentos;

-- Criar política única e clara para INSERT
CREATE POLICY "Enable booking creation for authenticated and guest users" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  -- Permite usuários autenticados com seu próprio user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  -- Permite visitantes com UUID fixo quando não logados
  (auth.uid() IS NULL AND user_id = '11111111-1111-1111-1111-111111111111'::uuid)
);