DO $do$
DECLARE d text := pg_get_functiondef('public.get_institution_usage_metrics(uuid,int,uuid,uuid)'::regprocedure);
BEGIN
  d := regexp_replace(d, 'SELECT (m|j|c|r|g|v|a)\.user_id, ''', 'SELECT s.profile_id, ''', 'g');
  d := regexp_replace(d, 'SELECT s\.user_id, ''diario''', 'SELECT s.profile_id, ''diario''', 'g');
  d := replace(d, 'c.user_id = s.user_id', 'c.user_id = s.profile_id');
  d := replace(d, 'p.user_id = s.user_id', 'p.user_id = s.profile_id');
  d := replace(d, 'ON s.user_id = e.user_id', 'ON s.profile_id = e.user_id');
  EXECUTE d;
END $do$;