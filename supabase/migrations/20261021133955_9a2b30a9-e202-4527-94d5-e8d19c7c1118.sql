DO $$
DECLARE
  pair record; source_case record; profile_uuid uuid; patient_uuid uuid; case_uuid uuid; scale_row record; collection integer;
BEGIN
  FOR pair IN SELECT * FROM (VALUES ('D','A','2003-04-17'::date),('E','B','2002-08-23'::date),('F','C','2004-02-11'::date)) AS pairs(new_key,old_key,birth_date)
  LOOP
    IF EXISTS (SELECT 1 FROM public.synthetic_student_cases WHERE institution_id='52edbfee-9645-40ca-967a-b1135f4b6aac' AND case_key=pair.new_key) THEN CONTINUE; END IF;
    SELECT s.*, pl.class_unit_id INTO STRICT source_case FROM public.synthetic_student_cases s JOIN public.patient_institution_placements pl ON pl.patient_id=s.patient_id AND pl.institution_id=s.institution_id WHERE s.institution_id='52edbfee-9645-40ca-967a-b1135f4b6aac' AND s.case_key=pair.old_key;
    profile_uuid := gen_random_uuid(); patient_uuid := gen_random_uuid(); case_uuid := gen_random_uuid();
    INSERT INTO public.profiles(id,nome,email,data_nascimento,tipo_usuario,tenant_id) VALUES(profile_uuid,'Estudante '||pair.new_key,'demo-afya-case-'||lower(pair.new_key)||'@example.invalid',pair.birth_date,'paciente','472db0ac-0f45-4998-97da-490bc579efb1');
    INSERT INTO public.pacientes(id,profile_id,eh_estudante,instituicao_ensino,tenant_id) VALUES(patient_uuid,profile_uuid,true,'Afya','472db0ac-0f45-4998-97da-490bc579efb1');
    INSERT INTO public.synthetic_student_cases(id,institution_id,case_key,profile_id,patient_id,notifications_blocked,credentials_assigned) VALUES(case_uuid,source_case.institution_id,pair.new_key,profile_uuid,patient_uuid,true,false);
    INSERT INTO public.patient_institutions(patient_id,institution_id,enrollment_status,enrollment_date) VALUES(patient_uuid,source_case.institution_id,'enrolled',current_date-60);
    INSERT INTO public.patient_institution_placements(patient_id,institution_id,class_unit_id) VALUES(patient_uuid,source_case.institution_id,source_case.class_unit_id);
    FOR scale_row IN SELECT * FROM (VALUES
      ('D','WHO5',ARRAY[19,22,19]),('D','GAD7',ARRAY[3,3,3]),('D','PHQ9',ARRAY[4,4,4]),('D','PSS10',ARRAY[9,4,4]),('D','ISI',ARRAY[6,3,3]),('D','MHCSF',ARRAY[55,62,55]),
      ('E','WHO5',ARRAY[14,9,17]),('E','GAD7',ARRAY[6,13,6]),('E','PHQ9',ARRAY[8,17,8]),('E','PSS10',ARRAY[14,24,9]),('E','ISI',ARRAY[10,17,6]),('E','MHCSF',ARRAY[41,27,48]),
      ('F','WHO5',ARRAY[7,4,2]),('F','GAD7',ARRAY[13,17,17]),('F','PHQ9',ARRAY[17,22,22]),('F','PSS10',ARRAY[29,34,34]),('F','ISI',ARRAY[20,24,24]),('F','MHCSF',ARRAY[20,13,6])
    ) AS scores(case_key,scale_code,values_by_collection) WHERE case_key=pair.new_key
    LOOP
      FOR collection IN 1..3 LOOP
        INSERT INTO public.institution_demo_scale_responses(patient_id,institution_id,scale_code,raw_score,taken_at)
        VALUES(patient_uuid,source_case.institution_id,scale_row.scale_code,scale_row.values_by_collection[collection],(current_date-(ARRAY[42,21,0])[collection])+time '12:00');
      END LOOP;
    END LOOP;
  END LOOP;
END $$;