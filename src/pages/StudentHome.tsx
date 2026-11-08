import { ReminderSettingsDialog, normalizePrefs, summarizePrefs } from '@/features/student-home/ReminderSettingsDialog';
import { useEffect, useMemo, useState } from 'react';
import { SupportRequestDialog } from '@/features/support-request/SupportRequestDialog';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { buildIcs, downloadIcs } from '@/features/student-home/calendar';
import { BellRing, Building2, CalendarPlus, LifeBuoy } from 'lucide-react';
import { ArrowRight, BookHeart, Bot, CalendarDays, CheckCircle2, ClipboardList, Compass, HeartPulse, Leaf, Map, Moon, Newspaper, Sparkles, Smile, Users, Zap } from 'lucide-react';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TourOverlay } from '@/components/ui/tour-overlay';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { buildTenantPath, getTenantSlugFromPath } from '@/utils/tenantHelpers';
import { currentSemester } from '@/features/permanence/instrument';
import { buildPendingActions, daysSince, sessionPhase, countdownLabel } from '@/features/student-home/pendingActions';
import { cn } from '@/lib/utils';
import { buddyWhatsAppUrl } from '@/utils/buddyWhatsApp';
import { useUserType } from '@/hooks/useUserType';
import { usePraticas } from '@/hooks/usePraticas';
import ProfessionalHome from '@/features/professional-home/ProfessionalHome';

const db = supabase as any;
const TOUR_KEY = (uid: string) => `student-home-tour-v1:${uid}`;
const TOUR = [
  { id: 'welcome', title: 'Bem-vindo ao seu espaço', description: 'Aqui você encontra tudo sobre você reunido. Seus dados são só seus: a instituição vê apenas resultados coletivos, nunca o que você registrou.', target: '[data-tour="sh-header"]' },
  { id: 'todo', title: 'O que fazer agora', description: 'As tarefas mais importantes do momento, em ordem de prioridade: diário, escalas, Radar, mensagens e encontros.', target: '[data-tour="sh-todo"]' },
  { id: 'kpis', title: 'Seus indicadores', description: 'Médias de humor, sono e ansiedade dos últimos 7 dias, comparadas com a semana anterior.', target: '[data-tour="sh-kpis"]' },
  { id: 'last', title: 'Últimos preenchimentos', description: 'Veja quando você usou cada recurso pela última vez e retome com um clique.', target: '[data-tour="sh-last"]' },
  { id: 'news', title: 'Novidades e atalhos', description: 'Mensagens, novos encontros e conteúdos, além de atalhos para o Buddy e a Biblioteca de Apoios.', target: '[data-tour="sh-news"]' },
];

const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const ago = (d: string | null | undefined) => d ? formatDistanceToNow(new Date(d.length === 10 ? `${d}T12:00:00` : d), { locale: ptBR, addSuffix: true }) : 'Nunca';

