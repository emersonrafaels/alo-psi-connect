-- Função para buscar instituições não catalogadas
CREATE OR REPLACE FUNCTION public.get_uncatalogued_institutions()
RETURNS TABLE (
  name text,
  patient_count bigint,
  first_mention timestamp with time zone,
  last_mention timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT 
    p.instituicao_ensino as name,
    COUNT(*)::bigint as patient_count,
    MIN(p.created_at) as first_mention,
    MAX(p.created_at) as last_mention
  FROM pacientes p
  WHERE p.instituicao_ensino IS NOT NULL 
    AND p.instituicao_ensino != ''
    AND NOT EXISTS (
      SELECT 1 FROM educational_institutions ei 
      WHERE LOWER(TRIM(ei.name)) = LOWER(TRIM(p.instituicao_ensino))
    )
  GROUP BY p.instituicao_ensino
  ORDER BY COUNT(*) DESC, p.instituicao_ensino ASC
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_uncatalogued_institutions() TO authenticated;