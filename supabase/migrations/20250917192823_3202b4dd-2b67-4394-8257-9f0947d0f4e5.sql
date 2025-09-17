-- Função para deserializar dados PHP em formato a:N:{...}
CREATE OR REPLACE FUNCTION public.parse_php_serialized_array(php_data text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    result text[] := '{}';
    item_pattern text;
    item_matches text[];
    item_value text;
BEGIN
    -- Se o dado for nulo ou vazio, retorna array vazio
    IF php_data IS NULL OR php_data = '' THEN
        RETURN result;
    END IF;
    
    -- Pattern para extrair valores de strings PHP serializadas
    -- Busca por s:N:"valor" onde N é o tamanho da string
    item_pattern := 's:\d+:"([^"]*)"';
    
    -- Extrai todos os valores usando regex
    FOR item_value IN 
        SELECT regexp_replace(match[1], E'\\\\(.)', E'\\1', 'g')
        FROM (
            SELECT regexp_matches(php_data, item_pattern, 'g') as match
        ) matches
    LOOP
        result := array_append(result, item_value);
    END LOOP;
    
    RETURN result;
END;
$$;

-- Função para normalizar especialidades comuns
CREATE OR REPLACE FUNCTION public.normalize_specialties(raw_specialties text[])
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    normalized text[] := '{}';
    specialty text;
    mapping_rules text[][] := ARRAY[
        ['ansiedade', 'Ansiedade'],
        ['depressao', 'Depressão'],
        ['depressão', 'Depressão'],
        ['relacionamento', 'Relacionamentos'],
        ['casal', 'Terapia de Casal'],
        ['familia', 'Terapia Familiar'],
        ['família', 'Terapia Familiar'],
        ['autoestima', 'Autoestima'],
        ['estresse', 'Estresse'],
        ['panico', 'Síndrome do Pânico'],
        ['pânico', 'Síndrome do Pânico'],
        ['toc', 'TOC (Transtorno Obsessivo Compulsivo)'],
        ['borderline', 'Borderline'],
        ['bipolar', 'Bipolaridade'],
        ['luto', 'Luto'],
        ['trauma', 'Trauma'],
        ['ptsd', 'PTSD (Transtorno de Estresse Pós-Traumático)'],
        ['cognitivo', 'Terapia Cognitivo-Comportamental'],
        ['comportamental', 'Terapia Cognitivo-Comportamental'],
        ['psicanalise', 'Psicanálise'],
        ['psicanálise', 'Psicanálise'],
        ['gestalt', 'Gestalt-terapia'],
        ['humanistica', 'Terapia Humanística'],
        ['humanística', 'Terapia Humanística'],
        ['neuropsicologia', 'Neuropsicologia'],
        ['infantil', 'Psicologia Infantil'],
        ['crianca', 'Psicologia Infantil'],
        ['criança', 'Psicologia Infantil'],
        ['adolescente', 'Psicologia do Adolescente'],
        ['idoso', 'Psicologia do Idoso'],
        ['sexualidade', 'Sexualidade'],
        ['dependencia', 'Dependência Química'],
        ['dependência', 'Dependência Química'],
        ['quimica', 'Dependência Química'],
        ['química', 'Dependência Química'],
        ['alimentar', 'Transtornos Alimentares'],
        ['tdah', 'TDAH'],
        ['autismo', 'Autismo'],
        ['organizacional', 'Psicologia Organizacional']
    ];
    rule text[];
BEGIN
    -- Se array for nulo ou vazio, retorna vazio
    IF raw_specialties IS NULL OR array_length(raw_specialties, 1) IS NULL THEN
        RETURN normalized;
    END IF;
    
    FOREACH specialty IN ARRAY raw_specialties
    LOOP
        -- Remove espaços e converte para minúsculo para comparação
        specialty := trim(lower(specialty));
        
        -- Pula especialidades vazias
        IF specialty = '' THEN
            CONTINUE;
        END IF;
        
        -- Procura por mapeamentos
        FOREACH rule SLICE 1 IN ARRAY mapping_rules
        LOOP
            IF specialty LIKE '%' || rule[1] || '%' THEN
                normalized := array_append(normalized, rule[2]);
                GOTO next_specialty;
            END IF;
        END LOOP;
        
        -- Se não encontrou mapeamento, adiciona o original com primeira letra maiúscula
        normalized := array_append(normalized, initcap(specialty));
        
        <<next_specialty>>
    END LOOP;
    
    -- Remove duplicatas
    SELECT array_agg(DISTINCT unnest) INTO normalized
    FROM unnest(normalized);
    
    RETURN normalized;
END;
$$;

-- Adicionar colunas para dados normalizados
ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS servicos_normalizados text[],
ADD COLUMN IF NOT EXISTS formacao_normalizada text[];

-- Normalizar dados existentes
UPDATE public.profissionais 
SET servicos_normalizados = public.normalize_specialties(
    public.parse_php_serialized_array(servicos_raw)
)
WHERE servicos_raw IS NOT NULL AND servicos_raw != '';

UPDATE public.profissionais 
SET formacao_normalizada = public.parse_php_serialized_array(formacao_raw)
WHERE formacao_raw IS NOT NULL AND formacao_raw != '';

-- Normalizar preços: definir preço mínimo para profissionais ativos sem preço
UPDATE public.profissionais 
SET preco_consulta = 120.00
WHERE (preco_consulta IS NULL OR preco_consulta = 0) 
AND ativo = true;

-- Criar índice para busca eficiente por especialidades
CREATE INDEX IF NOT EXISTS idx_profissionais_servicos_normalizados 
ON public.profissionais USING GIN (servicos_normalizados);

-- Trigger para normalizar automaticamente novos dados
CREATE OR REPLACE FUNCTION public.normalize_professional_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalizar serviços se servicos_raw foi alterado
    IF NEW.servicos_raw IS DISTINCT FROM OLD.servicos_raw THEN
        NEW.servicos_normalizados := public.normalize_specialties(
            public.parse_php_serialized_array(NEW.servicos_raw)
        );
    END IF;
    
    -- Normalizar formação se formacao_raw foi alterado
    IF NEW.formacao_normalizada IS DISTINCT FROM OLD.formacao_raw THEN
        NEW.formacao_normalizada := public.parse_php_serialized_array(NEW.formacao_raw);
    END IF;
    
    -- Garantir preço mínimo para profissionais ativos
    IF NEW.ativo = true AND (NEW.preco_consulta IS NULL OR NEW.preco_consulta = 0) THEN
        NEW.preco_consulta := 120.00;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_professional_data
    BEFORE UPDATE ON public.profissionais
    FOR EACH ROW
    EXECUTE FUNCTION public.normalize_professional_data();