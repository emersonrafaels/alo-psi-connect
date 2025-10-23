-- Criar tabela de instituições de ensino
CREATE TABLE IF NOT EXISTS public.educational_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  has_partnership BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT educational_institutions_name_unique UNIQUE (name)
);

-- Criar tabela de associação paciente-instituição
CREATE TABLE IF NOT EXISTS public.patient_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  enrollment_status TEXT NOT NULL DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'graduated', 'inactive')),
  enrollment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT patient_institutions_unique UNIQUE (patient_id, institution_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_educational_institutions_active ON public.educational_institutions(is_active);
CREATE INDEX IF NOT EXISTS idx_educational_institutions_type ON public.educational_institutions(type);
CREATE INDEX IF NOT EXISTS idx_educational_institutions_partnership ON public.educational_institutions(has_partnership);
CREATE INDEX IF NOT EXISTS idx_patient_institutions_patient ON public.patient_institutions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_institutions_institution ON public.patient_institutions(institution_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_educational_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_educational_institutions_updated_at
BEFORE UPDATE ON public.educational_institutions
FOR EACH ROW
EXECUTE FUNCTION public.update_educational_institutions_updated_at();

-- Habilitar RLS
ALTER TABLE public.educational_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_institutions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para educational_institutions
CREATE POLICY "Anyone can view active institutions"
  ON public.educational_institutions
  FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all institutions"
  ON public.educational_institutions
  FOR ALL
  USING (is_admin(auth.uid()));

-- Políticas RLS para patient_institutions
CREATE POLICY "Admins can view all patient institutions"
  ON public.patient_institutions
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all patient institutions"
  ON public.patient_institutions
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Patients can view their own institutions"
  ON public.patient_institutions
  FOR SELECT
  USING (patient_id IN (
    SELECT id FROM public.pacientes WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

-- Migrar dados existentes do JSON para a tabela
DO $$
DECLARE
  institution_name TEXT;
  institution_names JSONB;
BEGIN
  -- Buscar a lista de instituições do sistema de configurações
  SELECT value INTO institution_names
  FROM system_configurations
  WHERE category = 'registration' AND key = 'educational_institutions' AND tenant_id IS NULL;
  
  -- Se encontrou dados, migrar
  IF institution_names IS NOT NULL THEN
    FOR institution_name IN SELECT jsonb_array_elements_text(institution_names)
    LOOP
      INSERT INTO public.educational_institutions (name, type, has_partnership, is_active)
      VALUES (
        institution_name,
        -- Inferir tipo baseado no nome
        CASE 
          WHEN institution_name ILIKE '%federal%' OR institution_name ILIKE '%estadual%' OR institution_name ILIKE '%unb%' THEN 'public'
          ELSE 'private'
        END,
        false, -- Inicialmente sem parceria
        true   -- Ativa por padrão
      )
      ON CONFLICT (name) DO NOTHING;
    END LOOP;
  END IF;
END $$;