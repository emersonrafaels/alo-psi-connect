-- Atualizar política RLS da tabela agendamentos para permitir agendamentos de visitantes
-- Remover a política existente que exige user_id = auth.uid()
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.agendamentos;

-- Criar nova política que permite tanto usuários logados quanto visitantes
CREATE POLICY "Allow appointment creation for users and guests" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  -- Permitir se user_id é null (visitante) OU se auth.uid() = user_id (usuário logado)
  user_id IS NULL OR auth.uid() = user_id
);

-- Também atualizar a política de SELECT para permitir que profissionais vejam agendamentos feitos para eles
-- independente de ter user_id ou não
DROP POLICY IF EXISTS "Professionals can view their appointments" ON public.agendamentos;

CREATE POLICY "Professionals can view their appointments including guest bookings" 
ON public.agendamentos 
FOR SELECT 
USING (
  -- Manter acesso de admins
  is_admin(auth.uid()) OR
  -- Usuários podem ver seus próprios agendamentos
  (user_id IS NOT NULL AND auth.uid() = user_id) OR
  -- Profissionais podem ver agendamentos feitos para eles (incluindo de visitantes)
  (professional_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ))
);