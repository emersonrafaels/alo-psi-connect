-- =====================================================
-- SISTEMA DE PROMOÇÕES E CUPONS PARA INSTITUIÇÕES
-- =====================================================

-- 1. Criar tabela de cupons/promoções
CREATE TABLE IF NOT EXISTS public.institution_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  
  -- Informações básicas
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tipo e valor do desconto
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_discount_amount NUMERIC, -- Limite máximo para descontos percentuais
  
  -- Aplicabilidade
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_professionals', 'specific_specialties', 'first_appointment')),
  applicable_professional_ids INTEGER[], -- IDs dos profissionais específicos
  applicable_specialties TEXT[], -- Especialidades específicas
  
  -- Condições de uso
  minimum_purchase_amount NUMERIC DEFAULT 0,
  maximum_uses INTEGER, -- Limite total de usos
  uses_per_user INTEGER DEFAULT 1, -- Limite por usuário
  current_usage_count INTEGER DEFAULT 0,
  
  -- Validade
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Controle interno
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Metadados adicionais (flexível para futuras expansões)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Tabela para rastrear uso de cupons
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.institution_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.agendamentos(id),
  
  -- Detalhes do uso
  original_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  final_amount NUMERIC NOT NULL,
  
  -- Quando foi usado
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_institution_coupons_institution_id ON public.institution_coupons(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_coupons_code ON public.institution_coupons(code);
CREATE INDEX IF NOT EXISTS idx_institution_coupons_valid_dates ON public.institution_coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_institution_coupons_tenant_id ON public.institution_coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);

-- 4. Habilitar RLS
ALTER TABLE public.institution_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies para institution_coupons
CREATE POLICY "Admins can manage all coupons"
ON public.institution_coupons
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view active coupons"
ON public.institution_coupons
FOR SELECT
USING (
  is_active = true 
  AND valid_from <= now() 
  AND (valid_until IS NULL OR valid_until >= now())
);

CREATE POLICY "Institution admins can view their coupons"
ON public.institution_coupons
FOR SELECT
USING (
  institution_id IN (
    SELECT institution_id 
    FROM public.institution_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 6. RLS Policies para coupon_usage
CREATE POLICY "Admins can view all coupon usage"
ON public.coupon_usage
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own coupon usage"
ON public.coupon_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert coupon usage"
ON public.coupon_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 7. Função para validar cupom
CREATE OR REPLACE FUNCTION public.validate_coupon(
  _code TEXT,
  _user_id UUID,
  _professional_id INTEGER,
  _amount NUMERIC,
  _tenant_id UUID
)
RETURNS TABLE(
  is_valid BOOLEAN,
  coupon_id UUID,
  discount_type TEXT,
  discount_value NUMERIC,
  discount_amount NUMERIC,
  final_amount NUMERIC,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_user_usage_count INTEGER;
  v_discount_amount NUMERIC;
  v_final_amount NUMERIC;
  v_professional_specialties TEXT[];
BEGIN
  -- Buscar cupom
  SELECT * INTO v_coupon
  FROM public.institution_coupons
  WHERE code = _code
    AND is_active = true
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until >= now())
    AND (tenant_id IS NULL OR tenant_id = _tenant_id);
  
  -- Verificar se cupom existe
  IF v_coupon.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Cupom inválido ou expirado';
    RETURN;
  END IF;
  
  -- Verificar limite total de usos
  IF v_coupon.maximum_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.coupon_usage
    WHERE coupon_id = v_coupon.id;
    
    IF v_usage_count >= v_coupon.maximum_uses THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Cupom esgotado';
      RETURN;
    END IF;
  END IF;
  
  -- Verificar limite por usuário
  SELECT COUNT(*) INTO v_user_usage_count
  FROM public.coupon_usage
  WHERE coupon_id = v_coupon.id AND user_id = _user_id;
  
  IF v_user_usage_count >= v_coupon.uses_per_user THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Você já utilizou este cupom';
    RETURN;
  END IF;
  
  -- Verificar valor mínimo
  IF _amount < v_coupon.minimum_purchase_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 
      'Valor mínimo de R$ ' || v_coupon.minimum_purchase_amount || ' não atingido';
    RETURN;
  END IF;
  
  -- Verificar aplicabilidade ao profissional
  IF v_coupon.applies_to = 'specific_professionals' THEN
    IF NOT (_professional_id = ANY(v_coupon.applicable_professional_ids)) THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 
        'Cupom não aplicável a este profissional';
      RETURN;
    END IF;
  END IF;
  
  -- Verificar aplicabilidade às especialidades
  IF v_coupon.applies_to = 'specific_specialties' THEN
    SELECT servicos_normalizados INTO v_professional_specialties
    FROM public.profissionais
    WHERE id = _professional_id;
    
    IF NOT (v_professional_specialties && v_coupon.applicable_specialties) THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 
        'Cupom não aplicável às especialidades deste profissional';
      RETURN;
    END IF;
  END IF;
  
  -- Calcular desconto
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := (_amount * v_coupon.discount_value / 100);
    -- Aplicar limite máximo se existir
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.max_discount_amount THEN
      v_discount_amount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_discount_amount := v_coupon.discount_value;
    -- Desconto não pode ser maior que o valor
    IF v_discount_amount > _amount THEN
      v_discount_amount := _amount;
    END IF;
  END IF;
  
  v_final_amount := _amount - v_discount_amount;
  
  -- Retornar cupom válido
  RETURN QUERY SELECT 
    true,
    v_coupon.id,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_discount_amount,
    v_final_amount,
    NULL::TEXT;
END;
$$;

-- 8. Trigger para atualizar updated_at
CREATE TRIGGER update_institution_coupons_updated_at
  BEFORE UPDATE ON public.institution_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Comentários
COMMENT ON TABLE public.institution_coupons IS 'Cupons e promoções para instituições parceiras';
COMMENT ON TABLE public.coupon_usage IS 'Histórico de uso de cupons pelos usuários';
COMMENT ON FUNCTION public.validate_coupon IS 'Valida cupom e retorna detalhes do desconto';