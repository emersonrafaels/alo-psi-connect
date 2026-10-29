CREATE TABLE public.institution_permanence_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  semester text NOT NULL, data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, semester)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_permanence_snapshots TO authenticated;
GRANT ALL ON public.institution_permanence_snapshots TO service_role;
ALTER TABLE public.institution_permanence_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Institution team reads permanence" ON public.institution_permanence_snapshots FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id));
CREATE POLICY "Admins manage permanence" ON public.institution_permanence_snapshots FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_perm_snap_updated BEFORE UPDATE ON public.institution_permanence_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.institution_permanence_snapshots (institution_id, semester, data) VALUES
('52edbfee-9645-40ca-967a-b1135f4b6aac','2025.2','{"shift_k":2,"units":[{"k":"CT","nome":"Contagem","ini":"CT","n":378,"est":1150},{"k":"IT","nome":"Itajubá","ini":"IT","n":275,"est":805},{"k":"MC","nome":"Montes Claros","ini":"MC","n":268,"est":790}],"recov":{"CT":63,"IT":67,"MC":71},"hidden":{"CT":[15,10,22,46,7],"IT":[19,6,18,50,7],"MC":[22,4,16,51,7]},"evAny":{"CT":56,"IT":50,"MC":45},"disc":{"CT":12,"IT":10,"MC":8},"cou":{"CT":[13,28,47,12],"IT":[16,29,45,10],"MC":[17,31,42,10]}}'),
('52edbfee-9645-40ca-967a-b1135f4b6aac','2026.1','{"shift_k":1,"units":[{"k":"CT","nome":"Contagem","ini":"CT","n":438,"est":1165},{"k":"IT","nome":"Itajubá","ini":"IT","n":319,"est":812},{"k":"MC","nome":"Montes Claros","ini":"MC","n":310,"est":798}],"recov":{"CT":66,"IT":70,"MC":74},"hidden":{"CT":[16,10,21,46,7],"IT":[20,6,17,50,7],"MC":[23,4,15,51,7]},"evAny":{"CT":55,"IT":49,"MC":44},"disc":{"CT":11,"IT":10,"MC":8},"cou":{"CT":[15,29,45,11],"IT":[18,30,43,9],"MC":[19,32,40,9]}}'),
('52edbfee-9645-40ca-967a-b1135f4b6aac','2026.2','{}')
ON CONFLICT (institution_id, semester) DO NOTHING;