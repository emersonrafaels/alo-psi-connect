-- Add featured fields to professionals table
ALTER TABLE public.profissionais 
ADD COLUMN em_destaque boolean DEFAULT false,
ADD COLUMN ordem_destaque integer DEFAULT NULL;

-- Add index for better performance when querying featured professionals
CREATE INDEX idx_profissionais_em_destaque ON public.profissionais(em_destaque, ordem_destaque) WHERE em_destaque = true;

-- Update RLS policies to allow viewing featured status
-- The existing policy "Everyone can view active professionals" already covers this

-- Add a comment to document the new fields
COMMENT ON COLUMN public.profissionais.em_destaque IS 'Indica se o profissional aparece na seção de destaque da homepage';
COMMENT ON COLUMN public.profissionais.ordem_destaque IS 'Ordem de exibição na seção de destaque (1 = primeiro, 2 = segundo, etc.)';