-- Add UNIQUE constraint on profile_id in profissionais table
-- This is required by the sync_profile_tipo_usuario() trigger
-- which uses ON CONFLICT (profile_id)

-- First, check if there are any duplicate profile_id values
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT profile_id, COUNT(*) as count
    FROM profissionais
    WHERE profile_id IS NOT NULL
    GROUP BY profile_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate profile_id values', duplicate_count;
    
    -- Keep the most recent record for each profile_id (highest id)
    DELETE FROM profissionais
    WHERE id NOT IN (
      SELECT MAX(id)
      FROM profissionais
      WHERE profile_id IS NOT NULL
      GROUP BY profile_id
    ) AND profile_id IS NOT NULL;
    
    RAISE NOTICE 'Duplicates cleaned up';
  ELSE
    RAISE NOTICE 'No duplicates found';
  END IF;
END $$;

-- Now add the UNIQUE constraint
ALTER TABLE profissionais 
ADD CONSTRAINT profissionais_profile_id_key 
UNIQUE (profile_id);

-- Add index for better performance on profile_id lookups
CREATE INDEX IF NOT EXISTS idx_profissionais_profile_id 
ON profissionais(profile_id) 
WHERE profile_id IS NOT NULL;