export default function StudentHome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const slug = getTenantSlugFromPath(location.pathname);
  const p = (path: string) => buildTenantPath(slug, path);
  const { hasRole: isInstAdmin, loading: roleLoading } = useUserRole('institution_admin');
  const [tourStep, setTourStep] = useState(-1);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 60_000); return () => clearInterval(t); }, []);
  const { isProfessional, loading: proLoading } = useUserType();

  useEffect(() => { if (!loading && !user) navigate(p('/auth')); }, [loading, user]); // eslint-disable-line
  useEffect(() => { if (!roleLoading && isInstAdmin) navigate(p('/portal-institucional'), { replace: true }); }, [roleLoading, isInstAdmin]); // eslint-disable-line

  const q = useQuery({
    queryKey: ['student-home', user?.id], enabled: !!user && !proLoading && !isProfessional,
    queryFn: async () => {
      const uid = user!.id;
      const since = format(subDays(new Date(), 13), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      const [mood, lastMood, journey, practice, scales, scaleResp, radar, regs, appts, threads, sessions, prof] = await Promise.all([
        db.from('mood_entries').select('date, mood_score, sleep_quality, sleep_hours, anxiety_level, energy_level').eq('user_id', uid).gte('date', since).order('date'),
        db.from('mood_entries').select('date').eq('user_id', uid).order('date', { ascending: false }).limit(60),
        db.from('journey_sessions').select('created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
        db.from('praticas_checkouts').select('created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
        db.from('emotional_scales').select('code, name, frequency_days').eq('active', true).order('display_order'),
        db.from('emotional_scale_responses').select('scale_code, taken_at').eq('user_id', uid).order('taken_at', { ascending: false }).limit(200),
        db.from('permanence_responses').select('semester, created_at').eq('user_id', uid).order('created_at', { ascending: false }),
        db.from('group_session_registrations').select('registered_at, status, group_sessions(id, title, session_date, start_time, session_type, meeting_link, duration_minutes)').eq('user_id', uid).neq('status', 'cancelled'),
        db.from('agendamentos').select('id, data_consulta, horario, payment_status, status').eq('user_id', uid).gte('data_consulta', today).order('data_consulta').limit(5),
        db.rpc('list_my_message_threads'),
        db.from('group_sessions').select('id, title, session_date, start_time, session_type').gte('session_date', today).eq('status', 'scheduled').order('session_date').limit(4),
        db.from('profiles').select('nome, tipo_usuario, email_reminders, reminder_prefs').eq('user_id', uid).maybeSingle(),
      ]);
      return {
        mood: mood.data ?? [], diaryDates: (lastMood.data ?? []).map((r: any) => r.date as string),
        journeyAt: journey.data?.[0]?.created_at ?? null, practiceAt: practice.data?.[0]?.created_at ?? null,
        scales: scales.data ?? [], scaleResp: scaleResp.data ?? [], radar: radar.data ?? [],
        regs: regs.data ?? [], appts: appts.data ?? [], threads: Array.isArray(threads.data) ? threads.data : [],
        sessions: sessions.data ?? [], name: prof.data?.nome as string | undefined, reminders: !!prof.data?.email_reminders, reminderPrefs: normalizePrefs((prof.data as any)?.reminder_prefs), tipo: prof.data?.tipo_usuario as string | undefined,
      };
    },
  });

  const instQ = useQuery({
    queryKey: ['student-home-institutions', user?.id], enabled: !!user && !proLoading && !isProfessional,
    queryFn: async () => {
      const { data } = await db.from('patient_institutions').select('institution_id, educational_institutions(id, name, logo_url)');
      const seen = new Set<string>();
      return (data ?? []).map((r: any) => r.educational_institutions).filter((i: any) => i && !seen.has(i.id) && seen.add(i.id)) as { id: string; name: string; logo_url: string | null }[];
    },
  });
  const institutions = instQ.data ?? [];

  const d = q.data;
  useEffect(() => { if (!isProfessional && d?.tipo && d.tipo !== 'paciente') navigate(p('/'), { replace: true }); }, [d?.tipo]); // eslint-disable-line
  const derived = useMemo(() => {
    if (!d) return null;
    const now = new Date();
    const cut = format(subDays(now, 6), 'yyyy-MM-dd');
    const cur = d.mood.filter((m: any) => m.date >= cut), prev = d.mood.filter((m: any) => m.date < cut);
    const kpi = (k: string) => ({ cur: avg(cur.map((m: any) => m[k])), prev: avg(prev.map((m: any) => m[k])), series: cur.map((m: any) => m[k] as number | null) });
    // streak
    const set = new Set(d.diaryDates); let streak = 0;
    for (let i = 0; i < 60; i++) { const k = format(subDays(now, i), 'yyyy-MM-dd'); if (set.has(k)) streak++; else if (i > 0) break; }
    const lastScale = (code: string) => d.scaleResp.find((r: any) => r.scale_code === code)?.taken_at ?? null;
    const upcomingRegs = d.regs.map((r: any) => r.group_sessions).filter(Boolean)
      .map((s: any) => ({ ...s, at: `${s.session_date}T${s.start_time ?? '00:00'}` }))
      .filter((s: any) => sessionPhase(s.at, s.duration_minutes, now) !== "ended").sort((a: any, b: any) => a.at.localeCompare(b.at));
    const unread = d.threads.filter((t: any) => t.recipient_id === user?.id ? !t.recipient_read_at : false).length;
    const sem = currentSemester();
    const actions = buildPendingActions({
      now, lastDiaryDate: d.diaryDates[0] ?? null,
      scales: d.scales.map((s: any) => ({ code: s.code, name: s.name, frequencyDays: s.frequency_days || 30, lastTakenAt: lastScale(s.code) })),
      currentSemester: sem, radarSemesters: d.radar.map((r: any) => r.semester), unreadMessages: unread,
      nextSessionAt: upcomingRegs[0]?.at ?? null,
      nextSession: upcomingRegs[0] ? {
        id: upcomingRegs[0].id, title: upcomingRegs[0].title, startsAt: upcomingRegs[0].at, type: upcomingRegs[0].session_type, meetingUrl: upcomingRegs[0].meeting_link,
        otherCount: upcomingRegs.slice(1).filter((s: any) => new Date(s.at).getTime() - now.getTime() <= 86_400_000).length,
      } : null,
      pendingPaymentAppointments: d.appts.filter((a: any) => a.payment_status === 'pending_payment').length,
    });
    const lastScaleAny = d.scaleResp[0]?.taken_at ?? null;
    const lastReg = [...d.regs].sort((a: any, b: any) => (b.registered_at ?? '').localeCompare(a.registered_at ?? ''))[0]?.registered_at ?? null;
    return {
      actions, streak, unread, upcomingRegs, mood: kpi('mood_score'), sleep: kpi('sleep_quality'), anxiety: kpi('anxiety_level'), energy: kpi('energy_level'),
      last: [
        { label: 'Diário emocional', icon: BookHeart, at: d.diaryDates[0] ?? null, path: '/diario-emocional/nova-entrada', cta: 'Registrar' },
        { label: 'Jornada emocional', icon: Map, at: d.journeyAt, path: '/praticas/jornada', cta: 'Iniciar' },
        { label: 'Práticas', icon: Leaf, at: d.practiceAt, path: '/praticas', cta: 'Praticar' },
        { label: 'Escalas', icon: ClipboardList, at: lastScaleAny, path: '/escalas', cta: 'Ver escalas' },
        { label: 'Radar de Permanência', icon: Compass, at: d.radar[0]?.created_at ?? null, path: '/radar-permanencia', cta: d.radar.some((r: any) => r.semester === sem) ? 'Atualizar' : 'Responder' },
        { label: 'Encontros', icon: Users, at: lastReg, path: '/encontros', cta: 'Ver agenda' },
      ],
    };
  }, [d, user?.id]);

  useEffect(() => {
    if (!isProfessional && user && derived && !localStorage.getItem(TOUR_KEY(user.id))) setTimeout(() => setTourStep(0), 600);
  }, [user?.id, !!derived]); // eslint-disable-line
  const endTour = () => { setTourStep(-1); if (user) localStorage.setItem(TOUR_KEY(user.id), '1'); };

  const firstName = d?.name?.split(' ')[0];
  const [supportOpen, setSupportOpen] = useState(false);
  const [remOpen, setRemOpen] = useState(false);
  const { data: praticasData } = usePraticas();
  const practiceOfDay = useMemo(() => {
    const list = praticasData?.praticas ?? [];
    if (!list.length) return null;
    const now = new Date();
    const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    return list[dayOfYear % list.length];
  }, [praticasData]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {isProfessional && user ? <ProfessionalHome userId={user.id} p={p} /> : <>
        <section data-tour="sh-header" className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{firstName ? `Olá, ${firstName}` : 'Meu espaço'}</h1>
            <p className="text-muted-foreground mt-1">Tudo sobre o seu cuidado, reunido em um só lugar.</p>
            {institutions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {institutions.map((i) => (
                  <div key={i.id} className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
                    {i.logo_url
                      ? <img src={i.logo_url} alt={`Logo ${i.name}`} className="h-6 w-6 rounded-full object-contain bg-background" />
                      : <Building2 className="h-5 w-5 text-primary" />}
                    <span className="text-sm font-medium" data-no-translate>{i.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {derived && derived.streak > 0 && <Badge variant="secondary" className="gap-1 py-1.5"><Sparkles className="h-3.5 w-3.5" />{derived.streak} {derived.streak === 1 ? 'dia' : 'dias'} seguidos de diário</Badge>}
            <Button variant="outline" size="sm" onClick={() => setTourStep(0)}>Ver tour</Button>
          </div>
        </section>

        {q.isLoading || !derived ? (
          <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : (<>
          <Card data-tour="sh-todo">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />O que fazer agora</CardTitle></CardHeader>
            <CardContent>
              {derived.actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tudo em dia por aqui. Que tal uma prática rápida?</p>
              ) : (
                <ul className="divide-y">
                  {derived.actions.map(a => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={cn('mt-1.5 h-2.5 w-2.5 rounded-full shrink-0', a.priority === 1 ? 'bg-destructive' : a.priority === 2 ? 'bg-primary' : 'bg-muted-foreground/50')} />
                        <div className="min-w-0"><p className="font-medium">{a.title}</p><p className="text-sm text-muted-foreground">{a.description}</p></div>
                      </div>
                      <Button size="sm" asChild>{a.external ? <a href={a.path} target="_blank" rel="noopener noreferrer">{a.cta}<ArrowRight className="h-4 w-4 ml-1" /></a> : <Link to={p(a.path)}>{a.cta}<ArrowRight className="h-4 w-4 ml-1" /></Link>}</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <section data-tour="sh-kpis" className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Humor', icon: Smile, k: derived.mood, good: 'up' },
              { label: 'Energia', icon: Zap, k: derived.energy, good: 'up' },
              { label: 'Qualidade do sono', icon: Moon, k: derived.sleep, good: 'up' },
              { label: 'Ansiedade', icon: HeartPulse, k: derived.anxiety, good: 'down' },
            ].map(({ label, icon: Icon, k, good }) => {
              const delta = k.cur != null && k.prev != null ? k.cur - k.prev : null;
              const better = delta == null || Math.abs(delta) < 0.1 ? null : (good === 'up' ? delta > 0 : delta < 0);
              const vals = k.series.filter((v): v is number => v != null);
              return (
                <Link key={label} to={p('/diario-emocional')} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="h-full transition-colors hover:border-primary/40"><CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4" /></div>
                  <p className="text-2xl font-bold mt-2">{k.cur != null ? k.cur.toFixed(1) : '—'}<span className="text-sm font-normal text-muted-foreground"> /5</span></p>
                  <p className={cn('text-xs mt-1', better === true && 'text-primary', better === false && 'text-destructive', better === null && 'text-muted-foreground')}>
                    {delta == null ? 'Média dos últimos 7 dias' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} vs. semana anterior`}
                  </p>
                  <div className="flex items-end gap-1 h-8 mt-3">
                    {vals.map((v, i) => <div key={i} className="flex-1 rounded-sm bg-primary/60" style={{ height: `${(v / 5) * 100}%` }} />)}
                  </div>
                </CardContent></Card></Link>
              );
            })}
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card data-tour="sh-last" className="lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-lg">Últimos preenchimentos</CardTitle></CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {derived.last.map(({ label, icon: Icon, at, path, cta }) => {
                    const gap = daysSince(at, new Date());
                    return (
                      <li key={label} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
                          <div><p className="font-medium text-sm">{label}</p><p className={cn('text-xs', gap === null || gap > 7 ? 'text-destructive' : 'text-muted-foreground')}>Última vez: {ago(at)}</p></div></div>
                        <Button size="sm" variant="ghost" asChild><Link to={p(path)}>{cta}</Link></Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Próximos compromissos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {derived.upcomingRegs.length === 0 && (
                  <div className="rounded-lg border border-dashed p-3 text-sm">
                    <p className="text-muted-foreground">Você não está inscrito em nenhum encontro.</p>
                    <Button size="sm" variant="link" className="px-0" asChild><Link to={p('/encontros')} onClick={() => window.scrollTo(0, 0)}>Ver agenda de encontros</Link></Button>
                  </div>
                )}
                {derived.upcomingRegs[0] && (() => {
                  const s: any = derived.upcomingRegs[0];
                  const phase = sessionPhase(s.at, s.duration_minutes, clock);
                  const canJoin = (phase === 'joinable' || phase === 'live') && !!s.meeting_link;
                  const in24 = derived.upcomingRegs.filter((x: any) => new Date(x.at).getTime() - clock.getTime() <= 86_400_000).length;
                  const typeLabel = s.session_type === 'workshop' ? 'Workshop' : s.session_type === 'roda_conversa' ? 'Roda de conversa' : s.session_type === 'palestra' ? 'Palestra' : 'Encontro';
                  return (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{typeLabel}</Badge>
                        {phase === 'live' && <Badge className="bg-destructive text-destructive-foreground animate-pulse">Ao vivo</Badge>}
                      </div>
                      <p className="font-semibold leading-tight">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(s.at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                      <p className="text-sm font-medium text-primary">{countdownLabel(s.at, clock)}</p>
                      {in24 > 1 && <p className="text-xs text-muted-foreground">Você tem {in24} encontros nas próximas 24h.</p>}
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {canJoin
                          ? <Button size="sm" asChild><a href={s.meeting_link} target="_blank" rel="noopener noreferrer">Entrar</a></Button>
                          : <Button size="sm" variant="outline" asChild><Link to={p(`/encontros/${s.id}`)} onClick={() => window.scrollTo(0, 0)}>Ver encontro</Link></Button>}
                        <Button size="sm" variant="ghost" onClick={() => downloadIcs(s.title, buildIcs({ uid: s.id, title: s.title, start: new Date(s.at), url: s.meeting_link }))}>
                          <CalendarPlus className="h-4 w-4 mr-1" />Adicionar à agenda
                        </Button>
                      </div>
                      {!canJoin && s.meeting_link && <p className="text-xs text-muted-foreground">O botão Entrar libera 15 minutos antes.</p>}
                    </div>
                  );
                })()}
                {derived.upcomingRegs.length === 0 && d!.appts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum compromisso agendado.</p>}
                {derived.upcomingRegs.slice(1, 4).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50">
                    <Link to={p(`/encontros/${s.id}`)} className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p><p className="text-xs text-muted-foreground">Encontro · {format(new Date(s.at), "d MMM, HH:mm", { locale: ptBR })}</p>
                    </Link>
                    <Button size="icon" variant="ghost" aria-label="Adicionar ao calendário" title="Adicionar ao calendário"
                      onClick={() => downloadIcs(s.title, buildIcs({ uid: s.id, title: s.title, start: new Date(s.at), url: s.meeting_link }))}>
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {d!.appts.slice(0, 3).map((a: any) => (
                  <Link key={a.id} to={p('/agendamentos')} className="block rounded-lg border p-3 hover:bg-muted/50">
                    <p className="text-sm font-medium">Consulta</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(`${a.data_consulta}T${a.horario ?? '00:00'}`), "d MMM, HH:mm", { locale: ptBR })}{a.payment_status === 'pending_payment' ? ' · pagamento pendente' : ''}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <div data-tour="sh-news" className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Newspaper className="h-5 w-5 text-primary" />Novidades</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {derived.unread > 0 && <Link to={p('/mensagens')} className="block rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm font-medium">Você tem {derived.unread} {derived.unread === 1 ? 'mensagem não lida' : 'mensagens não lidas'}</Link>}
                {d!.sessions.map((s: any) => (
                  <Link key={s.id} to={p(`/encontros/${s.id}`)} className="flex justify-between gap-3 rounded-lg p-3 hover:bg-muted/50 text-sm">
                    <span><Badge variant="outline" className="mr-2">Encontro</Badge>{s.title}</span><span className="text-muted-foreground shrink-0">{format(new Date(`${s.session_date}T12:00`), 'd MMM', { locale: ptBR })}</span>
                  </Link>
                ))}
                {derived.unread === 0 && d!.sessions.length === 0 && <p className="text-sm text-muted-foreground">Sem novidades no momento.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Atalhos</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <a href={buddyWhatsAppUrl('Olá, Buddy!')} target="_blank" rel="noopener noreferrer" className="rounded-lg border p-3 flex flex-col items-center gap-2 text-sm hover:bg-muted/50"><Bot className="h-5 w-5 text-primary" />Buddy</a>
                {[{ l: 'Apoios', i: Leaf, to: '/biblioteca-apoios' }, { l: 'Práticas', i: Sparkles, to: '/praticas' }, { l: 'Minhas emoções', i: HeartPulse, to: '/minhas-emocoes' }].map(({ l, i: I, to }) => (
                  <Link key={l} to={p(to)} className="rounded-lg border p-3 flex flex-col items-center gap-2 text-sm hover:bg-muted/50"><I className="h-5 w-5 text-primary" />{l}</Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card><CardContent className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" />Prática do dia</p>
              <p className="font-semibold">{practiceOfDay?.titulo ?? 'Explore as práticas'}</p>
              <Button size="sm" variant="outline" asChild><Link to={p(practiceOfDay ? `/praticas/${practiceOfDay.slug}` : '/praticas')} onClick={() => window.scrollTo(0, 0)}>Praticar agora</Link></Button>
            </CardContent></Card>
            <Card><CardContent className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-primary" />Precisa conversar com alguém?</p>
              <p className="text-sm">Peça apoio à equipe de cuidado da sua instituição.</p>
              <Button size="sm" onClick={() => setSupportOpen(true)}>Pedir apoio</Button>
              <SupportRequestDialog open={supportOpen} onOpenChange={setSupportOpen} />
            </CardContent></Card>
            <Card><CardContent className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2"><BellRing className="h-4 w-4 text-primary" />Lembretes por e-mail</p>
              <p className="text-sm">{d!.reminders ? summarizePrefs(d!.reminderPrefs) : 'Desativados. Escolha o que lembrar e com que frequência.'}</p>
              <Button size="sm" variant="outline" onClick={() => setRemOpen(true)}>Configurar</Button>
              <ReminderSettingsDialog open={remOpen} onOpenChange={setRemOpen} userId={user!.id} enabled={d!.reminders} prefs={d!.reminderPrefs} onSaved={() => q.refetch()} />
            </CardContent></Card>
          </div>
        </>)}
        </>}
      </main>
      <Footer />
      {!isProfessional && <TourOverlay show={tourStep >= 0} currentStep={Math.max(0, tourStep)} totalSteps={TOUR.length} stepData={TOUR[tourStep]}
        onNext={() => (tourStep >= TOUR.length - 1 ? endTour() : setTourStep(tourStep + 1))} onPrev={() => setTourStep(Math.max(0, tourStep - 1))} onSkip={endTour} />}
    </div>
  );
}
