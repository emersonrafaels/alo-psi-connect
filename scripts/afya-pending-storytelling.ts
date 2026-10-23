/** Data-only refresh for ten existing, uncredentialed Afya demonstration students. */
export const AFYA_ID = '52edbfee-9645-40ca-967a-b1135f4b6aac';
export const REFERENCE_DATE = '2026-10-23';
type Scores = [number, number, number, number]; // mood, anxiety, energy, sleep
type Story = {
  patient: string; theme: string; reason: string; action: string;
  recent: Scores[]; before: Scores; stress: number;
  texts: [string, string, string, string];
  practices: string[]; outcome: string;
  scales: Record<string, [number, number, number]>;
};
export const STORIES: Story[] = [
  {
    patient: '04660455-2463-40cb-969b-3b5a195418ff', theme: 'Ansiedade em semana de provas',
    reason: 'O humor permanece intermediário, mas a ansiedade se mantém no nível máximo antes das provas; as pausas aliviam a tensão apenas por pouco tempo.',
    action: 'Oferecer acolhimento para ansiedade nas avaliações e organizar um plano de estudo com pausas.',
    recent: [[3,5,3,3],[3,5,3,3],[4,5,3,2],[3,5,2,3],[3,5,3,3],[2,5,2,2],[3,5,3,3],[3,5,3,3]], before: [4,3,4,4], stress: 4,
    texts: ['Estava estudando com tranquilidade antes da sequência de provas.', 'Com as avaliações próximas, comecei a revisar o mesmo conteúdo muitas vezes e a ficar tenso.', 'Fiz respiração em quatro etapas antes de estudar; consegui começar, mas a preocupação voltou.', 'Consegui cumprir parte do plano de estudo, embora continue muito ansioso com as provas.'],
    practices: ['respiracao-quatro-etapas','pausa-tres-minutos'], outcome: 'A pausa ajudou a iniciar o estudo, sem eliminar a ansiedade.',
    scales: { WHO5:[18,14,12], GAD7:[8,15,18], PSS10:[17,25,29] },
  },
  {
    patient: '0997ddd1-40df-49dc-b82b-902bc260de7f', theme: 'Desânimo e perda de interesse',
    reason: 'Predominam humor muito baixo, pouca energia e redução do interesse por atividades antes prazerosas; a ansiedade não é o principal indicador deste caso.',
    action: 'Oferecer acolhimento individual e avaliar apoio profissional para o desânimo persistente.',
    recent: [[1,2,1,2],[2,3,2,2],[1,2,1,3],[1,2,2,2],[2,3,1,2],[1,2,1,3],[1,3,2,2],[2,2,1,2]], before: [2,2,2,3], stress: 3,
    texts: ['Já estava com menos vontade de participar das atividades do curso.', 'Passei a adiar tarefas simples e deixei de fazer coisas que costumava gostar.', 'Experimentei uma pausa de três minutos; notei o cansaço e não tive muita mudança depois.', 'Consegui ir à aula, mas ainda sinto pouco interesse e pouca disposição.'],
    practices: ['pausa-tres-minutos'], outcome: 'Percebeu o cansaço, mas não relatou melhora imediata.',
    scales: { WHO5:[12,8,6], PHQ9:[12,17,20], MHCSF:[34,28,22] },
  },
  {
    patient: '0b289d25-0713-4a1c-a3fa-be8f1e4f8890', theme: 'Sobrecarga entre trabalho e estudo',
    reason: 'A ansiedade é intensa na conciliação de trabalho e estudo, acompanhada de energia baixa e sono curto; o humor oscila sem permanecer no mínimo.',
    action: 'Acolher a sobrecarga, revisar a rotina e combinar acompanhamento próximo.',
    recent: [[2,5,2,2],[3,4,1,2],[2,5,2,1],[3,5,2,2],[2,4,1,2],[3,5,2,1],[2,5,2,2],[3,4,1,2]], before: [3,3,3,3], stress: 5,
    texts: ['A rotina de trabalho e aula estava apertada, mas eu conseguia descansar.', 'Os turnos extras reduziram meu descanso e fiquei preocupado com os prazos.', 'Usei o suspiro de alívio entre o trabalho e a aula; ajudou a soltar a tensão por alguns minutos.', 'Ainda estou cansado e muito preocupado; preciso reorganizar os horários.'],
    practices: ['suspiro-de-alivio','respiracao-lenta-ritmada'], outcome: 'Alívio breve da tensão, com cansaço ainda presente.',
    scales: { PSS10:[21,28,33], ISI:[10,15,18], GAD7:[10,15,17] },
  },
  {
    patient: '11cccb21-c68e-4341-b557-521ec5842d2c', theme: 'Solidão na adaptação à cidade',
    reason: 'O humor muito baixo se associa à solidão durante a adaptação à cidade, apesar de sono relativamente preservado; há dificuldade em formar vínculos.',
    action: 'Oferecer acolhimento e apoiar a construção de vínculos e uma rede de convivência.',
    recent: [[1,3,2,4],[1,3,3,3],[2,3,2,4],[1,2,2,3],[1,3,3,4],[2,3,2,3],[1,2,2,4],[1,3,3,3]], before: [2,2,3,4], stress: 3,
    texts: ['A mudança de cidade trouxe saudade e dificuldade de me aproximar dos colegas.', 'Fiquei mais sozinho fora das aulas e meu humor caiu.', 'Fiz grounding para me reconectar ao ambiente e depois mandei mensagem a um colega.', 'Conversei com uma pessoa da turma, mas ainda me sinto sozinho na nova rotina.'],
    practices: ['grounding-54321','pausa-tres-minutos'], outcome: 'Sentiu-se mais presente, embora a solidão permanecesse.',
    scales: { WHO5:[13,9,7], MHCSF:[35,26,20], PHQ9:[9,13,16] },
  },
  {
    patient: '13bedb29-13cb-4fb6-a621-507d0b34acba', theme: 'Ansiedade em apresentações',
    reason: 'A ansiedade permanece muito elevada diante de apresentações e avaliações orais, mesmo com humor e energia relativamente preservados.',
    action: 'Acolher a ansiedade de exposição e combinar estratégias graduais para apresentações.',
    recent: [[4,5,4,3],[3,5,3,4],[4,4,4,3],[3,5,3,4],[4,5,4,3],[3,5,3,4],[4,4,4,3],[3,5,3,4]], before: [4,3,4,4], stress: 4,
    texts: ['Costumo aproveitar as aulas, mas me preocupo quando preciso apresentar.', 'Passei a antecipar erros na avaliação oral e ensaiar repetidamente.', 'Fiz respiração em quatro etapas antes do ensaio; minha voz ficou mais firme por um tempo.', 'O ensaio foi melhor, mas a preocupação com falar diante da turma continua alta.'],
    practices: ['respiracao-quatro-etapas','grounding-54321'], outcome: 'Mais presença no ensaio, sem resolução da ansiedade antecipatória.',
    scales: { GAD7:[7,14,16], WHO5:[20,17,15], PSS10:[15,22,27] },
  },
  {
    patient: '149d866c-bb88-4955-bea8-5f7345a2b050', theme: 'Preocupação noturna e sono fragmentado',
    reason: 'A ansiedade no nível máximo acompanha despertares frequentes e sono de baixa qualidade; a falta de descanso reduz a energia no dia seguinte.',
    action: 'Oferecer acolhimento, revisar hábitos de sono e avaliar apoio profissional para a dificuldade persistente de dormir.',
    recent: [[3,5,1,1],[2,5,2,1],[3,5,1,2],[2,5,1,1],[3,5,2,1],[2,5,1,2],[3,5,1,1],[2,5,2,1]], before: [3,3,3,3], stress: 4,
    texts: ['Comecei a demorar para dormir pensando nas tarefas do dia seguinte.', 'As noites ficaram fragmentadas e passei a chegar cansado à aula.', 'Usei respiração 4-7-8 ao deitar; relaxei um pouco, mas ainda acordei durante a noite.', 'A rotina noturna está mais organizada, porém o sono ainda não está reparador.'],
    practices: ['respiracao-478','respiracao-lenta-ritmada'], outcome: 'Relaxamento ao deitar, com despertares ainda frequentes.',
    scales: { ISI:[13,20,24], GAD7:[10,15,18], WHO5:[15,10,8] },
  },
  {
    patient: '14c3f472-0967-41e7-bfdb-a8ebe0c036c2', theme: 'Autocobrança e revisão excessiva',
    reason: 'A autocobrança mantém a ansiedade intensa e leva a revisões excessivas; o estudante preserva energia, mas tem dificuldade em encerrar as tarefas.',
    action: 'Acolher a autocobrança e pactuar limites de revisão e expectativas realistas.',
    recent: [[3,5,4,3],[4,4,3,3],[3,5,4,4],[4,5,3,3],[3,4,4,3],[4,5,3,4],[3,5,4,3],[4,4,3,3]], before: [4,3,4,4], stress: 5,
    texts: ['Queria entregar um bom trabalho e ainda conseguia parar de revisar.', 'Comecei a corrigir detalhes repetidamente por receio de não estar bom o suficiente.', 'Fiz respiração lenta e ritmada e defini um horário para encerrar a revisão.', 'Consegui entregar uma tarefa, mas sigo muito preocupado com falhas pequenas.'],
    practices: ['respiracao-lenta-ritmada','respiracao-quatro-etapas','pausa-tres-minutos'], outcome: 'Conseguiu encerrar uma tarefa, mantendo elevada autocobrança.',
    scales: { PSS10:[20,27,31], GAD7:[9,15,19], MHCSF:[46,39,33] },
  },
  {
    patient: '16014c9b-013e-4737-a7fb-9e7e21d6d9fa', theme: 'Tristeza após perda familiar',
    reason: 'O humor permanece muito baixo após uma perda familiar, com dias de tristeza e baixa disposição; há pequenas retomadas, sem recuperação sustentada.',
    action: 'Oferecer escuta acolhedora, respeitar o tempo de elaboração da perda e combinar acompanhamento.',
    recent: [[2,2,2,3],[1,2,2,3],[1,3,1,2],[2,2,2,3],[1,2,2,3],[1,3,1,2],[2,2,2,3],[1,2,2,3]], before: [2,2,3,3], stress: 2,
    texts: ['Depois de uma perda na família, fiquei triste e menos disposto para as aulas.', 'Alguns dias foram especialmente difíceis e precisei reduzir minhas atividades.', 'Usei uma pausa de três minutos para reconhecer a tristeza sem exigir melhora imediata.', 'Retomei uma atividade curta, mas ainda tenho dias de tristeza intensa.'],
    practices: ['pausa-tres-minutos','respiracao-lenta-ritmada'], outcome: 'Reconheceu a tristeza e retomou uma atividade breve, sem melhora sustentada.',
    scales: { WHO5:[12,7,8], PHQ9:[12,18,17], MHCSF:[30,21,23] },
  },
  {
    patient: '1ecc2b7f-2621-4323-b866-92b543de1ebd', theme: 'Preocupações financeiras',
    reason: 'As preocupações financeiras mantêm a ansiedade elevada e dificultam a concentração; o humor varia, mas não fica continuamente no nível mínimo.',
    action: 'Acolher as preocupações e orientar a busca de apoios institucionais adequados, com acompanhamento próximo.',
    recent: [[3,5,3,2],[2,5,3,3],[3,4,2,2],[3,5,3,3],[2,5,3,2],[3,5,2,3],[3,4,3,2],[2,5,3,3]], before: [3,3,3,4], stress: 5,
    texts: ['Estava preocupado com as despesas, mas ainda conseguia me concentrar nas aulas.', 'Os gastos acumulados passaram a ocupar meus pensamentos durante o estudo.', 'Usei grounding e um suspiro de alívio para retomar uma tarefa pequena.', 'Consegui listar os apoios que preciso procurar, mas a preocupação financeira segue forte.'],
    practices: ['grounding-54321','suspiro-de-alivio','pausa-tres-minutos'], outcome: 'Retomou uma tarefa pequena; a fonte de preocupação permanece.',
    scales: { GAD7:[10,16,17], PSS10:[23,30,32], WHO5:[16,12,11] },
  },
  {
    patient: '1ee2fca1-18b0-4bfc-95c8-e050ef27f246', theme: 'Retomada lenta após período de exaustão',
    reason: 'Há pequenas retomadas de rotina, mas o humor médio ainda é muito baixo e a energia segue reduzida; a melhora recente não justifica retirar a prioridade.',
    action: 'Oferecer acolhimento individual e acompanhar a retomada gradual, avaliando necessidade de apoio profissional.',
    recent: [[2,3,2,2],[2,3,2,3],[1,3,2,2],[1,4,1,2],[2,3,2,3],[1,3,1,2],[1,4,1,2],[1,3,2,3]], before: [1,4,1,2], stress: 4,
    texts: ['Depois de um período de exaustão, eu estava com pouco ânimo para qualquer tarefa.', 'Tentei retomar a rotina, mas o cansaço e o desânimo ainda eram fortes.', 'Fiz uma pausa de três minutos e respiração 4-7-8; consegui organizar uma tarefa para amanhã.', 'Cumpri uma tarefa pequena e dormi um pouco melhor, mas ainda preciso de acompanhamento.'],
    practices: ['pausa-tres-minutos','respiracao-478','suspiro-de-alivio'], outcome: 'Pequena retomada da rotina, com desânimo ainda importante.',
    scales: { PHQ9:[22,21,19], WHO5:[4,5,7], ISI:[22,20,17], MHCSF:[17,19,24] },
  },
];

