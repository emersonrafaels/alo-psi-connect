import { useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Activity, BookHeart, CalendarCheck, ClipboardList, Download, Info, Leaf, Mail, Repeat, Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useAcademicFilters, useUsageMetrics } from './useUsageMetrics';
import {
  FEATURE_LABELS, HEATMAP_DAYS, HEATMAP_SLOTS, deltaPct, featureRanking, funnelSteps, heatmapMatrix, pct, toCsv,
} from './usageMetrics';

const PERIODS = [7, 15, 30, 90];
const ALL = '__all__';

function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="Sobre esta métrica" className="text-muted-foreground hover:text-foreground">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">sem base anterior</span>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone = value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${tone}`}>
      <Icon className="h-3.5 w-3.5" />{value > 0 ? '+' : ''}{value}% vs. período anterior
    </span>
  );
}

function Kpi({ icon: Icon, label, value, sub, delta, hint }: {
  icon: typeof Users; label: string; value: ReactNode; sub?: ReactNode; delta?: number | null; hint: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">{label}<Hint text={hint} /></span>
          <span className="rounded-md bg-primary/10 p-1.5 text-primary"><Icon className="h-4 w-4" /></span>
        </div>
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        {delta !== undefined && <Delta value={delta} />}
      </CardContent>
    </Card>
  );
}

