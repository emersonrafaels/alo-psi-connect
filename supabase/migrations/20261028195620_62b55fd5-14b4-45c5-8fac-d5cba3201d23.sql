CREATE TABLE public.institution_ned_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  semester text NOT NULL, ned_key text NOT NULL, data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, semester, ned_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_ned_snapshots TO authenticated;
GRANT ALL ON public.institution_ned_snapshots TO service_role;
ALTER TABLE public.institution_ned_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Institution team reads" ON public.institution_ned_snapshots FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id));
CREATE POLICY "Admins manage" ON public.institution_ned_snapshots FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_ned_snap_updated BEFORE UPDATE ON public.institution_ned_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.institution_ned_action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  ned_key text NOT NULL, plan text NOT NULL, created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_ned_action_plans TO authenticated;
GRANT ALL ON public.institution_ned_action_plans TO service_role;
ALTER TABLE public.institution_ned_action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Institution team reads plans" ON public.institution_ned_action_plans FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id));
CREATE POLICY "Institution team adds plans" ON public.institution_ned_action_plans FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id)));
CREATE POLICY "Authors or admins remove plans" ON public.institution_ned_action_plans FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE TRIGGER trg_ned_plan_updated BEFORE UPDATE ON public.institution_ned_action_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
DECLARE inst uuid := '52edbfee-9645-40ca-967a-b1135f4b6aac'; n jsonb; s text; k numeric;
  neds jsonb := '[
 {"key":"ct","nome":"Contagem","uf":"MG","reg":"Sudeste","tipo":"Faculdade","est":1180,"atend":168,"horas":58,"esp":10,"com":82,"col":4,"pei":84,"peis":22,"niv":46,"sat":4.3,"eq":[1,2,1,0],"ate":"17h","grupo":8,"canais":"Presencial, e-mail e Rede Bem-Estar","rel":[1,1,2],"plano":1,"cia":1,"dem":[38,18,17,11,9,7]},
 {"key":"it","nome":"Itajubá","uf":"MG","reg":"Sudeste","tipo":"Faculdade","est":820,"atend":104,"horas":42,"esp":6,"com":86,"col":3,"pei":90,"peis":14,"niv":58,"sat":4.5,"eq":[1,1,1,0],"ate":"18h","grupo":12,"canais":"Presencial, WhatsApp e Rede Bem-Estar","rel":[1,1,1],"plano":1,"cia":1,"dem":[33,24,15,12,9,7]},
 {"key":"mc","nome":"Montes Claros","uf":"MG","reg":"Sudeste","tipo":"Faculdade","est":806,"atend":112,"horas":46,"esp":4,"com":90,"col":2,"pei":93,"peis":17,"niv":62,"sat":4.7,"eq":[1,1,1,0],"ate":"21h","grupo":15,"canais":"Presencial, WhatsApp e Rede Bem-Estar","rel":[1,1,1],"plano":1,"cia":1,"dem":[31,22,18,13,9,7]},
 {"key":"te","nome":"Teresina","uf":"PI","reg":"Nordeste","tipo":"Centro universitário","est":1450,"atend":260,"horas":96,"esp":3,"com":88,"col":9,"pei":95,"peis":31,"niv":71,"sat":4.6,"eq":[1,2,1,1],"ate":"17h","grupo":46,"canais":"Presencial, e-mail e Rede Bem-Estar","rel":[1,1,1],"plano":1,"cia":1,"dem":[36,20,14,14,9,7]},
 {"key":"pa","nome":"Palmas","uf":"TO","reg":"Norte","tipo":"Faculdade","est":1320,"atend":205,"horas":70,"esp":5,"com":85,"col":5,"pei":88,"peis":19,"niv":55,"sat":4.4,"eq":[1,2,1,0],"ate":"19h","grupo":18,"canais":"Presencial, e-mail e Rede Bem-Estar","rel":[1,1,2],"plano":1,"cia":1,"dem":[33,23,17,11,9,7]},
 {"key":"ara","nome":"Araguaína","uf":"TO","reg":"Norte","tipo":"Faculdade","est":980,"atend":152,"horas":30,"esp":12,"com":74,"col":1,"pei":61,"peis":9,"niv":38,"sat":3.9,"eq":[1,1,0,0],"ate":"17h","grupo":0,"canais":"Presencial e e-mail","rel":[1,0,0],"plano":2,"cia":0,"dem":[40,19,15,9,10,7]},
 {"key":"ga","nome":"Garanhuns","uf":"PE","reg":"Nordeste","tipo":"Faculdade","est":760,"atend":96,"horas":60,"esp":6,"com":87,"col":3,"pei":91,"peis":12,"niv":60,"sat":4.5,"eq":[1,2,1,0],"ate":"17h","grupo":10,"canais":"Presencial, e-mail e Rede Bem-Estar","rel":[1,1,1],"plano":1,"cia":1,"dem":[30,26,16,13,8,7]},
 {"key":"re","nome":"Redenção","uf":"PA","reg":"Norte","tipo":"Faculdade","est":640,"atend":80,"horas":40,"esp":8,"com":80,"col":2,"pei":79,"peis":8,"niv":44,"sat":4.2,"eq":[1,1,1,0],"ate":"19h","grupo":6,"canais":"Presencial e WhatsApp","rel":[1,2,0],"plano":1,"cia":1,"dem":[32,25,16,10,10,7]},
 {"key":"ic","nome":"Itacoatiara","uf":"AM","reg":"Norte","tipo":"Faculdade","est":520,"atend":61,"horas":28,"esp":9,"com":78,"col":0,"pei":70,"peis":5,"niv":35,"sat":4.0,"eq":[1,1,0,0],"ate":"17h","grupo":0,"canais":"Presencial","rel":[2,0,0],"plano":0,"cia":0,"dem":[29,28,15,12,9,7]},
 {"key":"pn","nome":"Porto Nacional","uf":"TO","reg":"Norte","tipo":"Faculdade","est":700,"atend":94,"horas":56,"esp":5,"com":84,"col":4,"pei":86,"peis":11,"niv":52,"sat":4.4,"eq":[1,2,1,0],"ate":"18h","grupo":14,"canais":"Presencial, e-mail e Rede Bem-Estar","rel":[1,1,1],"plano":2,"cia":1,"dem":[33,22,17,13,8,7]}
]';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM educational_institutions WHERE id = inst) THEN RETURN; END IF;
  FOR n IN SELECT * FROM jsonb_array_elements(neds) LOOP
    INSERT INTO institution_ned_snapshots (institution_id, semester, ned_key, data) VALUES (inst, '2026.2', n->>'key', n) ON CONFLICT DO NOTHING;
    FOREACH s IN ARRAY ARRAY['2026.1','2025.2'] LOOP
      k := CASE s WHEN '2026.1' THEN 0.92 ELSE 0.85 END;
      INSERT INTO institution_ned_snapshots (institution_id, semester, ned_key, data) VALUES (inst, s, n->>'key',
        n || jsonb_build_object('atend', round((n->>'atend')::numeric * k), 'esp', (n->>'esp')::int + CASE s WHEN '2026.1' THEN 1 ELSE 2 END,
          'com', (n->>'com')::int - CASE s WHEN '2026.1' THEN 2 ELSE 3 END, 'col', greatest(0, (n->>'col')::int - 1),
          'pei', (n->>'pei')::int - CASE s WHEN '2026.1' THEN 4 ELSE 7 END, 'niv', (n->>'niv')::int - CASE s WHEN '2026.1' THEN 3 ELSE 6 END,
          'sat', round(((n->>'sat')::numeric - CASE s WHEN '2026.1' THEN 0.1 ELSE 0.2 END), 1), 'rel', '[1,1,1]'::jsonb,
          'ate', CASE WHEN n->>'key' = 'mc' THEN '17h' ELSE n->>'ate' END))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;