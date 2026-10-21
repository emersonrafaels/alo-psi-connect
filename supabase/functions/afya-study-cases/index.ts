import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { AFYA_ID, TENANT_ID, CASES, canManageCases, moodAt, scoredAnswers, patternOf } from './cases.ts';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z.object({ action: z.literal('assign'), caseKey: z.enum(['A','B','C','D','E','F']), email: z.string().trim().toLowerCase().email().max(255), password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/) }).strict(),
]);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const check = (result: { error: unknown }) => { if (result.error) throw new Error('Não foi possível concluir os dados do caso. Tente novamente.'); };
const ago = (days: number) => { const date = new Date(); date.setUTCDate(date.getUTCDate() - days); return date.toISOString().slice(0,10); };

async function populate(admin: ReturnType<typeof createClient>, row: any, key: string, caller: string) {
  const pattern = patternOf(key);
  const variant = ['D','E','F'].includes(key);
  const journal = key === 'D' ? 'Mantive a rotina de caminhada e encontrei colegas após os estudos. A respiração ajudou a encerrar o dia.' : key === 'E' ? 'O estágio e as entregas aumentaram a tensão. Retomei pausas e apoio dos colegas para recuperar meu descanso.' : key === 'F' ? 'Tenho sentido cansaço e dificuldade para dormir. Nesta demonstração, quero simular a busca de acompanhamento.' : key === 'A' ? 'Organizei meus estudos e reservei tempo para caminhar e praticar respiração.' : key === 'B' ? 'As avaliações trouxeram tensão. Estou reorganizando a rotina e experimentando apoios para cuidar do sono.' : 'A sobrecarga tem dificultado o descanso. Neste caso fictício, quero conhecer as opções de acompanhamento.';
  check(await admin.from('mood_entries').upsert(Array.from({length:45},(_,day) => {
    const m = moodAt(key,day);
    return { user_id:row.user_id,profile_id:row.profile_id,tenant_id:TENANT_ID,date:ago(day),mood_score:m.mood,anxiety_level:m.anxiety,energy_level:m.energy,sleep_quality:m.sleep,sleep_hours:variant?(pattern==='C'?4.5+day%2:pattern==='B'&&day>=10?5.5+day%2:7.5+day%2):pattern==='C'?5:pattern==='B'&&day>=12?6:8,journal_text:`[DEMO-AFYA-${key}] ${journal}`,tags:['demonstração','caso-sintético'],emotion_values:{calma:6-m.anxiety},created_at:`${ago(day)}T12:00:00Z` };
  }),{onConflict:'user_id,date'}));
  const { data: scales, error } = await admin.from('emotional_scales').select('*,emotional_scale_items(id)').eq('active',true);
  if (error) throw new Error('Não foi possível carregar as escalas.');
  // The dedicated test accounts have no pre-existing real data; refresh only their seed timestamps.
  for (const scale of scales || []) {
    for (const [collection, days] of [42,21,0].entries()) {
      const count = scale.emotional_scale_items.length;
      if (!count) continue;
      const scored = scoredAnswers(key,scale.code,collection,count,scale.item_max);
      const answers = scored.map((v,i) => scale.reverse_items?.includes(i+1)?scale.item_max-v+scale.item_min:v);
      const raw = scored.reduce((a,b)=>a+b,0);
      const pct = (raw-count*scale.item_min)/(count*(scale.item_max-scale.item_min))*100;
      const taken = `${ago(days)}T18:00:00Z`;
      const existing = await admin.from('emotional_scale_responses').select('id').eq('user_id',row.user_id).eq('scale_id',scale.id).eq('taken_at',taken).maybeSingle();
      check(existing);
      if (!existing.data) check(await admin.from('emotional_scale_responses').insert({user_id:row.user_id,scale_id:scale.id,scale_code:scale.code,answers,raw_score:raw,normalized_score:Math.round((scale.iseu_direction==='positive'?pct:100-pct)*100)/100,severity: severity(scale.code, raw, scored),taken_at:taken,created_at:taken}));
    }
  }
  const triage = await admin.from('student_triage').select('id').eq('patient_id',row.patient_id).eq('institution_id',AFYA_ID).limit(1);
  check(triage);
  if (!triage.data?.length) check(await admin.from('student_triage').insert({patient_id:row.patient_id,institution_id:AFYA_ID,triaged_by:caller,status:pattern==='A'?'resolved':'in_progress',risk_level:pattern==='A'?'low':pattern==='B'?'medium':'high',priority:pattern==='C'?'high':pattern==='B'?'medium':'low',recommended_action:pattern==='A'?'Manter rotina e atividades voluntárias':pattern==='B'?'Oferecer apoios e acompanhar evolução':'Simular acolhimento; não enviar mensagens reais',notes:`[DEMO-AFYA-${key}] Caso inteiramente sintético. Alertas externos bloqueados.`}));
  const {data: practices} = await admin.from('praticas').select('id').eq('ativo',true).limit(3);
  const existingPractice = await admin.from('praticas_checkouts').select('id').eq('user_id',row.user_id).limit(1);
  check(existingPractice);
  if (!existingPractice.data?.length && practices?.length) check(await admin.from('praticas_checkouts').insert(Array.from({length:variant?(pattern==='A'?9:pattern==='B'?6:3):pattern==='A'?8:pattern==='B'?5:2},(_,i)=>({user_id:row.user_id,pratica_id:practices[i%practices.length].id,estado:pattern==='C'?'reflexivo':'calmo',nota:`[DEMO-AFYA-${key}] ${variant?'Pausa e reflexão demonstrativas após os estudos.':'Prática fictícia de autocuidado.'}`,duracao_segundos:variant?240+i%3*60:300,created_at:`${ago(i*4+1)}T19:00:00Z`}))));
  const journeys = await admin.from('journey_sessions').select('id').eq('user_id',row.user_id).limit(1);
  check(journeys);
  if (!journeys.data?.length) {
    for (const days of (variant?[31,16,3]:[28,14,2])) {
      const result = await admin.from('journey_sessions').insert({user_id:row.user_id,tenant_id:TENANT_ID,session_key:`demo-afya-${key}-${days}`,family_id:pattern==='A'?'alegria':'medo',emotion_id:pattern==='A'?'confiante':'preocupado',intensity_before:pattern==='A'?3:pattern==='B'?4:5,intensity_after:pattern==='A'?2:3,practice_id:'respiracao-lenta-ritmada',duration_minutes:5,phase:'record',status:'completed',focus_mode:'guided',comprehension:{source:journal,body:variant?'Tensão na nuca e no peito':'Tensão nos ombros',thoughts:variant?'Como criar pausas entre estágio, estudos e descanso?':'Como equilibrar estudos e descanso?'},action:{next_step:pattern==='C'?'Explorar acompanhamento em simulação':'Organizar rotina e manter autocuidado'},created_at:`${ago(days)}T20:00:00Z`,completed_at:`${ago(days)}T20:05:00Z`}).select('id').single();
      check(result);
      if (result.data) check(await admin.from('journey_session_emotions').insert({session_id:result.data.id,user_id:row.user_id,emotion_id:pattern==='A'?'confiante':'preocupado',family_id:pattern==='A'?'alegria':'medo',emotion_level:3,intensity_before:pattern==='A'?3:5,intensity_after:3,is_focus:true,position:0,created_at:`${ago(days)}T20:00:00Z`}));
    }
  }
}
function severity(code:string, raw:number, scored:number[]) {
  switch(code) {
    case 'WHO5': return raw>=18?'Bem-estar adequado':raw>=13?'Bem-estar baixo':'Bem-estar muito baixo';
    case 'GAD7': return raw<=4?'Ansiedade mínima':raw<=9?'Ansiedade leve':raw<=14?'Ansiedade moderada':'Ansiedade severa';
    case 'PHQ9': return raw<=4?'Sintomas depressivos mínimos':raw<=9?'Sintomas depressivos leves':raw<=14?'Sintomas depressivos moderados':raw<=19?'Sintomas depressivos moderadamente graves':'Sintomas depressivos graves';
    case 'PSS10': return raw<=13?'Estresse percebido baixo':raw<=26?'Estresse percebido moderado':'Estresse percebido alto';
    case 'ISI': return raw<=7?'Sem insônia significativa':raw<=14?'Insônia subclínica':raw<=21?'Insônia clínica moderada':'Insônia clínica severa';
    default: return scored.slice(0,3).some(v=>v>=4)&&scored.slice(3).filter(v=>v>=4).length>=6?'florescimento':scored.slice(0,3).some(v=>v<=1)&&scored.slice(3).filter(v=>v<=1).length>=6?'definhamento':'moderado';
  }
}
Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST') return json({error:'Método não permitido'},405);
  try {
    const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url||!key) return json({error:'Serviço de acesso indisponível'},503);
    const admin = createClient(url,key,{auth:{persistSession:false}});
    const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
    if(!token) return json({error:'Entre na sua conta de administrador'},401);
    const {data:auth,error:authError} = await admin.auth.getUser(token);
    if(authError||!auth.user) return json({error:'Sessão inválida'},401);
    const roles = await admin.from('user_roles').select('role').eq('user_id',auth.user.id);
    if(roles.error||!canManageCases((roles.data||[]).map(r=>r.role))) return json({error:'Apenas administradores da plataforma'},403);
    const parsed = schema.safeParse(await req.json().catch(()=>null));
    if(!parsed.success) return json({error:'Informe email válido e senha com 12 caracteres, maiúscula, minúscula e número.'},400);
    if(parsed.data.action==='list') {
      const result = await admin.from('synthetic_student_cases').select('case_key,credentials_assigned,user_id,profiles(email)').eq('institution_id',AFYA_ID).order('case_key');
      check(result); return json({cases:result.data});
    }
    const {caseKey,email,password} = parsed.data;
    const definition = CASES.find(c=>c.key===caseKey);
    if(!definition) return json({error:'Caso inválido'},400);
    const result = await admin.from('synthetic_student_cases').select('*').eq('institution_id',AFYA_ID).eq('case_key',caseKey).single(); check(result);
    const row = result.data;
    if(!row?.profile_id||!row.patient_id) return json({error:'Caso não preparado'},409);
    const conflict = await admin.from('profiles').select('id').eq('email',email).neq('id',row.profile_id).limit(1); check(conflict);
    if(conflict.data?.length) return json({error:'Este email já pertence a outra conta'},409);
    if(row.user_id) {
      const target = await admin.auth.admin.getUserById(row.user_id);
      if(target.error||target.data.user?.app_metadata?.afya_study_case!==caseKey) return json({error:'Conta não identificada como caso sintético'},409);
      const updated = await admin.auth.admin.updateUserById(row.user_id,{email,password,email_confirm:true});
      if(updated.error) return json({error:'Não foi possível atualizar o acesso; confira o email e a senha.'},400);
    } else {
      const created = await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{afya_study_case:caseKey,notifications_blocked:true},user_metadata:{nome:definition.name,demo:true}});
      if(created.error||!created.data.user) return json({error:'Não foi possível criar o acesso; o email pode já estar em uso.'},400);
      row.user_id=created.data.user.id;
      check(await admin.from('synthetic_student_cases').update({user_id:row.user_id}).eq('id',row.id));
    }
    check(await admin.from('profiles').update({email,user_id:row.user_id}).eq('id',row.profile_id));
    check(await admin.from('user_tenants').upsert({user_id:row.profile_id,tenant_id:TENANT_ID,is_primary:true},{onConflict:'user_id,tenant_id'}));
    check(await admin.from('institution_buddy_students').upsert({institution_id:AFYA_ID,patient_id:row.patient_id,granted_by:auth.user.id},{onConflict:'institution_id,patient_id'}));
    if(!row.credentials_assigned) {
      await populate(admin,row,caseKey,auth.user.id);
      // Real-shaped responses now belong to a synthetic Auth account; don't count the provisional aggregate rows twice.
      check(await admin.from('institution_demo_scale_responses').delete().eq('patient_id',row.patient_id).eq('institution_id',AFYA_ID));
    }
    check(await admin.from('synthetic_student_cases').update({credentials_assigned:true}).eq('id',row.id));
    return json({success:true});
  } catch { return json({error:'Não foi possível concluir o caso. Nenhuma senha é exibida ou armazenada no cadastro de casos.'},500); }
});