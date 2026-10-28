import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { triageActionLabel } from '@/features/triage/signalRules';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Eye, Heart, HelpCircle, CheckCircle2, ChevronRight, Clock, MessageSquareWarning, UserX, ArrowRight } from 'lucide-react';
import type { Risk, PriorityItem, PriorityInput, TriageAction } from './priorities';

export const RISK_META: Record<Risk, { label: string; icon: typeof AlertTriangle; dot: string; ring: string; hint: string }> = {
  critical: { label: 'Sinal elevado', icon: AlertTriangle, dot: 'bg-destructive', ring: 'border-destructive/40', hint: 'Contato no mesmo dia' },
  alert: { label: 'Alerta', icon: AlertCircle, dot: 'bg-[hsl(var(--chart-4))]', ring: 'border-[hsl(var(--chart-4))]/40', hint: 'Acolher em até 7 dias' },
  attention: { label: 'Atenção', icon: Eye, dot: 'bg-[hsl(var(--chart-3))]', ring: 'border-[hsl(var(--chart-3))]/40', hint: 'Monitorar no próximo check-in' },
  healthy: { label: 'Sem sinais prioritários', icon: Heart, dot: 'bg-[hsl(var(--chart-2))]', ring: 'border-border', hint: 'Sem ação necessária' },
  no_data: { label: 'Dados insuficientes', icon: HelpCircle, dot: 'bg-muted-foreground/50', ring: 'border-border', hint: 'Incentivar o registro no diário' },
};

const ORDER: Risk[] = ['critical', 'alert', 'attention', 'healthy', 'no_data'];

