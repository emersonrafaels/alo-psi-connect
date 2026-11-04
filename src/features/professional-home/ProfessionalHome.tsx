import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Briefcase, Building2, CalendarDays, CheckCircle2, Newspaper, UserRound, Users, Wallet, CalendarCheck, TrendingUp, CalendarOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TourOverlay } from '@/components/ui/tour-overlay';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { apptAt, buildProActions, profileCompleteness, proKpis } from './professionalActions';

const db = supabase as any;
const TOUR_KEY = (uid: string) => `pro-home-tour-v1:${uid}`;
const TOUR = [
  { id: 'welcome', title: 'Bem-vindo ao seu espaço', description: 'Sua central como profissional: agenda, pendências, indicadores e perfil em um só lugar.', target: '[data-tour="ph-header"]' },
  { id: 'todo', title: 'O que fazer agora', description: 'Consultas próximas, pagamentos pendentes e o que falta no seu perfil, em ordem de prioridade.', target: '[data-tour="ph-todo"]' },
  { id: 'kpis', title: 'Seus indicadores', description: 'Consultas da semana, atendimentos do mês e faturamento estimado com consultas pagas.', target: '[data-tour="ph-kpis"]' },
  { id: 'agenda', title: 'Agenda', description: 'Próximas consultas, encontros que você conduz e suas folgas cadastradas.', target: '[data-tour="ph-agenda"]' },
  { id: 'profile', title: 'Perfil e atalhos', description: 'Acompanhe o preenchimento do seu perfil público e acesse a Área Profissional.', target: '[data-tour="ph-profile"]' },
];
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ProfessionalHome({ userId, p }: { userId: string; p: (path: string) => string }) {
  const [tourStep, setTourStep] = useState(-1);
  const q = useQuery({
    queryKey: ['pro-home', userId],
    queryFn: async () => {
      const { data: prof } = await db.from('profiles').select('id, nome').eq('user_id', userId).maybeSingle();
      const { data: pro } = prof ? await db.from('profissionais').select('*').eq('profile_id', prof.id).maybeSingle() : { data: null };
      if (!pro) return { prof, pro: null } as any;
      const from = format(subDays(new Date(), 60), 'yyyy-MM-dd'), today = format(new Date(), 'yyyy-MM-dd');
      const [appts, slots, off, sessions, insts, threads, posts] = await Promise.all([
        db.from('agendamentos').select('id, data_consulta, horario, payment_status, status, valor, meeting_link').eq('professional_id', pro.id).gte('data_consulta', from).order('data_consulta').order('horario'),
        db.from('profissionais_sessoes').select('id').eq('user_id', pro.user_id).limit(1),
        db.from('professional_unavailability').select('date, start_time, end_time, all_day, reason').eq('professional_id', pro.id).gte('date', today).order('date').limit(3),
        db.from('group_sessions').select('id, title, session_date, start_time, current_registrations, status').or(`professional_id.eq.${pro.id},created_by.eq.${userId}`).order('session_date', { ascending: false }).limit(50),
        db.from('professional_institutions').select('institution_id, educational_institutions(name)').eq('professional_id', pro.id).eq('is_active', true),
        db.rpc('list_my_message_threads'),
        db.from('blog_posts').select('title, slug').eq('status', 'published').order('published_at', { ascending: false }).limit(3),
      ]);
      return { prof, pro, appts: appts.data ?? [], hasSchedule: (slots.data ?? []).length > 0, off: off.data ?? [], sessions: sessions.data ?? [],
        insts: insts.data ?? [], threads: Array.isArray(threads.data) ? threads.data : [], posts: posts.data ?? [] };
    },
  });
  const d = q.data;

  const v = useMemo(() => {
    if (!d?.pro) return null;
    const now = new Date();
    const upcomingSessions = d.sessions.map((s: any) => ({ ...s, at: `${s.session_date}T${s.start_time ?? '00:00'}` }))
      .filter((s: any) => new Date(s.at).getTime() > now.getTime() - 3_600_000 && s.status !== 'cancelled').sort((a: any, b: any) => a.at.localeCompare(b.at));
    const past30 = d.sessions.filter((s: any) => { const x = new Date(`${s.session_date}T12:00`).getTime(); return x <= now.getTime() && x >= now.getTime() - 30 * 86_400_000; });
    const unread = d.threads.filter((t: any) => t.recipient_id === userId && !t.recipient_read_at).length;
    const upcomingAppts = d.appts.filter((a: any) => apptAt(a).getTime() >= now.getTime() - 3_600_000 && a.status !== 'cancelled').slice(0, 5);
    return {
      unread, upcomingSessions, upcomingAppts, completeness: profileCompleteness(d.pro), kpis: proKpis(d.appts, now),
      sessionsDone: past30.length, participants: past30.reduce((s: number, x: any) => s + (x.current_registrations ?? 0), 0),
      actions: buildProActions({ now, profile: d.pro, hasSchedule: d.hasSchedule, appts: d.appts, nextSessionAt: upcomingSessions[0]?.at ?? null, unreadMessages: unread }),
    };
  }, [d, userId]);

  useEffect(() => { if (v && !localStorage.getItem(TOUR_KEY(userId))) setTimeout(() => setTourStep(0), 600); }, [!!v]); // eslint-disable-line
  const endTour = () => { setTourStep(-1); localStorage.setItem(TOUR_KEY(userId), '1'); };

  if (q.isLoading) return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;
  if (!d?.pro || !v) return (
    <Card><CardContent className="p-6 space-y-3"><p className="font-medium">Não encontramos seu cadastro profissional.</p>
      <Button asChild><Link to={p('/professional-profile')}>Ir para a Área Profissional</Link></Button></CardContent></Card>
  );
  const pro = d.pro;
  const name = pro.display_name || [pro.first_name, pro.last_name].filter(Boolean).join(' ') || d.prof?.nome;
  const k = v.kpis;

  return (
    <>
      <section data-tour="ph-header" className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">{name ? `Olá, ${String(name).split(' ')[0]}` : 'Meu espaço'}</h1>
          <p className="text-muted-foreground mt-1">{[pro.profissao, pro.crp_crm].filter(Boolean).join(' · ') || 'Profissional da Rede Bem-Estar'}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Badge variant={pro.ativo ? 'default' : 'secondary'}>{pro.ativo ? 'Perfil ativo' : 'Perfil inativo'}</Badge>
          <Button variant="outline" size="sm" onClick={() => setTourStep(0)}>Ver tour</Button>
        </div>
      </section>

      <Card data-tour="ph-todo">
        <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />O que fazer agora</CardTitle></CardHeader>
        <CardContent>
          {v.actions.length === 0 ? <p className="text-sm text-muted-foreground">Tudo em dia por aqui.</p> : (
            <ul className="divide-y">{v.actions.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={cn('mt-1.5 h-2.5 w-2.5 rounded-full shrink-0', a.priority === 1 ? 'bg-destructive' : a.priority === 2 ? 'bg-primary' : 'bg-muted-foreground/50')} />
                  <div className="min-w-0"><p className="font-medium">{a.title}</p><p className="text-sm text-muted-foreground">{a.description}</p></div>
                </div>
                <Button size="sm" asChild><Link to={p(a.path)}>{a.cta}<ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
              </li>))}</ul>
          )}
        </CardContent>
      </Card>

      <section data-tour="ph-kpis" className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Consultas nos próximos 7 dias', icon: CalendarCheck, value: String(k.next7), sub: 'Agendadas' },
          { label: 'Consultas pagas (30 dias)', icon: TrendingUp, value: String(k.last30), sub: `${k.last30 - k.prev30 >= 0 ? '+' : ''}${k.last30 - k.prev30} vs. 30 dias anteriores` },
          { label: 'Faturamento estimado no mês', icon: Wallet, value: brl(k.revenue), sub: 'Consultas pagas' },
          { label: 'Encontros conduzidos (30 dias)', icon: Users, value: String(v.sessionsDone), sub: `${v.participants} participantes inscritos` },
        ].map(({ label, icon: Icon, value, sub }) => (
          <Card key={label}><CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground gap-2"><span>{label}</span><Icon className="h-4 w-4 shrink-0" /></div>
            <p className="text-2xl font-bold mt-2">{value}</p><p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </CardContent></Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card data-tour="ph-agenda" className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Agenda</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {v.upcomingAppts.length === 0 && v.upcomingSessions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum compromisso nos próximos dias.</p>}
            {v.upcomingAppts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div><p className="text-sm font-medium">Consulta · {format(apptAt(a), "EEE, d MMM 'às' HH:mm", { locale: ptBR })}</p>
                  <p className={cn('text-xs', a.payment_status === 'paid' ? 'text-primary' : 'text-muted-foreground')}>{a.payment_status === 'paid' ? 'Pagamento confirmado' : a.payment_status === 'failed' ? 'Pagamento recusado' : 'Pagamento pendente'}</p></div>
                {a.meeting_link && <Button size="sm" variant="outline" asChild><a href={a.meeting_link} target="_blank" rel="noreferrer">Abrir chamada</a></Button>}
              </div>
            ))}
            {v.upcomingSessions.slice(0, 3).map((s: any) => (
              <Link key={s.id} to={p(`/encontros/${s.id}`)} className="flex justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50">
                <div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-muted-foreground">Encontro · {format(new Date(s.at), "d MMM, HH:mm", { locale: ptBR })}</p></div>
                <Badge variant="outline">{s.current_registrations ?? 0} inscritos</Badge>
              </Link>
            ))}
            {d.off.length > 0 && <div className="pt-2"><p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><CalendarOff className="h-3.5 w-3.5" />Folgas cadastradas</p>
              {d.off.map((o: any, i: number) => <p key={i} className="text-sm">{format(new Date(`${o.date}T12:00`), 'd MMM', { locale: ptBR })} · {o.all_day ? 'Dia inteiro' : `${o.start_time?.slice(0, 5)}–${o.end_time?.slice(0, 5)}`}{o.reason ? ` · ${o.reason}` : ''}</p>)}</div>}
          </CardContent>
        </Card>

        <Card data-tour="ph-profile">
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Meu perfil público</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>Preenchimento</span><span className="font-semibold">{v.completeness.pct}%</span></div>
            <Progress value={v.completeness.pct} />
            {v.completeness.missing.length > 0 && <p className="text-xs text-muted-foreground">Falta: {v.completeness.missing.join(', ')}</p>}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" asChild><Link to={p('/professional-profile')}><Briefcase className="h-4 w-4 mr-1" />Área Profissional</Link></Button>
              <Button size="sm" variant="outline" asChild><Link to={p(`/profissional/${pro.id}`)}>Ver como paciente</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Newspaper className="h-5 w-5 text-primary" />Novidades</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {v.unread > 0 && <Link to={p('/mensagens')} className="block rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm font-medium">Você tem {v.unread} {v.unread === 1 ? 'mensagem não lida' : 'mensagens não lidas'}</Link>}
            {d.posts.map((b: any) => <Link key={b.slug} to={p(`/blog/${b.slug}`)} className="block rounded-lg p-3 hover:bg-muted/50 text-sm"><Badge variant="outline" className="mr-2">Blog</Badge>{b.title}</Link>)}
            {v.unread === 0 && d.posts.length === 0 && <p className="text-sm text-muted-foreground">Sem novidades no momento.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Instituições vinculadas</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {d.insts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum vínculo ativo.</p> :
              d.insts.map((i: any) => <p key={i.institution_id} className="text-sm">{i.educational_institutions?.name ?? 'Instituição'}</p>)}
          </CardContent>
        </Card>
      </div>

      <TourOverlay show={tourStep >= 0} currentStep={Math.max(0, tourStep)} totalSteps={TOUR.length} stepData={TOUR[tourStep]}
        onNext={() => (tourStep >= TOUR.length - 1 ? endTour() : setTourStep(tourStep + 1))} onPrev={() => setTourStep(Math.max(0, tourStep - 1))} onSkip={endTour} />
    </>
  );
}
