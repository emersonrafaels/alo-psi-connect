import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingBar, LoadingSection, LoadingCards } from "@/components/ui/loading-bar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentActivityData, MoodEntry, TopEmotion, StudentTriageHistory } from '@/hooks/useStudentActivityData';
import { RiskLevel } from '@/hooks/useStudentTriage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Brain, Zap, Moon, BookOpen, ClipboardCheck, Heart, AlertTriangle, CheckCircle2, Play, Clock, Sparkles, Maximize2 } from 'lucide-react';
import { useMoodEntryAnalyses, RISK_LEVEL_META } from '@/hooks/useMoodEntryAnalyses';
import { getEmotionDisplayName } from '@/utils/emotionFormatters';
import { reconcileRisk, EntryRisk } from '@/features/triage/entryRisk';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, ClipboardList } from 'lucide-react';

interface TimelineItem { id: string; kind: string; occurred_at: string; title: string; detail: string | null; level: string | null }
const LEVEL_LABEL: Record<string, string> = { healthy: 'Estável', attention: 'Atenção', alert: 'Alerta', critical: 'Em Risco' };

function ActivityListTab({ items, kind, empty }: { items: TimelineItem[]; kind: 'practice' | 'scale'; empty: string }) {
  const list = items.filter((i) => i.kind === kind);
  const Icon = kind === 'practice' ? Leaf : ClipboardList;
  if (list.length === 0) {
    return <div className="py-8 text-center text-muted-foreground text-sm"><Icon className="h-8 w-8 mx-auto mb-2 opacity-40" />{empty}</div>;
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">Últimos 90 dias · {list.length} {list.length === 1 ? 'registro' : 'registros'}. Apenas datas e indicadores.</p>
      {list.map((i) => (
        <div key={i.id} className="p-3 rounded-lg border bg-muted/20 flex items-start justify-between gap-2">
          <div className="flex gap-2 min-w-0">
            <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{i.title}</p>
              {i.detail && <p className="text-[11px] text-muted-foreground">{i.detail}</p>}
              <p className="text-[11px] text-muted-foreground">{format(new Date(i.occurred_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>
          {i.level && <Badge variant="outline" className="text-[10px] shrink-0">{LEVEL_LABEL[i.level] ?? i.level}</Badge>}
        </div>
      ))}
    </div>
  );
}

/** Internal markers on synthetic/demo entries (e.g. `demo_sintetico`) are not meaningful to the team. */
const isInternalTag = (tag: string) => /^demo[_-]?/i.test(tag.trim());

interface StudentActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  profileId: string | null;
  patientId: string | null;
  institutionId: string;
  riskLevel: RiskLevel;
  entryCount: number;
  /** Period the triage `entryCount` was computed over. */
  periodDays: number;
}

const riskColors: Record<RiskLevel, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  alert: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  attention: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  no_data: 'bg-muted text-muted-foreground',
};

const riskLabels: Record<RiskLevel, string> = {
  critical: 'Em Risco',
  alert: 'Alerta',
  attention: 'Atenção',
  healthy: 'Estável',
  no_data: 'Sem Dados',
};

const priorityLabels: Record<string, string> = {
  urgent: '🔴 Urgente',
  high: '🟠 Alta',
  medium: '🟡 Média',
  low: '🟢 Baixa',
};

const actionLabels: Record<string, string> = {
  refer_professional: 'Encaminhar para profissional',
  schedule_talk: 'Agendar conversa',
  monitor: 'Monitorar',
  contact_family: 'Contato com família',
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  triaged: { label: 'Triado', icon: ClipboardCheck, color: 'text-blue-600' },
  in_progress: { label: 'Em andamento', icon: Play, color: 'text-yellow-600' },
  resolved: { label: 'Resolvido', icon: CheckCircle2, color: 'text-green-600' },
};

function MoodScoreDisplay({ value, label, icon: Icon, higherIsWorse }: { value: number | null; label: string; icon: typeof Activity; higherIsWorse?: boolean }) {
  if (value === null) return null;
  const score = higherIsWorse ? 6 - value : value;
  const color = score <= 2 ? 'text-red-500' : score <= 3 ? 'text-yellow-500' : 'text-green-500';
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${color}`}>{value.toFixed(1)}</span>
    </div>
  );
}

/** Fixed 1–5 scale trend; the reader picks which sentiments to plot, one or several at once. */
type TrendSeries = { key: string; label: string; getValue: (e: MoodEntry) => number | null };

export function MoodTrendChart({ entries }: { entries: MoodEntry[] }) {
  const seriesOptions: TrendSeries[] = [
    { key: 'mood_score', label: 'Humor', getValue: (e) => e.mood_score },
    { key: 'anxiety_level', label: 'Ansiedade', getValue: (e) => e.anxiety_level },
    { key: 'energy_level', label: 'Energia', getValue: (e) => e.energy_level },
    { key: 'sleep_quality', label: 'Sono', getValue: (e) => e.sleep_quality },
  ];
  const emotionKeys = new Set<string>();
  entries.forEach((e) => {
    if (e.emotion_values) Object.keys(e.emotion_values).forEach((k) => emotionKeys.add(k));
  });
  Array.from(emotionKeys).forEach((k) =>
    seriesOptions.push({ key: `emo:${k}`, label: getEmotionDisplayName(k), getValue: (e) => e.emotion_values?.[k] ?? null }),
  );

  const [selected, setSelected] = useState<string[]>(['mood_score']);
  const [maximized, setMaximized] = useState(false);
  // At least one sentiment stays on the chart: the last active one cannot be turned off.
  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]));

  if (entries.length < 2) return null;
  const active = seriesOptions.filter((s) => selected.includes(s.key));

  const dates = entries.map((e) => e.date).reverse(); // ascending
  const n = dates.length;
  const colorOf = (key: string) => `hsl(var(--chart-${(seriesOptions.findIndex((s) => s.key === key) % 5) + 1}))`;

  // One line per selected sentiment, plotted on the shared ascending date axis.
  const seriesData = active.map((s) => {
    const values = entries.map((e) => s.getValue(e)).reverse();
    const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
    const vals = pts.map((p) => p.v);
    return {
      ...s,
      pts,
      avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      last: vals.length ? vals[vals.length - 1] : null,
    };
  });

  // X-axis date markers: first, last and evenly spaced in between (deduped by label).
  const tickCount = Math.min(6, n);
  const tickIndexes: number[] = [];
  const seenDates = new Set<string>();
  for (let k = 0; k < tickCount; k++) {
    const i = Math.round((k * (n - 1)) / Math.max(1, tickCount - 1));
    const label = format(new Date(dates[i] + 'T12:00:00'), 'dd/MM');
    if (!seenDates.has(label)) {
      seenDates.add(label);
      tickIndexes.push(i);
    }
  }

  const renderControls = () => (
    <>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {seriesData.filter((s) => s.avg != null).map((s) => (
            <p key={s.key} className="text-xs text-muted-foreground">
              {s.label} · média{' '}
              <span className="font-semibold tabular-nums" style={{ color: colorOf(s.key) }}>{s.avg?.toFixed(1)}</span>
              {' · '}último{' '}
              <span className="font-semibold tabular-nums" style={{ color: colorOf(s.key) }}>{s.last?.toFixed(1)}</span>
            </p>
          ))}
        </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {seriesOptions.map((s) => {
          const on = selected.includes(s.key);
          return (
            <Button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={on}
              variant="outline"
              size="sm"
              title={on ? 'Ocultar do gráfico' : 'Mostrar no gráfico'}
              className={`inline-flex h-auto items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                on ? 'border-transparent font-medium' : 'border-border text-muted-foreground hover:bg-muted/60'
              }`}
              style={on ? { backgroundColor: `hsl(var(--chart-${(seriesOptions.findIndex((o) => o.key === s.key) % 5) + 1}) / 0.15)` } : undefined}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: colorOf(s.key), opacity: on ? 1 : 0.4 }}
              />
              {s.label}
            </Button>
          );
        })}
      </div>
    </>
  );

  const renderChart = (expanded: boolean) => {
    const w = expanded ? Math.max(900, n * 64) : 560;
    const top = expanded ? 30 + active.length * 22 : 8;
    const h = expanded ? 380 + top : 104;
    const left = expanded ? 48 : 22, right = expanded ? 32 : 8, bottom = expanded ? 44 : 18;
    const x = (i: number) => left + (i * (w - left - right)) / (n - 1);
    const y = (v: number) => top + ((5 - v) / 4) * (h - top - bottom);
    const labelPositions = new Map<number, number[]>();
    return (
      <div className="overflow-x-auto rounded-lg border-border" tabIndex={expanded ? 0 : undefined} aria-label={expanded ? 'Graphique des sentiments' : undefined}>
      <svg viewBox={`0 0 ${w} ${h}`} style={expanded ? { minWidth: w } : undefined} className="h-auto w-full" role="img" aria-label={`Evolução de ${active.map((s) => s.label).join(', ')} nos últimos 30 dias, numa escala de 1 a 5`}>
        {(expanded ? [1, 2, 3, 4, 5] : [1, 3, 5]).map((v) => (
          <g key={v}>
            <line x1={left} x2={w - right} y1={y(v)} y2={y(v)} className="stroke-border" strokeDasharray={v === 3 ? '3 4' : undefined} />
            <text x={left - 6} y={y(v)} dy="0.35em" textAnchor="end" className="fill-muted-foreground text-[10px]">{v}</text>
          </g>
        ))}
        {seriesData.filter((s) => s.pts.length >= 2).map((s) => (
          <polyline
            key={s.key}
            points={s.pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
            fill="none" stroke={colorOf(s.key)} strokeOpacity={0.75} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"
          />
        ))}
        {seriesData.map((s) =>
          s.pts.map((p) => (
            <circle key={`${s.key}-${p.i}`} cx={x(p.i)} cy={y(p.v)} r={expanded ? 4 : 3} fill={colorOf(s.key)} className="stroke-background" strokeWidth={1.5}>
              <title>{s.label}: {format(new Date(dates[p.i] + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })} — {p.v.toFixed(1)}</title>
            </circle>
          )),
        )}
        {expanded && seriesData.flatMap((s) => s.pts.map((p) => {
          const used = labelPositions.get(p.i) ?? [];
          let labelY = y(p.v) - 16;
          while (used.some((previous) => Math.abs(previous - labelY) < 22)) labelY -= 22;
          labelPositions.set(p.i, [...used, labelY]);
          return (
            <g key={`label-${s.key}-${p.i}`}>
              <line x1={x(p.i)} x2={x(p.i)} y1={y(p.v) - 5} y2={labelY + 9} stroke={colorOf(s.key)} strokeOpacity={0.3} />
              <rect x={x(p.i) - 20} y={labelY - 10} width={40} height={20} rx={4} className="fill-background" stroke={colorOf(s.key)} strokeOpacity={0.35} />
              <text x={x(p.i)} y={labelY} dy="0.35em" textAnchor="middle" fill={colorOf(s.key)} className="text-[12px] font-semibold">
                {p.v.toFixed(1).replace('.', ',')}
              </text>
            </g>
          );
        }))}
        {(expanded ? Array.from({ length: n }, (_, i) => i) : tickIndexes).map((i) => (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={h - bottom} y2={h - bottom + 3} className="stroke-border" />
            <text
              x={x(i)}
              y={h - (expanded ? 18 : 4)}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              className={`fill-muted-foreground ${expanded ? 'text-[12px]' : 'text-[10px]'}`}
            >
              {format(new Date(dates[i] + 'T12:00:00'), 'dd/MM')}
            </text>
          </g>
        ))}
      </svg>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Evolução dos sentimentos (30 dias)</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Maximizar gráfico" onClick={() => setMaximized(true)} className="h-8 w-8 shrink-0">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Maximizar gráfico</TooltipContent>
        </Tooltip>
      </div>
      {renderControls()}
      {renderChart(false)}
      <Dialog open={maximized} onOpenChange={setMaximized}>
        <DialogContent className="flex max-h-[95dvh] w-[96vw] max-w-[1440px] flex-col overflow-hidden">
          <DialogHeader className="pr-8">
            <DialogTitle>Evolução dos sentimentos (30 dias)</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto">
            {renderControls()}
            {renderChart(true)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmotionDiaryTab({ entries, topEmotions, lastTriageDate }: { entries: MoodEntry[]; topEmotions: TopEmotion[]; lastTriageDate?: string }) {
  const { data: analysesMap } = useMoodEntryAnalyses(entries.map(e => e.id), entries.length > 0);

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
        Nenhum registro emocional nos últimos 30 dias.
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Top Emotions */}
      {topEmotions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Sentimentos predominantes</p>
          <p className="text-[11px] text-muted-foreground mb-2">
            Média das notas que o aluno deu a cada sentimento nos últimos 30 dias (1 = muito baixo, 5 = muito alto).
          </p>
          <div className="flex flex-wrap gap-2">
            {topEmotions.map(e => (
              <Badge key={e.emotion} variant="secondary" className="text-xs">
                {getEmotionDisplayName(e.emotion)} · média {e.average.toFixed(1).replace('.', ',')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <MoodTrendChart entries={entries} />

      {/* Before vs After Triage Comparison */}
      {lastTriageDate && entries.length >= 2 && (() => {
        const triageDate = lastTriageDate.split('T')[0];
        const before = entries.filter(e => e.date < triageDate);
        const after = entries.filter(e => e.date >= triageDate);
        if (before.length === 0 || after.length === 0) return null;

        const calcAvg = (arr: MoodEntry[], field: 'mood_score' | 'anxiety_level') => {
          const valid = arr.filter(e => e[field] != null);
          return valid.length > 0 ? valid.reduce((s, e) => s + (e[field] as number), 0) / valid.length : null;
        };

        const moodBefore = calcAvg(before, 'mood_score');
        const moodAfter = calcAvg(after, 'mood_score');
        const anxBefore = calcAvg(before, 'anxiety_level');
        const anxAfter = calcAvg(after, 'anxiety_level');

        return (
          <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Antes vs Depois da Última Triagem
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Antes ({before.length} reg.)</p>
                {moodBefore != null && <p>😊 Humor: <span className="font-semibold">{moodBefore.toFixed(1)}</span></p>}
                {anxBefore != null && <p>😰 Ansiedade: <span className="font-semibold">{anxBefore.toFixed(1)}</span></p>}
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Depois ({after.length} reg.)</p>
                {moodAfter != null && (
                  <p>😊 Humor: <span className={`font-semibold ${moodBefore != null && moodAfter > moodBefore ? 'text-green-600' : moodBefore != null && moodAfter < moodBefore ? 'text-red-500' : ''}`}>
                    {moodAfter.toFixed(1)}
                    {moodBefore != null && <span className="ml-1">{moodAfter > moodBefore ? '↑' : moodAfter < moodBefore ? '↓' : '='}</span>}
                  </span></p>
                )}
                {anxAfter != null && (
                  <p>😰 Ansiedade: <span className={`font-semibold ${anxBefore != null && anxAfter < anxBefore ? 'text-green-600' : anxBefore != null && anxAfter > anxBefore ? 'text-red-500' : ''}`}>
                    {anxAfter.toFixed(1)}
                    {anxBefore != null && <span className="ml-1">{anxAfter < anxBefore ? '↓' : anxAfter > anxBefore ? '↑' : '='}</span>}
                  </span></p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Entries list */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Registros recentes</p>
        <div className="space-y-2">
          {entries.slice(0, 14).map(entry => {
            const analysis = analysesMap?.get(entry.id);
            const level = reconcileRisk(analysis?.risk_level as EntryRisk | undefined, entry.mood_score, entry.anxiety_level);
            const meta = analysis && level ? RISK_LEVEL_META[level] : null;
            const buddyMsg = analysis?.buddy_message && !/^\s*\[DEMO-/i.test(analysis.buddy_message) ? analysis.buddy_message : null;
            return (
            <div key={entry.id} className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{format(new Date(entry.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span>
                {meta && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${meta.badgeClass}`}>
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    IA: {meta.label}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <MoodScoreDisplay value={entry.mood_score} label="Humor" icon={Activity} />
                <MoodScoreDisplay value={entry.anxiety_level} label="Ansiedade" icon={Brain} higherIsWorse />
                <MoodScoreDisplay value={entry.energy_level} label="Energia" icon={Zap} />
                <MoodScoreDisplay value={entry.sleep_quality} label="Sono" icon={Moon} />
              </div>
              {entry.tags && entry.tags.some((tag) => !isInternalTag(tag)) && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.filter((tag) => !isInternalTag(tag)).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                  ))}
                </div>
              )}
              {entry.journal_text && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">"{entry.journal_text}"</p>
              )}
              {buddyMsg && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2 mt-1">
                  <Sparkles className="h-2.5 w-2.5 inline mr-1" />{buddyMsg}
                </p>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TriageHistoryTab({ history }: { history: StudentTriageHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
        Nenhuma triagem registrada para este aluno.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((t, idx) => {
        const config = statusConfig[t.status] || statusConfig.triaged;
        const StatusIcon = config.icon;

        return (
          <div key={t.id} className="relative">
            {/* Timeline connector */}
            {idx < history.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
            )}
            <div className="flex gap-3">
              <div className={`mt-1 shrink-0 ${config.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 p-3 rounded-lg border bg-muted/20 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-xs">{priorityLabels[t.priority] || t.priority}</Badge>
                  <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(t.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {t.recommended_action && (
                  <p className="text-xs"><span className="text-muted-foreground">Ação:</span> {actionLabels[t.recommended_action] || t.recommended_action}</p>
                )}
                {t.notes && <p className="text-xs text-muted-foreground italic">"{t.notes}"</p>}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {t.triaged_by_name && <span>por {t.triaged_by_name}</span>}
                  {t.follow_up_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Acompanhamento: {format(new Date(t.follow_up_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                  {t.resolved_at && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Resolvido em {format(new Date(t.resolved_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StudentActivityModal({
  open,
  onOpenChange,
  studentName,
  profileId,
  patientId,
  institutionId,
  riskLevel,
  entryCount,
  periodDays,
}: StudentActivityModalProps) {
  const { data, isLoading } = useStudentActivityData(profileId, patientId, institutionId, open);
  const { data: timeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['student-timeline', institutionId, patientId],
    enabled: open && !!institutionId && !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_institution_student_timeline', {
        _institution_id: institutionId, _patient_id: patientId, _days: 90,
      });
      if (error) throw error;
      return (data ?? []) as TimelineItem[];
    },
  });

  // Anonymized names are "Aluno #N"; show "AN" like the rest of the portal instead of the "A#" initials.
  const anonNumber = studentName.match(/#(\d+)/)?.[1];
  const initials = anonNumber ? `A${anonNumber}` : studentName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`text-sm font-semibold ${riskColors[riskLevel]}`}>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{studentName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${riskColors[riskLevel]}`}>{riskLabels[riskLevel]}</Badge>
                <span className="text-xs text-muted-foreground">Últimos {periodDays} dias</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="diario" className="flex-1 min-h-0">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="diario" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Diário Emocional
            </TabsTrigger>
            <TabsTrigger value="triagens" className="gap-1.5 text-xs">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Histórico de Triagens
            </TabsTrigger>
            <TabsTrigger value="praticas" className="gap-1.5 text-xs">
              <Leaf className="h-3.5 w-3.5" />
              Práticas
            </TabsTrigger>
            <TabsTrigger value="escalas" className="gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />
              Escalas
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            {isLoading ? (
              <LoadingBar className="py-8" label="Carregando atividades..." />
            ) : (
              <>
                <TabsContent value="diario" className="mt-0">
                  <EmotionDiaryTab entries={data?.moodEntries || []} topEmotions={data?.topEmotions || []} lastTriageDate={data?.triageHistory?.[0]?.created_at} />
                </TabsContent>
                <TabsContent value="triagens" className="mt-0">
                  <TriageHistoryTab history={data?.triageHistory || []} />
                </TabsContent>
                <TabsContent value="praticas" className="mt-0">
                  {timelineLoading ? <LoadingBar className="py-8" label="Carregando práticas..." /> : <ActivityListTab items={timeline} kind="practice" empty="Nenhuma prática nos últimos 90 dias." />}
                </TabsContent>
                <TabsContent value="escalas" className="mt-0">
                  {timelineLoading ? <LoadingBar className="py-8" label="Carregando escalas..." /> : <ActivityListTab items={timeline} kind="scale" empty="Nenhuma escala respondida nos últimos 90 dias." />}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
