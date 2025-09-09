-- Step 1: Drop the dependent RLS policies that reference professional_id
DROP POLICY IF EXISTS "Professionals can update their appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Users and professionals can view appointments" ON public.agendamentos;

-- Step 2: Add a temporary column to store the numeric professional_id
ALTER TABLE public.agendamentos 
ADD COLUMN professional_id_temp INTEGER;

-- Step 3: Update the temporary column with the correct numeric ID based on the profile_id mapping
UPDATE public.agendamentos 
SET professional_id_temp = p.id
FROM public.profissionais p
WHERE p.profile_id = agendamentos.professional_id;

-- Step 4: Drop the old UUID column
ALTER TABLE public.agendamentos 
DROP COLUMN professional_id;

-- Step 5: Rename the temporary column to professional_id
ALTER TABLE public.agendamentos 
RENAME COLUMN professional_id_temp TO professional_id;

-- Step 6: Add NOT NULL constraint to the new column
ALTER TABLE public.agendamentos 
ALTER COLUMN professional_id SET NOT NULL;

-- Step 7: Add foreign key constraint to maintain referential integrity
ALTER TABLE public.agendamentos 
ADD CONSTRAINT fk_agendamentos_professional_id 
FOREIGN KEY (professional_id) REFERENCES public.profissionais(id);

-- Step 8: Create index for better query performance
CREATE INDEX idx_agendamentos_professional_id ON public.agendamentos(professional_id);

-- Step 9: Recreate the RLS policies with the new numeric professional_id
CREATE POLICY "Professionals can update their appointments" 
ON public.agendamentos 
FOR UPDATE 
USING (professional_id IN (
  SELECT p.id
  FROM public.profissionais p
  JOIN public.profiles pr ON p.profile_id = pr.id
  WHERE pr.user_id = auth.uid()
));

CREATE POLICY "Users and professionals can view appointments" 
ON public.agendamentos 
FOR SELECT 
USING (
  is_admin(auth.uid()) OR 
  ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id) AND (user_id <> '11111111-1111-1111-1111-111111111111'::uuid)) OR 
  (professional_id IN (
    SELECT p.id
    FROM public.profissionais p
    JOIN public.profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ))
);