-- Fase 1: Adicionar novos campos à tabela institution_coupons
ALTER TABLE public.institution_coupons
  ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'institution_students', 'other_patients')),
  ADD COLUMN IF NOT EXISTS target_audience_user_ids UUID[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS professional_scope TEXT DEFAULT 'all_tenant' CHECK (professional_scope IN ('all_tenant', 'institution_professionals')),
  ADD COLUMN IF NOT EXISTS professional_scope_ids INTEGER[] DEFAULT NULL;

COMMENT ON COLUMN institution_coupons.target_audience IS 'Define o público-alvo: all (todos), institution_students (apenas alunos), other_patients (não-alunos)';
COMMENT ON COLUMN institution_coupons.target_audience_user_ids IS 'IDs específicos de usuários quando target_audience requer seleção específica';
COMMENT ON COLUMN institution_coupons.professional_scope IS 'Escopo de profissionais: all_tenant (todos do tenant), institution_professionals (apenas da instituição)';
COMMENT ON COLUMN institution_coupons.professional_scope_ids IS 'IDs específicos de profissionais quando professional_scope requer seleção específica';

-- Atualizar função validate_coupon com novas validações
CREATE OR REPLACE FUNCTION public.validate_coupon(
  _code text,
  _user_id uuid,
  _professional_id integer,
  _amount numeric,
  _tenant_id uuid
)
RETURNS TABLE(
  is_valid boolean,
  coupon_id uuid,
  discount_type text,
  discount_value numeric,
  discount_amount numeric,
  final_amount numeric,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_user_usage_count INTEGER;
  v_discount_amount NUMERIC;
  v_final_amount NUMERIC;
  v_professional_specialties TEXT[];
  v_is_institution_student BOOLEAN := false;
  v_professional_in_institution BOOLEAN := false;
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
  
  -- === NOVA VALIDAÇÃO: Target Audience ===
  -- Verificar se usuário é aluno da instituição do cupom
  SELECT EXISTS(
    SELECT 1 FROM patient_institutions pi
    INNER JOIN pacientes p ON p.id = pi.patient_id
    INNER JOIN profiles pr ON pr.id = p.profile_id
    WHERE pr.user_id = _user_id
      AND pi.institution_id = v_coupon.institution_id
      AND pi.enrollment_status = 'enrolled'
  ) INTO v_is_institution_student;

  -- Validar se cupom é apenas para alunos
  IF v_coupon.target_audience = 'institution_students' AND NOT v_is_institution_student THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Cupom válido apenas para alunos da instituição';
    RETURN;
  END IF;

  -- Validar se cupom é apenas para não-alunos
  IF v_coupon.target_audience = 'other_patients' AND v_is_institution_student THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Cupom não aplicável a alunos da instituição';
    RETURN;
  END IF;

  -- Validar se usuário está na lista específica (quando aplicável)
  IF v_coupon.target_audience_user_ids IS NOT NULL THEN
    IF NOT (_user_id = ANY(v_coupon.target_audience_user_ids)) THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Cupom não disponível para este usuário';
      RETURN;
    END IF;
  END IF;

  -- === NOVA VALIDAÇÃO: Professional Scope ===
  -- Verificar se profissional pertence à instituição
  IF v_coupon.professional_scope = 'institution_professionals' THEN
    SELECT EXISTS(
      SELECT 1 FROM professional_institutions pi
      WHERE pi.professional_id = _professional_id
        AND pi.institution_id = v_coupon.institution_id
        AND pi.is_active = true
    ) INTO v_professional_in_institution;
    
    IF NOT v_professional_in_institution THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Cupom aplicável apenas a profissionais da instituição';
      RETURN;
    END IF;
  END IF;

  -- Validar se profissional está na lista específica (quando aplicável)
  IF v_coupon.professional_scope_ids IS NOT NULL THEN
    IF NOT (_professional_id = ANY(v_coupon.professional_scope_ids)) THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'Cupom não aplicável a este profissional';
      RETURN;
    END IF;
  END IF;
  
  -- === VALIDAÇÕES EXISTENTES ===
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
  
  -- Verificar aplicabilidade ao profissional (lógica existente)
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
$function$;