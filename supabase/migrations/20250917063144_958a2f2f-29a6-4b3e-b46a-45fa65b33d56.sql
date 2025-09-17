-- Atualizar registros existentes que têm time_slot null para usar valor padrão de 50 minutos
UPDATE profissionais_sessoes 
SET time_slot = 50 
WHERE time_slot IS NULL;

-- Comentário sobre a correção
-- Esta migration corrige os registros existentes que têm time_slot null
-- Define 50 minutos como duração padrão das consultas