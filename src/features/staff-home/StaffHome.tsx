import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, ArrowRight, Building2, CalendarDays, CheckCircle2, ClipboardList, HeartHandshake, LifeBuoy, Radar, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TourOverlay } from '@/components/ui/tour-overlay';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { buildStaffActions, staffShortcuts, type StaffSummary } from './staffActions';

const TOUR_KEY = (uid: string, k: string) => `staff-home-tour-v1:${k}:${uid}`;

export default function StaffHome({ userId, kind, roles }: { userId: string; kind: 'admin_rbe' | 'clinical'; roles: string[] }) {
  const clinical = kind === 'clinical';
  const q = useQuery({
    queryKey: ['staff-home', userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_staff_home_summary');
      if (error) throw error;
      return data as StaffSummary;
    },
  });
  const s = q.data;
  const actions = s ? buildStaffActions(kind, s) : [];
  const shortcuts = staffShortcuts(roles);

  const TOUR = [
    { id: 'welcome', title: 'Bem-vindo ao seu espaço', description: clinical ? 'Sua central de coordenação clínica: a saúde dos alunos de todas as instituições, sempre anonimizada.' : 'Sua central como Admin RBE: os números da rede e o que precisa da sua atenção.', target: '[data-tour="st-header"]' },
    { id: 'todo', title: 'O que fazer agora', description: 'As pendências mais importantes, em ordem de prioridade.', target: '[data-tour="st-todo"]' },
    { id: 'kpis', title: 'Indicadores', description: 'Contagens de toda a rede. Nenhum dado individual aparece aqui.', target: '[data-tour="st-kpis"]' },
    { id: 'links', title: 'Atalhos', description: 'Só as páginas que o seu perfil pode abrir.', target: '[data-tour="st-links"]' },
  ];
  const [tourStep, setTourStep] = useState(-1);
  useEffect(() => { if (s && !localStorage.getItem(TOUR_KEY(userId, kind))) setTimeout(() => setTourStep(0), 600); }, [!!s]); // eslint-disable-line
  const endTour = () => { localStorage.setItem(TOUR_KEY(userId, kind), '1'); setTourStep(-1); };

  const kpis = !s ? [] : clinical ? [
    { label: 'Triagens em aberto', value: s.triage_open, icon: ClipboardList },
    { label: 'Prioridade alta', value: s.triage_urgent, icon: AlertTriangle },
    { label: 'Pedidos de apoio abertos', value: s.care_open, icon: LifeBuoy },
    { label: 'Retornos vencidos', value: s.followups_overdue, icon: CalendarDays },
    { label: `Radar ${s.radar_semester} respondido`, value: s.radar_answered, icon: Radar },
    { label: 'Alunos vinculados', value: s.students, icon: Users },
  ] : [
    { label: 'Instituições ativas', value: s.institutions, icon: Building2 },
    { label: 'Alunos vinculados', value: s.students, icon: Users },
    { label: 'Profissionais ativos', value: s.professionals_active, icon: Stethoscope },
    { label: 'Agendamentos (7 dias)', value: s.appointments_week, icon: CalendarDays },
    { label: 'Pedidos de apoio abertos', value: s.care_open, icon: LifeBuoy },
    { label: 'Triagens em aberto', value: s.triage_open, icon: ClipboardList },
  ];

  return (
    <>
      <section data-tour="st-header" className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Meu espaço</h1>
          <p className="text-muted-foreground mt-1">{clinical ? 'Coordenação clínica · todas as instituições' : 'Admin RBE · visão da rede'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTourStep(0)}>Ver tour</Button>
          <Button asChild size="sm"><Link to={clinical ? '/admin/portal-institucional' : '/admin'}>Abrir painel <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>
      </section>

      {clinical && (
        <div className="flex items-start gap-3 rounded-xl border-l-4 border-primary bg-primary/5 p-4 text-sm">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <p>Os alunos aparecem sempre como "Aluno #N". Você vê sinais e números, nunca o que o aluno escreveu.</p>
        </div>
      )}

      <Card data-tour="st-todo">
        <CardHeader><CardTitle className="text-lg">O que fazer agora</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {q.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {q.isError && <p className="text-sm text-destructive">Não foi possível carregar o resumo.</p>}
          {s && actions.length === 0 && <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Nada pendente agora.</p>}
          {actions.map((a) => (
            <Link key={a.id} to={a.to} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className={cn('h-2.5 w-2.5 rounded-full', a.tone === 'urgent' ? 'bg-destructive' : a.tone === 'warn' ? 'bg-destructive/50' : 'bg-primary')} />
                <div><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.detail}</p></div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <div data-tour="st-kpis" className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}><CardContent className="p-4">
            <k.icon className="h-5 w-5 text-primary" />
            <p className="text-2xl font-bold mt-2">{k.value.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {s && s.by_institution.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><HeartHandshake className="h-5 w-5" /> Por instituição</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {s.by_institution.map((i) => (
              <div key={i.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
                <div className="flex items-center gap-3">
                  {i.logo_url ? <img src={i.logo_url} alt="" className="h-8 w-8 rounded object-contain" /> : <Building2 className="h-8 w-8 text-muted-foreground" />}
                  <div><p className="font-medium text-sm">{i.name}</p><p className="text-xs text-muted-foreground">{i.students.toLocaleString('pt-BR')} alunos</p></div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{i.triage_open} triagens</Badge>
                  {i.triage_urgent > 0 && <Badge variant="destructive">{i.triage_urgent} prioridade alta</Badge>}
                  <Badge variant="secondary">{i.care_open} pedidos</Badge>
                  <Button asChild size="sm" variant="ghost"><Link to={`/portal-institucional?inst=${i.id}`}>Abrir</Link></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card data-tour="st-links">
        <CardHeader><CardTitle className="text-lg">Atalhos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {shortcuts.map((l) => <Button key={l.to} asChild variant="outline" size="sm"><Link to={l.to}>{l.title}</Link></Button>)}
        </CardContent>
      </Card>

      <TourOverlay show={tourStep >= 0} currentStep={Math.max(0, tourStep)} totalSteps={TOUR.length} stepData={TOUR[Math.max(0, tourStep)]}
        onNext={() => (tourStep + 1 >= TOUR.length ? endTour() : setTourStep(tourStep + 1))} onPrev={() => setTourStep(Math.max(0, tourStep - 1))} onSkip={endTour} />
    </>
  );
}
