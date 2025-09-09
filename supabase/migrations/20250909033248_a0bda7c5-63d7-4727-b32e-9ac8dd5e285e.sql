-- First, we need to create a mapping table to convert existing UUID professional_ids to numeric IDs
-- This will help us migrate existing data properly

-- Step 1: Add a temporary column to store the numeric professional_id
ALTER TABLE public.agendamentos 
ADD COLUMN professional_id_temp INTEGER;

-- Step 2: Update the temporary column with the correct numeric ID based on the profile_id mapping
UPDATE public.agendamentos 
SET professional_id_temp = p.id
FROM public.profissionais p
WHERE p.profile_id = agendamentos.professional_id;

-- Step 3: Verify all records have been mapped (optional check)
-- Any records with NULL in professional_id_temp indicate missing mappings

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