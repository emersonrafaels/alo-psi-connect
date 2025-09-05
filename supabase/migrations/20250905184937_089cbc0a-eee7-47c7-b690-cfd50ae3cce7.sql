-- Corrigir política RLS para INSERT na tabela agendamentos
-- Primeiro, remover a política existente que está causando problemas
DROP POLICY IF EXISTS "Allow appointment creation for users and guests" ON public.agendamentos;

-- Criar nova política mais específica e clara
CREATE POLICY "Users can create appointments" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  -- Permitir se user_id é NULL (usuário convidado/visitante)
  (user_id IS NULL) 
  OR 
  -- Permitir se user_id corresponde ao usuário autenticado
  (user_id IS NOT NULL AND auth.uid() = user_id)
);

-- Adicionar um comentário para documentar a política
COMMENT ON POLICY "Users can create appointments" ON public.agendamentos IS 
'Permite criação de agendamentos tanto para usuários autenticados quanto para visitantes/convidados';