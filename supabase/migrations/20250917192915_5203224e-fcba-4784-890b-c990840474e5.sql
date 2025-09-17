-- Função para deserializar dados PHP em formato a:N:{...}
CREATE OR REPLACE FUNCTION public.parse_php_serialized_array(php_data text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    result text[] := '{}';
    item_pattern text;
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
    specialty_lower text;
    found_match boolean;
BEGIN
    -- Se array for nulo ou vazio, retorna vazio
    IF raw_specialties IS NULL OR array_length(raw_specialties, 1) IS NULL THEN
        RETURN normalized;
    END IF;
    
    FOREACH specialty IN ARRAY raw_specialties
    LOOP
        -- Remove espaços e converte para minúsculo para comparação
        specialty_lower := trim(lower(specialty));
        found_match := false;
        
        -- Pula especialidades vazias
        IF specialty_lower = '' THEN
            CONTINUE;
        END IF;
        
        -- Mapeamentos de especialidades
        IF specialty_lower LIKE '%ansiedade%' THEN
            normalized := array_append(normalized, 'Ansiedade');
            found_match := true;
        ELSIF specialty_lower LIKE '%depressao%' OR specialty_lower LIKE '%depressão%' THEN
            normalized := array_append(normalized, 'Depressão');
            found_match := true;
        ELSIF specialty_lower LIKE '%relacionamento%' THEN
            normalized := array_append(normalized, 'Relacionamentos');
            found_match := true;
        ELSIF specialty_lower LIKE '%casal%' THEN
            normalized := array_append(normalized, 'Terapia de Casal');
            found_match := true;
        ELSIF specialty_lower LIKE '%familia%' OR specialty_lower LIKE '%família%' THEN
            normalized := array_append(normalized, 'Terapia Familiar');
            found_match := true;
        ELSIF specialty_lower LIKE '%autoestima%' THEN
            normalized := array_append(normalized, 'Autoestima');
            found_match := true;
        ELSIF specialty_lower LIKE '%estresse%' THEN
            normalized := array_append(normalized, 'Estresse');
            found_match := true;
        ELSIF specialty_lower LIKE '%panico%' OR specialty_lower LIKE '%pânico%' THEN
            normalized := array_append(normalized, 'Síndrome do Pânico');
            found_match := true;
        ELSIF specialty_lower LIKE '%toc%' THEN
            normalized := array_append(normalized, 'TOC (Transtorno Obsessivo Compulsivo)');
            found_match := true;
        ELSIF specialty_lower LIKE '%borderline%' THEN
            normalized := array_append(normalized, 'Borderline');
            found_match := true;
        ELSIF specialty_lower LIKE '%bipolar%' THEN
            normalized := array_append(normalized, 'Bipolaridade');
            found_match := true;
        ELSIF specialty_lower LIKE '%luto%' THEN
            normalized := array_append(normalized, 'Luto');
            found_match := true;
        ELSIF specialty_lower LIKE '%trauma%' THEN
            normalized := array_append(normalized, 'Trauma');
            found_match := true;
        ELSIF specialty_lower LIKE '%ptsd%' THEN
            normalized := array_append(normalized, 'PTSD (Transtorno de Estresse Pós-Traumático)');
            found_match := true;
        ELSIF specialty_lower LIKE '%cognitivo%' OR specialty_lower LIKE '%comportamental%' THEN
            normalized := array_append(normalized, 'Terapia Cognitivo-Comportamental');
            found_match := true;
        ELSIF specialty_lower LIKE '%psicanalise%' OR specialty_lower LIKE '%psicanálise%' THEN
            normalized := array_append(normalized, 'Psicanálise');
            found_match := true;
        ELSIF specialty_lower LIKE '%gestalt%' THEN
            normalized := array_append(normalized, 'Gestalt-terapia');
            found_match := true;
        ELSIF specialty_lower LIKE '%humanistica%' OR specialty_lower LIKE '%humanística%' THEN
            normalized := array_append(normalized, 'Terapia Humanística');
            found_match := true;
        ELSIF specialty_lower LIKE '%neuropsicologia%' THEN
            normalized := array_append(normalized, 'Neuropsicologia');
            found_match := true;
        ELSIF specialty_lower LIKE '%infantil%' OR specialty_lower LIKE '%crianca%' OR specialty_lower LIKE '%criança%' THEN
            normalized := array_append(normalized, 'Psicologia Infantil');
            found_match := true;
        ELSIF specialty_lower LIKE '%adolescente%' THEN
            normalized := array_append(normalized, 'Psicologia do Adolescente');
            found_match := true;
        ELSIF specialty_lower LIKE '%idoso%' THEN
            normalized := array_append(normalized, 'Psicologia do Idoso');
            found_match := true;
        ELSIF specialty_lower LIKE '%sexualidade%' THEN
            normalized := array_append(normalized, 'Sexualidade');
            found_match := true;
        ELSIF specialty_lower LIKE '%dependencia%' OR specialty_lower LIKE '%dependência%' OR specialty_lower LIKE '%quimica%' OR specialty_lower LIKE '%química%' THEN
            normalized := array_append(normalized, 'Dependência Química');
            found_match := true;
        ELSIF specialty_lower LIKE '%alimentar%' THEN
            normalized := array_append(normalized, 'Transtornos Alimentares');
            found_match := true;
        ELSIF specialty_lower LIKE '%tdah%' THEN
            normalized := array_append(normalized, 'TDAH');
            found_match := true;
        ELSIF specialty_lower LIKE '%autismo%' THEN
            normalized := array_append(normalized, 'Autismo');
            found_match := true;
        ELSIF specialty_lower LIKE '%organizacional%' THEN
            normalized := array_append(normalized, 'Psicologia Organizacional');
            found_match := true;
        END IF;
        
        -- Se não encontrou mapeamento, adiciona o original com primeira letra maiúscula
        IF NOT found_match THEN
            normalized := array_append(normalized, initcap(specialty));
        END IF;
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