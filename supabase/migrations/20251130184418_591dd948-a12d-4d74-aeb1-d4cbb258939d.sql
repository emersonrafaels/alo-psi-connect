-- Remover constraints antigas que limitam energy_level e anxiety_level a 1-5
ALTER TABLE mood_entries DROP CONSTRAINT IF EXISTS mood_entries_energy_level_check;
ALTER TABLE mood_entries DROP CONSTRAINT IF EXISTS mood_entries_anxiety_level_check;

-- Adicionar novas constraints com range 1-10 para alinhar com sistema de emoções dinâmicas
ALTER TABLE mood_entries ADD CONSTRAINT mood_entries_energy_level_check 
  CHECK ((energy_level IS NULL) OR (energy_level >= 1 AND energy_level <= 10));

ALTER TABLE mood_entries ADD CONSTRAINT mood_entries_anxiety_level_check 
  CHECK ((anxiety_level IS NULL) OR (anxiety_level >= 1 AND anxiety_level <= 10));