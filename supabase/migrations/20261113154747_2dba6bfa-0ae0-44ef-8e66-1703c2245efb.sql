ALTER TABLE public.mood_entry_analyses DISABLE TRIGGER mood_analysis_care_request;

CREATE TEMP TABLE afya_lvl ON COMMIT DROP AS
SELECT pr.id AS profile_id,
  CASE WHEN b < 55 THEN 'healthy' WHEN b < 80 THEN 'attention' WHEN b < 92 THEN 'alert' WHEN b < 97 THEN 'critical' ELSE 'none' END AS lvl,
  (abs(hashtext(pr.id::text || 'traj')) % 3) AS traj
FROM (
  SELECT DISTINCT pr.id, abs(hashtext(pr.id::text || 'afya30')) % 100 AS b
  FROM public.patient_institutions pi
  JOIN public.educational_institutions ei ON ei.id = pi.institution_id AND ei.name ILIKE '%afya%'
  JOIN public.pacientes p ON p.id = pi.patient_id
  JOIN public.profiles pr ON pr.id = p.profile_id
  WHERE pr.user_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.synthetic_student_cases s WHERE s.profile_id = pr.id)
) x JOIN public.profiles pr ON pr.id = x.id;

-- Dados insuficientes: sem registros recentes
DELETE FROM public.mood_entry_analyses a USING public.mood_entries m, afya_lvl l
WHERE a.mood_entry_id = m.id AND m.profile_id = l.profile_id AND l.lvl = 'none' AND m.date >= current_date - 30;
DELETE FROM public.mood_entries m USING afya_lvl l
WHERE m.profile_id = l.profile_id AND l.lvl = 'none' AND m.date >= current_date - 30;

CREATE TEMP TABLE afya_e ON COMMIT DROP AS
SELECT m.id, coalesce(m.user_id, m.profile_id) AS user_id, l.lvl, l.traj,
  (row_number() OVER w)::numeric / count(*) OVER (PARTITION BY m.profile_id) AS pos,
  abs(hashtext(m.id::text)) % 3 - 1 AS j
FROM public.mood_entries m JOIN afya_lvl l ON l.profile_id = m.profile_id
WHERE l.lvl <> 'none' AND m.date >= current_date - 30
WINDOW w AS (PARTITION BY m.profile_id ORDER BY m.date);

ALTER TABLE afya_e ADD COLUMN eff text;
UPDATE afya_e SET eff = CASE
  WHEN lvl = 'healthy' THEN CASE WHEN traj = 2 AND pos < 0.3 THEN 'attention' ELSE 'healthy' END
  WHEN traj = 0 AND pos < 0.6 THEN (CASE lvl WHEN 'attention' THEN 'healthy' WHEN 'alert' THEN 'attention' ELSE 'alert' END)
  WHEN traj = 1 AND pos < 0.6 AND j = 1 THEN (CASE lvl WHEN 'attention' THEN 'healthy' WHEN 'alert' THEN 'attention' ELSE 'alert' END)
  ELSE lvl END;

UPDATE public.mood_entries m SET
  mood_score = greatest(1, least(5, (CASE e.eff WHEN 'healthy' THEN 4 WHEN 'attention' THEN 3 WHEN 'alert' THEN 2 ELSE 1 END) + CASE WHEN e.eff='healthy' THEN greatest(e.j,0) WHEN e.eff='critical' THEN greatest(e.j,0) ELSE e.j END)),
  energy_level = greatest(1, least(5, (CASE e.eff WHEN 'healthy' THEN 4 WHEN 'attention' THEN 3 WHEN 'alert' THEN 2 ELSE 1 END) + e.j)),
  anxiety_level = greatest(1, least(5, (CASE e.eff WHEN 'healthy' THEN 2 WHEN 'attention' THEN 3 WHEN 'alert' THEN 4 ELSE 5 END) + CASE WHEN e.eff='critical' THEN least(e.j,0) ELSE e.j END)),
  sleep_quality = greatest(1, least(5, (CASE e.eff WHEN 'healthy' THEN 4 WHEN 'attention' THEN 3 WHEN 'alert' THEN 2 ELSE 1 END) + e.j))
FROM afya_e e WHERE e.id = m.id;

UPDATE public.mood_entry_analyses a SET risk_level = e.eff::public.mood_analysis_risk_level, source = 'synthetic'
FROM afya_e e WHERE a.mood_entry_id = e.id;

INSERT INTO public.mood_entry_analyses (mood_entry_id, user_id, risk_level, source)
SELECT e.id, e.user_id, e.eff::public.mood_analysis_risk_level, 'synthetic'
FROM afya_e e WHERE NOT EXISTS (SELECT 1 FROM public.mood_entry_analyses a WHERE a.mood_entry_id = e.id);

ALTER TABLE public.mood_entry_analyses ENABLE TRIGGER mood_analysis_care_request;