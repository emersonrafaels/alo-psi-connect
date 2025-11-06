-- Tabela para vincular profissionais a instituições educacionais
CREATE TABLE IF NOT EXISTS public.professional_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id INTEGER NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'employee', -- 'employee', 'consultant', 'supervisor', 'intern'
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garantir que não haja duplicatas
  UNIQUE(professional_id, institution_id)
);

-- Índices para performance
CREATE INDEX idx_professional_institutions_professional ON public.professional_institutions(professional_id);
CREATE INDEX idx_professional_institutions_institution ON public.professional_institutions(institution_id);
CREATE INDEX idx_professional_institutions_active ON public.professional_institutions(is_active);

-- RLS Policies
ALTER TABLE public.professional_institutions ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todos os vínculos
CREATE POLICY "Admins can manage all professional institutions"
  ON public.professional_institutions
  FOR ALL
  USING (is_admin(auth.uid()));

-- Profissionais podem ver suas próprias instituições
CREATE POLICY "Professionals can view their own institutions"
  ON public.professional_institutions
  FOR SELECT
  USING (
    professional_id IN (
      SELECT p.id
      FROM profissionais p
      JOIN profiles pr ON p.profile_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  );

-- Qualquer pessoa pode ver instituições de profissionais ativos
CREATE POLICY "Anyone can view institutions of active professionals"
  ON public.professional_institutions
  FOR SELECT
  USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_professional_institutions_updated_at
  BEFORE UPDATE ON public.professional_institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();