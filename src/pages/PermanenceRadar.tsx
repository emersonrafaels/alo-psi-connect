import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Compass, History, Lock, Menu, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { buildTenantPath, getTenantSlugFromPath } from '@/utils/tenantHelpers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MODULES, currentSemester, isAnswered, isVisible, progress, toggleMulti, type Answers } from '@/features/permanence/instrument';
import { cn } from '@/lib/utils';

const DRAFT_KEY = (uid: string) => `radar-permanencia-draft:${uid}`;
type Row = { id: string; semester: string; answers: Answers; created_at: string };

export default function PermanenceRadar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { hasRole: isInstitutionAdmin, loading: institutionAdminLoading } = useUserRole('institution_admin');
  const [mode, setMode] = useState<'summary' | 'form'>('summary');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [saving, setSaving] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [loading, user, navigate]);

  // Usuários vinculados a instituição acessam o radar apenas pelo Portal Institucional (Comparador).
  useEffect(() => {
    if (!loading && user && !institutionAdminLoading && isInstitutionAdmin) {
      navigate(buildTenantPath(getTenantSlugFromPath(location.pathname), '/portal-institucional/comparador'), { replace: true });
    }
  }, [loading, user, institutionAdminLoading, isInstitutionAdmin, navigate]);

  const history = useQuery({
    queryKey: ['permanence-mine', user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('permanence_responses').select('id, semester, answers, created_at').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const rows = history.data ?? [];
  const latest = rows[0];

  useEffect(() => { if (!history.isLoading && !latest) setMode('form'); }, [history.isLoading, latest]);
  useEffect(() => {
    if (!user || mode !== 'form') return;
    const d = localStorage.getItem(DRAFT_KEY(user.id));
    setAnswers(d ? JSON.parse(d) : latest?.answers ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.id]);
  useEffect(() => { if (user && mode === 'form') localStorage.setItem(DRAFT_KEY(user.id), JSON.stringify(answers)); }, [answers, user, mode]);

  const mod = MODULES[step];
  const pct = progress(answers);
  const moduleDone = useMemo(() => MODULES.map((m) => m.items.every((q) => isAnswered(q, answers))), [answers]);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: prof } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      const { data: pac } = prof ? await supabase.from('pacientes').select('id').eq('profile_id', prof.id).maybeSingle() : { data: null };
      const { data: pi } = pac ? await supabase.from('patient_institutions').select('institution_id').eq('patient_id', pac.id).limit(1).maybeSingle() : { data: null };
      const { error } = await (supabase as any).from('permanence_responses').insert({
        user_id: user.id, patient_id: pac?.id ?? null, institution_id: pi?.institution_id ?? null, semester: currentSemester(),
        answers: Object.fromEntries(Object.entries(answers).filter(([id]) => { const q = MODULES.flatMap((m) => m.items).find((x) => x.id === id); return q ? isVisible(q, answers) : false; })),
      });
      if (error) throw error;
      localStorage.removeItem(DRAFT_KEY(user.id));
      await qc.invalidateQueries({ queryKey: ['permanence-mine'] });
      toast({ title: 'Respostas enviadas', description: 'Obrigado! Você pode atualizar quando quiser.' });
      setMode('summary'); setStep(0); scrollTop();
    } catch (e: any) {
      toast({ title: 'Não foi possível enviar', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const scrollTop = () => document.getElementById('radar-main')?.scrollTo(0, 0);
  const go = (i: number) => { setStep(i); setNavOpen(false); scrollTop(); };
  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const goBack = () => { if ((window.history.state?.idx ?? 0) > 0) navigate(-1); else navigate(buildTenantPath(getTenantSlugFromPath(location.pathname), '/')); };
  const visibleOf = (i: number) => MODULES[i].items.filter((q) => isVisible(q, answers));
  const totalQ = MODULES.reduce((s, _m, i) => s + visibleOf(i).length, 0);
  const doneQ = MODULES.reduce((s, _m, i) => s + visibleOf(i).filter((q) => isAnswered(q, answers)).length, 0);

  const nav = (
    <nav className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">Seu percurso</span><span className="text-muted-foreground">{doneQ} de {totalQ}</span></div>
        <Progress value={totalQ ? (doneQ / totalQ) * 100 : 0} className="h-1.5" />
      </div>
      <ul className="space-y-1">{MODULES.map((m, i) => {
        const vis = visibleOf(i); const ans = vis.filter((q) => isAnswered(q, answers)).length;
        return (
          <li key={m.id}>
            <button onClick={() => { if (mode !== 'form') setMode('form'); go(i); }} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors', mode === 'form' && i === step ? 'bg-primary/15 font-medium text-foreground' : 'text-muted-foreground hover:bg-muted')}>
              <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs', moduleDone[i] ? 'border-primary bg-primary text-primary-foreground' : mode === 'form' && i === step ? 'border-primary text-primary' : 'border-border')}>
                {moduleDone[i] ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="flex-1">{m.title}</span>
              <span className="text-xs tabular-nums">{ans}/{vis.length}</span>
            </button>
          </li>);
      })}</ul>
    </nav>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary"><Compass className="h-4 w-4" /></div>
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Rede Bem-Estar</p>
            <p className="text-sm font-semibold">Radar de Permanência</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild><Button variant="outline" size="sm" className="lg:hidden"><Menu className="mr-2 h-4 w-4" />Seu percurso</Button></SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto pt-10">{nav}</SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r p-5 lg:block">{nav}</aside>
        <main id="radar-main" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8">
        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertDescription>Suas respostas são confidenciais. A instituição vê apenas resultados coletivos de grupos com 10 ou mais pessoas, nunca o que você respondeu.</AlertDescription>
        </Alert>
        {mode === 'summary' && latest && (
          <div className="space-y-4">
            <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm text-muted-foreground">Última resposta</p>
                <p className="text-lg font-semibold">{fmt(latest.created_at)} · semestre {latest.semester}</p>
              </div>
              <Button onClick={() => { setMode('form'); go(0); }}><RefreshCw className="mr-2 h-4 w-4" />Atualizar respostas</Button>
            </CardContent></Card>
            <Card><CardContent className="p-6">
              <p className="mb-3 flex items-center gap-2 font-medium"><History className="h-4 w-4" />Histórico</p>
              <ul className="divide-y">{rows.map((r, i) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{fmt(r.created_at)}</span>
                  <span className="text-muted-foreground">{r.semester}{i === 0 ? ' · atual' : ''}</span>
                </li>))}</ul>
            </CardContent></Card>
          </div>
        )}

        {mode === 'form' && (
          <div className="space-y-6">
            <Card><CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Tema {step + 1} de {MODULES.length} · {mod.period}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{mod.title}</h2>
              <p className="mt-2 text-muted-foreground">{mod.intro}</p>
              <p className="mt-3 text-sm text-muted-foreground"><b className="text-foreground">{visibleOf(step).length}</b> perguntas · {pct}% respondido</p>
            </CardContent></Card>

            {mod.items.filter((q) => isVisible(q, answers)).map((q) => {
              const v = answers[q.id];
              return (
                <Card key={q.id}><CardContent className="space-y-3 p-5">
                  <p className="font-medium">{q.text}</p>
                  {q.type === 'multi' && <p className="text-xs text-muted-foreground">Marque todas que se aplicam</p>}
                  {q.type === 'text' ? (
                    <Textarea value={(v as string) ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="Opcional" rows={4} />
                  ) : (
                    <div className="grid gap-2">{q.options.map((o) => {
                      const on = q.type === 'multi' ? ((v as string[]) ?? []).includes(o) : v === o;
                      return (
                        <button key={o} type="button" onClick={() => setAnswers({ ...answers, [q.id]: q.type === 'multi' ? toggleMulti(q, (v as string[]) ?? [], o) : o })}
                          className={cn('flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors', on ? 'border-primary bg-primary/10' : 'hover:bg-muted')}>
                          <span className={cn('grid h-4 w-4 shrink-0 place-items-center border', q.type === 'multi' ? 'rounded' : 'rounded-full', on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>{on && <Check className="h-3 w-3" />}</span>
                          {o}
                        </button>);
                    })}</div>
                  )}
                </CardContent></Card>
              );
            })}

            <div className="flex items-center justify-between gap-3 pb-12">
              <Button variant="outline" disabled={step === 0} onClick={() => go(step - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
              {latest && <Button variant="ghost" onClick={() => setMode('summary')}>Cancelar</Button>}
              {step < MODULES.length - 1
                ? <Button onClick={() => go(step + 1)}>Próximo<ArrowRight className="ml-2 h-4 w-4" /></Button>
                : <Button disabled={saving || pct < 100} onClick={submit}>{saving ? 'Enviando…' : pct < 100 ? `Faltam perguntas (${pct}%)` : 'Enviar respostas'}</Button>}
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}