function Section({ title, description, children, hint }: { title: string; description?: string; children: ReactNode; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-base">{title}{hint && <Hint text={hint} />}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('pt-BR');

export function UsageMetricsPage({ institutionId }: { institutionId: string }) {
  const [days, setDays] = useState(30);
  const [unit, setUnit] = useState<string | null>(null);
  const [course, setCourse] = useState<string | null>(null);
  const { data, isLoading, isError } = useUsageMetrics(institutionId, days, unit, course);
  const { data: units = [] } = useAcademicFilters(institutionId);

  const unitOptions = units.filter((u) => u.level === 'unit');
  const courseOptions = units.filter((u) => u.level === 'course' && (!unit || u.parent_id === unit));

  const heat = useMemo(() => heatmapMatrix(data?.heatmap ?? []), [data]);
  const ranking = useMemo(() => featureRanking(data?.by_feature ?? {}, data?.total_students ?? 0), [data]);
  const weekly = useMemo(() => (data?.weekly ?? []).map((w) => ({
    ...w, label: new Date(w.week + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  })), [data]);

  const exportCsv = () => {
    if (!data) return;
    const blob = new Blob(['\ufeff' + toCsv(data)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `metricas-uso-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const k = data?.kpis;
  const total = data?.total_students ?? 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Período">
            {PERIODS.map((p) => (
              <button key={p} type="button" onClick={() => setDays(p)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${days === p ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {p} dias
              </button>
            ))}
          </div>
          {unitOptions.length > 0 && (
            <Select value={unit ?? ALL} onValueChange={(v) => { setUnit(v === ALL ? null : v); setCourse(null); }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as unidades</SelectItem>
                {unitOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {courseOptions.length > 0 && (
            <Select value={course ?? ALL} onValueChange={(v) => setCourse(v === ALL ? null : v)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Curso" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os cursos</SelectItem>
                {courseOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv} disabled={!data}>
            <Download className="mr-1.5 h-4 w-4" />Exportar CSV
          </Button>
        </div>

        {isError && <Empty text="Não foi possível carregar as métricas agora. Tente novamente em instantes." />}

        {/* Destaques */}
        {isLoading || !k ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Kpi icon={Users} label="Alunos ativos" value={fmt(k.active)} sub={`${pct(k.active, total) ?? 0}% de ${fmt(total)} vinculados`}
              delta={deltaPct(k.active, k.active_prev)} hint="Alunos que usaram qualquer recurso da plataforma no período." />
            <Kpi icon={Repeat} label="Ativos semanais / mensais" value={`${fmt(k.wau)} / ${fmt(k.mau)}`}
              sub={`Adesão recorrente: ${pct(k.wau, k.mau) ?? 0}%`} hint="Ativos nos últimos 7 dias dividido pelos ativos nos últimos 30 dias. Quanto mais alto, mais o uso vira hábito." />
            <Kpi icon={BookHeart} label="Registros no diário" value={fmt(k.diary)} delta={deltaPct(k.diary, k.diary_prev)} hint="Total de registros do diário emocional no período." />
            <Kpi icon={Leaf} label="Práticas concluídas" value={fmt(k.practices)} delta={deltaPct(k.practices, k.practices_prev)} hint="Práticas de regulação concluídas pelos alunos." />
            <Kpi icon={ClipboardList} label="Escalas respondidas" value={fmt(k.scales)} delta={deltaPct(k.scales, k.scales_prev)} hint="Respostas a WHO-5, PSS-10, GAD-7 e PHQ-9." />
            <Kpi icon={CalendarCheck} label="Agendamentos" value={fmt(k.appointments)}
              sub={data.appointments.total ? `${pct(data.appointments.done, data.appointments.total)}% confirmados ou realizados` : 'Nenhum agendamento no período'}
              delta={deltaPct(k.appointments, k.appointments_prev)} hint="Atendimentos agendados por alunos vinculados." />
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Uso por recurso" description="Alunos que usaram cada recurso no período" hint="Cada aluno é contado uma vez por recurso.">
                {ranking.every((r) => r.students === 0) ? <Empty text="Ainda sem uso no período." /> : (
                  <ul className="space-y-3">
                    {ranking.map((r) => (
                      <li key={r.key} className="space-y-1">
                        <div className="flex justify-between text-sm"><span>{r.label}</span><span className="tabular-nums text-muted-foreground">{fmt(r.students)} · {r.pct}%</span></div>
                        <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(r.pct, r.students ? 1 : 0)}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Funil de adesão" description="Do vínculo ao uso recorrente" hint="Percentuais sobre o total de alunos vinculados.">
                <ol className="space-y-2">
                  {funnelSteps(data.funnel).map((s, i) => (
                    <li key={s.label} className="relative overflow-hidden rounded-lg border p-3">
                      <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${s.pctOfLinked ?? 0}%` }} />
                      <div className="relative flex items-center justify-between text-sm">
                        <span><span className="mr-2 text-muted-foreground">{i + 1}.</span>{s.label}</span>
                        <span className="font-medium tabular-nums">{fmt(s.value)} <span className="text-muted-foreground">({s.pctOfLinked ?? 0}%)</span></span>
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Section title="Alunos ativos por semana" description="Últimas 12 semanas">
                  {weekly.length === 0 ? <Empty text="Sem atividade nas últimas semanas." /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={weekly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                        <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                        <RTooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Area type="monotone" dataKey="active" name="Alunos ativos" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Section>
              </div>
              <Section title="Retenção" description="Alunos que voltam depois de uma semana ativa" hint="Média semanal das últimas 12 semanas: de quem esteve ativo numa semana, quantos voltaram 1, 2 e 4 semanas depois.">
                <div className="space-y-4">
                  {([['w1', '1 semana depois'], ['w2', '2 semanas depois'], ['w4', '4 semanas depois']] as const).map(([key, label]) => {
                    const v = data.retention[key];
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm"><span>{label}</span><span className="font-medium tabular-nums">{v == null ? '—' : `${v}%`}</span></div>
                        <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${v ?? 0}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </div>

            <Section title="Quando os alunos usam a plataforma" description="Atividades por dia da semana e horário (Brasília) — útil para escolher horários de encontros e mensagens">
              {heat.max === 0 ? <Empty text="Sem atividade no período." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-separate border-spacing-1 text-xs">
                    <thead><tr><th />{HEATMAP_SLOTS.map((s) => <th key={s} className="font-normal text-muted-foreground">{s}</th>)}</tr></thead>
                    <tbody>
                      {HEATMAP_DAYS.map((d, di) => (
                        <tr key={d}>
                          <td className="pr-2 text-muted-foreground">{d}</td>
                          {heat.matrix[di].map((n, si) => (
                            <td key={si} title={`${d}, ${HEATMAP_SLOTS[si]}: ${fmt(n)} atividades`}
                              className="h-9 rounded-md text-center tabular-nums"
                              style={{ background: n ? `hsl(var(--primary) / ${0.08 + 0.85 * (n / heat.max)})` : 'hsl(var(--muted))' }}>
                              <span className={n / heat.max > 0.55 ? 'text-primary-foreground' : 'text-foreground'}>{n ? fmt(n) : ''}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Adesão por curso e unidade" description={`% de alunos ativos no período${data.hidden_courses ? ` · ${data.hidden_courses} grupo(s) com menos de 10 alunos ocultado(s) por privacidade` : ''}`}>
              {data.courses.length === 0 ? <Empty text="Nenhum curso com 10 ou mais alunos vinculados à estrutura acadêmica." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr><th className="py-2">Curso</th><th>Unidade</th><th className="text-right">Alunos</th><th className="text-right">Ativos</th><th className="text-right">Tendência</th><th className="pl-4">Recurso mais usado</th></tr>
                    </thead>
                    <tbody>
                      {data.courses.map((c) => {
                        const diff = c.active_pct - c.prev_pct;
                        return (
                          <tr key={`${c.unit}-${c.course}`} className="border-t">
                            <td className="py-2 font-medium">{c.course}</td>
                            <td className="text-muted-foreground">{c.unit ?? '—'}</td>
                            <td className="text-right tabular-nums">{fmt(c.students)}</td>
                            <td className="text-right tabular-nums">{c.active_pct}%</td>
                            <td className={`text-right tabular-nums ${diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{diff > 0 ? '+' : ''}{diff} p.p.</td>
                            <td className="pl-4 text-muted-foreground">{c.top_feature ? FEATURE_LABELS[c.top_feature] : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi icon={Activity} label="Inscrições em encontros" value={fmt(data.encounters.registrations)}
                sub={data.encounters.registrations ? `${pct(data.encounters.attended, data.encounters.registrations)}% com presença registrada` : 'Sem inscrições no período'} hint="Inscrições de alunos vinculados em workshops e rodas de conversa." />
              <Kpi icon={Mail} label="Mensagens enviadas" value={fmt(data.messages.sent)}
                sub={data.messages.sent ? `${pct(data.messages.read, data.messages.sent)}% lidas · ${pct(data.messages.replied, data.messages.sent)}% respondidas` : 'Nenhuma mensagem no período'} hint="Conversas abertas pela instituição com alunos." />
              <Kpi icon={CalendarCheck} label="Cancelamentos" value={data.appointments.total ? `${pct(data.appointments.cancelled, data.appointments.total)}%` : '—'}
                sub={`${fmt(data.appointments.cancelled)} de ${fmt(data.appointments.total)} agendamentos`} hint="Agendamentos cancelados no período." />
              <Kpi icon={CalendarCheck} label="Antecedência média" value={data.appointments.avg_lead_days == null ? '—' : `${data.appointments.avg_lead_days} dias`}
                sub="Entre agendar e ser atendido" hint="Tempo médio entre o pedido de agendamento e a data da consulta." />
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">Todos os números são agregados. Nenhum aluno individual ou texto de diário é exibido.</p>
      </div>
    </TooltipProvider>
  );
}
