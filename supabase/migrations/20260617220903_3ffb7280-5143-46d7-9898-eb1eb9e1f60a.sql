CREATE OR REPLACE FUNCTION public.compute_iseu_score(_user_id uuid)
 RETURNS iseu_scores
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec RECORD;
  total_weighted NUMERIC := 0;
  total_weight NUMERIC := 0;
  components_json JSONB := '{}'::jsonb;
  scales_count INTEGER := 0;
  required_count INTEGER := 0;
  final_score NUMERIC;
  band_label TEXT;
  inserted public.iseu_scores;
BEGIN
  -- Count how many active scales (with weight > 0) the ISEU requires.
  SELECT COUNT(*) INTO required_count
  FROM public.emotional_scales s
  WHERE s.active = true AND s.iseu_weight > 0;

  FOR rec IN
    SELECT DISTINCT ON (r.scale_id)
      r.scale_id, r.scale_code, r.normalized_score, r.taken_at,
      s.iseu_weight, s.name
    FROM public.emotional_scale_responses r
    JOIN public.emotional_scales s ON s.id = r.scale_id
    WHERE r.user_id = _user_id
      AND s.active = true
      AND s.iseu_weight > 0
      AND r.taken_at >= now() - INTERVAL '180 days'
    ORDER BY r.scale_id, r.taken_at DESC
  LOOP
    total_weighted := total_weighted + (rec.normalized_score * rec.iseu_weight);
    total_weight := total_weight + rec.iseu_weight;
    scales_count := scales_count + 1;
    components_json := components_json || jsonb_build_object(
      rec.scale_code, jsonb_build_object(
        'name', rec.name,
        'normalized_score', rec.normalized_score,
        'weight', rec.iseu_weight,
        'taken_at', rec.taken_at
      )
    );
  END LOOP;

  -- Only compute and persist ISEU when ALL active weighted scales have a recent response.
  IF total_weight = 0 OR scales_count < required_count THEN
    RETURN NULL;
  END IF;

  final_score := ROUND(total_weighted / total_weight, 2);

  IF final_score >= 75 THEN band_label := 'verde';
  ELSIF final_score >= 55 THEN band_label := 'amarelo';
  ELSIF final_score >= 35 THEN band_label := 'laranja';
  ELSE band_label := 'vermelho';
  END IF;

  INSERT INTO public.iseu_scores (user_id, score, band, components, scales_used, weights_total)
  VALUES (_user_id, final_score, band_label, components_json, scales_count, total_weight)
  RETURNING * INTO inserted;

  RETURN inserted;
END;
$function$;