export function average(story: Story, index: number) {
  return story.recent.reduce((sum, row) => sum + (row[index] ?? 0), 0) / story.recent.length;
}
const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;
export function buildRefreshSql() {
  const payload = sqlText(JSON.stringify(STORIES));
  return `DO $refresh$
DECLARE s jsonb; pa record; latest_id uuid; d integer; vals jsonb; scores integer[];
  day_date date; practice_slug text; practice_record record; practice_no integer;
  scale_pair record; collection integer; current_risk text; text_index integer;
  reference_date date := '${REFERENCE_DATE}'; total integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.educational_institutions WHERE id='${AFYA_ID}' AND is_demo) THEN
    RAISE EXCEPTION 'Afya is not marked as demonstration';
  END IF;
  FOR s IN SELECT value FROM jsonb_array_elements(${payload}::jsonb) LOOP
    SELECT p.id,p.profile_id,p.tenant_id,pr.user_id INTO pa
    FROM public.pacientes p JOIN public.profiles pr ON pr.id=p.profile_id
    JOIN public.patient_institutions pi ON pi.patient_id=p.id
    WHERE p.id=(s->>'patient')::uuid AND pi.institution_id='${AFYA_ID}'
      AND pi.enrollment_status='enrolled' AND pr.user_id IS NULL AND pr.email ILIKE '%demo%'
      AND NOT EXISTS (SELECT 1 FROM public.synthetic_student_cases sc WHERE sc.patient_id=p.id);
    IF NOT FOUND THEN RAISE EXCEPTION 'Target is not an uncredentialed synthetic student: %', s->>'patient'; END IF;
    SELECT id INTO latest_id FROM public.student_triage WHERE patient_id=pa.id AND institution_id='${AFYA_ID}'
      ORDER BY created_at DESC,id DESC LIMIT 1;
    IF latest_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.student_triage WHERE id=latest_id AND status='pending') THEN
      RAISE EXCEPTION 'Target no longer awaits triage: %', pa.id;
    END IF;
    -- Replace only this synthetic student's recent window; a single transaction makes retries idempotent.
    DELETE FROM public.mood_entries WHERE profile_id=pa.profile_id AND date BETWEEN reference_date-30 AND reference_date;
    FOR d IN 0..14 LOOP
      day_date := reference_date-d*2;
      vals := CASE WHEN d<8 THEN s->'recent'->d ELSE s->'before' END;
      SELECT array_agg(value::integer ORDER BY ord) INTO scores FROM jsonb_array_elements_text(vals) WITH ORDINALITY AS v(value,ord);
      text_index := CASE WHEN d>=11 THEN 0 WHEN d>=7 THEN 1 WHEN d>=3 THEN 2 ELSE 3 END;
      INSERT INTO public.mood_entries(profile_id,user_id,tenant_id,date,mood_score,anxiety_level,energy_level,sleep_quality,sleep_hours,journal_text,tags,emotion_values,created_at)
      VALUES(pa.profile_id,NULL,pa.tenant_id,day_date,scores[1],scores[2],scores[3],scores[4],
        CASE scores[4] WHEN 1 THEN 4.5 WHEN 2 THEN 5.5 WHEN 3 THEN 6.5 WHEN 4 THEN 7.5 ELSE 8 END,
        s->'texts'->>text_index,ARRAY['demo_sintetico'],
        jsonb_build_object('mood',scores[1],'anxiety',scores[2],'energy',scores[3],'sleep',scores[4],
          'stress',greatest(1,least(5,(s->>'stress')::integer + CASE WHEN d%3=0 THEN -1 ELSE 0 END))),
        day_date::timestamp+time '20:00');
    END LOOP;
    UPDATE public.student_triage SET risk_level='critical',priority='high',
      recommended_action=s->>'action',
      notes='Pendência reavaliada em 23/10/2026. '||(s->>'reason')||' Ação proposta: '||(s->>'action'),
      updated_at=now()
    WHERE id=latest_id;
    -- No auth account, appointment, notification function or outbound send is created or invoked.
    DELETE FROM public.praticas_checkouts WHERE user_id=pa.profile_id AND created_at>=reference_date-30 AND created_at<reference_date+1;
    practice_no := 0;
    FOR practice_slug IN SELECT jsonb_array_elements_text(s->'practices') LOOP
      SELECT id,duracao_min_default INTO practice_record FROM public.praticas WHERE slug=practice_slug AND ativo;
      IF NOT FOUND THEN RAISE EXCEPTION 'Unavailable practice: %',practice_slug; END IF;
      FOR collection IN 0..1 LOOP
        INSERT INTO public.praticas_checkouts(user_id,pratica_id,estado,nota,duracao_segundos,created_at)
        VALUES(pa.profile_id,practice_record.id,CASE WHEN collection=0 THEN 'reflexivo' ELSE 'igual' END,
          (s->>'outcome'),practice_record.duracao_min_default*60,
          (reference_date-(3+practice_no*3+collection*9))::timestamp+time '18:00');
      END LOOP;
      practice_no := practice_no+1;
    END LOOP;
    DELETE FROM public.institution_demo_scale_responses WHERE patient_id=pa.id AND institution_id='${AFYA_ID}'
      AND taken_at>=reference_date-30 AND taken_at<reference_date+1;
    FOR scale_pair IN SELECT key,value FROM jsonb_each(s->'scales') LOOP
      IF NOT EXISTS (SELECT 1 FROM public.emotional_scales WHERE code=scale_pair.key AND active) THEN
        RAISE EXCEPTION 'Unavailable scale: %',scale_pair.key;
      END IF;
      FOR collection IN 0..2 LOOP
        INSERT INTO public.institution_demo_scale_responses(patient_id,institution_id,scale_code,raw_score,taken_at)
        VALUES(pa.id,'${AFYA_ID}',scale_pair.key,(scale_pair.value->>collection)::numeric,
          (reference_date-(28-collection*13))::timestamp+time '12:00');
      END LOOP;
    END LOOP;
    SELECT CASE WHEN avg(mood_score)<=1.5 OR avg(anxiety_level)>=4.5 THEN 'critical' ELSE 'other' END INTO current_risk
    FROM public.mood_entries WHERE profile_id=pa.profile_id AND date>=reference_date-15 AND date<=reference_date;
    IF current_risk<>'critical' THEN RAISE EXCEPTION 'Story no longer fits the risk queue: %',pa.id; END IF;
    total := total+1;
  END LOOP;
  IF total<>10 THEN RAISE EXCEPTION 'Expected ten stories, found %',total; END IF;
END $refresh$;`;
}
if (import.meta.main) console.log(buildRefreshSql());