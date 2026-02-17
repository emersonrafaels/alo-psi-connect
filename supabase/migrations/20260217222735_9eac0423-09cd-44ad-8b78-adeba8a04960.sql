UPDATE mood_entries
SET sleep_quality = ROUND(LEAST(5, GREATEST(1, (sleep_hours - 3) / 1.5 + 1)))::integer
WHERE sleep_quality IS NULL AND sleep_hours IS NOT NULL;