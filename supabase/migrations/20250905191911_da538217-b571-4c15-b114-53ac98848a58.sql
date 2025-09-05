-- Remover a política atual que está causando conflito
DROP POLICY IF EXISTS "Users can create appointments" ON public.agendamentos;

-- Criar política específica para visitantes (sem autenticação)
CREATE POLICY "Allow guest appointments"
ON public.agendamentos
FOR INSERT
TO public
WITH CHECK (user_id IS NULL);

-- Criar política específica para usuários logados
CREATE POLICY "Allow authenticated user appointments"
ON public.agendamentos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);