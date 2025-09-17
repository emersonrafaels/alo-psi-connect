-- Corrigir problemas de segurança detectados

-- 1. Corrigir search_path das funções criadas
ALTER FUNCTION public.parse_php_serialized_array(text) 
SET search_path = public;

ALTER FUNCTION public.normalize_specialties(text[]) 
SET search_path = public;

-- 2. Adicionar trigger para normalizar automaticamente novos dados (com search_path correto)
CREATE OR REPLACE FUNCTION public.normalize_professional_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Normalizar serviços se servicos_raw foi alterado
    IF NEW.servicos_raw IS DISTINCT FROM OLD.servicos_raw THEN
        NEW.servicos_normalizados := public.normalize_specialties(
            public.parse_php_serialized_array(NEW.servicos_raw)
        );
    END IF;
    
    -- Normalizar formação se formacao_raw foi alterado
    IF NEW.formacao_raw IS DISTINCT FROM OLD.formacao_raw THEN
        NEW.formacao_normalizada := public.parse_php_serialized_array(NEW.formacao_raw);
    END IF;
    
    -- Garantir preço mínimo para profissionais ativos
    IF NEW.ativo = true AND (NEW.preco_consulta IS NULL OR NEW.preco_consulta = 0) THEN
        NEW.preco_consulta := 120.00;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_normalize_professional_data'
    ) THEN
        CREATE TRIGGER trigger_normalize_professional_data
            BEFORE UPDATE ON public.profissionais
            FOR EACH ROW
            EXECUTE FUNCTION public.normalize_professional_data();
    END IF;
END $$;