export function ViewHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function TriageSummary(props: {
  counts: Record<Risk, number>;
  pendingByRisk: Record<Risk, number>;
  total: number;
  periodDays: number;
  overdueFollowUps: number;
  actions: TriageAction[];
  onOpenRisk: (r: Risk) => void;
  onAction: (a: TriageAction['key']) => void;
}) {
  const { counts, pendingByRisk, total, periodDays, overdueFollowUps, actions } = props;
  const needing = counts.critical + counts.alert + counts.attention;
  const actionText: Record<TriageAction['key'], { title: string; desc: string; cta: string; icon: typeof AlertTriangle }> = {
    keywords: { title: 'Revisar alunos com palavra crítica no diário', desc: 'Termos sensíveis apareceram nos registros. Priorize contato.', cta: 'Ver alunos', icon: MessageSquareWarning },
    critical: { title: 'Triar alunos com sinal elevado', desc: 'Alunos Sinal elevado ainda sem triagem.', cta: 'Começar triagem', icon: AlertTriangle },
    followups: { title: 'Resolver follow-ups vencidos', desc: 'Acompanhamentos que passaram da data combinada.', cta: 'Ver follow-ups', icon: Clock },
    no_data: { title: 'Revisar alunos sem registros', desc: `Sem registro no diário nos últimos ${periodDays} dias e ainda sem triagem. ${counts.no_data} sem registros no período no total.`, cta: 'Ver lista', icon: UserX },
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Resposta rápida</p>
          <p className="mt-1 text-xl font-semibold leading-snug">
            {needing === 0 && overdueFollowUps === 0
              ? `Nenhum aluno precisa de atenção nos últimos ${periodDays} dias.`
              : <>
                  <span className="text-primary">{needing} de {total} alunos</span> precisam de atenção nos últimos {periodDays} dias
                  {pendingByRisk.critical > 0 && <>: <strong>{pendingByRisk.critical} com sinal elevado ainda não triado{pendingByRisk.critical > 1 ? 's' : ''}</strong></>}
                  {overdueFollowUps > 0 && <>{pendingByRisk.critical > 0 ? ' e ' : ': '}<strong>{overdueFollowUps} follow-up{overdueFollowUps > 1 ? 's' : ''} vencido{overdueFollowUps > 1 ? 's' : ''}</strong></>}.
                </>}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {ORDER.map((r) => {
          const m = RISK_META[r];
          const Icon = m.icon;
          const pct = total ? Math.round((counts[r] / total) * 100) : 0;
          return (
            <button key={r} type="button" onClick={() => props.onOpenRisk(r)}
              className={`group rounded-xl border-2 ${m.ring} bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />{m.label}
                <Icon className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:scale-110" />
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight">{counts[r]}</p>
              <p className="text-xs text-muted-foreground">{pct}% dos alunos</p>
              {r !== 'healthy' && pendingByRisk[r] > 0 && (
                <p className="mt-2 text-xs font-medium text-foreground">{pendingByRisk[r]} sem triagem</p>
              )}
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">{m.hint}<ChevronRight className="h-3 w-3" /></p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">O que fazer agora</CardTitle>
          <CardDescription>Ações em ordem de prioridade. Clique para ir direto aos alunos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary" />Tudo em dia. Nenhuma ação pendente agora.
            </div>
          ) : actions.map((a, i) => {
            const t = actionText[a.key];
            const Icon = t.icon;
            return (
              <div key={a.key} className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.title} <Badge variant="secondary" className="ml-1">{a.count}</Badge></p>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
                <Button size="sm" onClick={() => props.onAction(a.key)}>{t.cta}<ArrowRight className="ml-1 h-4 w-4" /></Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function TriagePriorities<T extends PriorityInput>(props: {
  items: PriorityItem<T>[];
  nameOf: (patientId: string) => string;
  onTriage: (s: T) => void;
  onHistory: (s: T) => void;
}) {
  if (props.items.length === 0) {
    return <Card><CardContent className="flex items-center gap-3 p-6 text-sm"><CheckCircle2 className="h-5 w-5 text-primary" />Nenhum aluno com sinais prioritários agora.</CardContent></Card>;
  }
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {props.items.map((p, i) => {
          const m = RISK_META[p.student.riskLevel];
          return (
            <div key={p.student.patientId} className="flex flex-wrap items-center gap-4 p-4">
              <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => props.onHistory(p.student)} className="font-semibold text-primary hover:underline">{props.nameOf(p.student.patientId)}</button>
                <span className="ml-2 text-xs text-muted-foreground">{m.label}</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.reasons.map((r) => <Badge key={r} variant="outline" className="font-normal">{r}</Badge>)}
                </div>
              </div>
              <Button size="sm" onClick={() => props.onTriage(p.student)}>{triageActionLabel((p.student as { lastTriageId?: string | null }).lastTriageId)}</Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export interface FollowUpRow { id: string; patientId: string; followUpDate: string; status: string; action?: string | null }

export function TriageFollowUps(props: {
  rows: FollowUpRow[];
  nameOf: (patientId: string) => string;
  onResolve: (id: string) => void;
  onContact: (patientId: string) => void;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = (d: string) => Math.round((new Date(d + (d.length === 10 ? 'T00:00:00' : '')).getTime() - today.getTime()) / 86400000);
  const overdue = props.rows.filter((r) => days(r.followUpDate) < 0).sort((a, b) => days(a.followUpDate) - days(b.followUpDate));
  const upcoming = props.rows.filter((r) => { const d = days(r.followUpDate); return d >= 0 && d <= 7; }).sort((a, b) => days(a.followUpDate) - days(b.followUpDate));

  const Row = ({ r }: { r: FollowUpRow }) => {
    const d = days(r.followUpDate);
    return (
      <div className="flex flex-wrap items-center gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{props.nameOf(r.patientId)}</p>
          <p className="text-sm text-muted-foreground">
            {d < 0 ? <span className="font-medium text-destructive">Vencido há {-d} dia{-d > 1 ? 's' : ''}</span> : d === 0 ? 'Vence hoje' : `Vence em ${d} dia${d > 1 ? 's' : ''}`}
            {r.action ? ` · ${r.action}` : ''}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => props.onContact(r.patientId)}>Registrar contato</Button>
        <Button size="sm" onClick={() => props.onResolve(r.id)}>Resolver</Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Vencidos <Badge variant="destructive" className="ml-1">{overdue.length}</Badge></CardTitle></CardHeader>
        <CardContent className="divide-y p-0">
          {overdue.length ? overdue.map((r) => <Row key={r.id} r={r} />) : <p className="p-4 text-sm text-muted-foreground">Nenhum follow-up vencido.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Próximos 7 dias <Badge variant="secondary" className="ml-1">{upcoming.length}</Badge></CardTitle></CardHeader>
        <CardContent className="divide-y p-0">
          {upcoming.length ? upcoming.map((r) => <Row key={r.id} r={r} />) : <p className="p-4 text-sm text-muted-foreground">Nenhum follow-up nos próximos dias.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
