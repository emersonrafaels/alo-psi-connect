import { useState, type ReactNode } from 'react';
import { CARE_LABELS, careStatus, TEXT_SIGNAL_LABEL, triageActionLabel } from '@/features/triage/signalRules';
import { Activity, AlertTriangle, BookOpen, Brain, CheckCircle2, ChevronDown, History, MessageSquare, Moon, Search, SearchX, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { QuickNotePopover, type QuickNoteHistoryItem } from '@/components/institution/QuickNotePopover';
import type { RiskLevel, StudentRiskData } from '@/hooks/useStudentTriage';
import {
  HIGHER_IS_WORSE, METRIC_KEYS, METRIC_LABEL, PENDING_SORT_LABEL, metricBand, metricValue, riskDrivers, riskReasons,
  type Band, type MetricKey, type PendingSort,
} from './indicators';

export type ClassAverages = Record<MetricKey, number | null>;

const RISK_META: Record<RiskLevel, { label: string; dot: string; border: string; badge: string }> = {
  critical: { label: 'Sinal elevado', dot: 'bg-red-500', border: 'border-l-red-500', badge: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900' },
  alert: { label: 'Alerta', dot: 'bg-orange-500', border: 'border-l-orange-500', badge: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900' },
  attention: { label: 'Atenção', dot: 'bg-yellow-500', border: 'border-l-yellow-500', badge: 'bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:ring-yellow-900' },
  healthy: { label: 'Sem sinais prioritários', dot: 'bg-green-500', border: 'border-l-green-500', badge: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900' },
  no_data: { label: 'Dados insuficientes', dot: 'bg-muted-foreground/40', border: 'border-l-muted-foreground/30', badge: 'bg-muted text-muted-foreground ring-border' },
};

const BAND_TEXT: Record<Band, string> = {
  critical: 'text-red-600 dark:text-red-400',
  alert: 'text-orange-600 dark:text-orange-400',
  attention: 'text-yellow-700 dark:text-yellow-400',
  healthy: 'text-foreground',
};
const BAND_FILL: Record<Band, string> = {
  critical: 'bg-red-500', alert: 'bg-orange-500', attention: 'bg-yellow-500', healthy: 'bg-green-500',
};
const BAND_HEX: Record<Band, string> = {
  critical: '#ef4444', alert: '#f97316', attention: '#eab308', healthy: '#22c55e',
};

const METRIC_ICON: Record<MetricKey, typeof Activity> = { mood: Activity, anxiety: Brain, energy: Zap, sleep: Moon };
const METRIC_HINT: Record<MetricKey, string> = {
  mood: '1 = muito mal, 5 = muito bem',
  anxiety: '1 = tranquilo, 5 = muito ansioso',
  energy: '1 = sem energia, 5 = muita energia',
  sleep: '1 = péssimo, 5 = ótimo',
};

type TrendMetric = 'score' | MetricKey;
const TREND_LABEL: Record<TrendMetric, string> = { score: 'Bem-estar geral', ...METRIC_LABEL };
const TREND_HISTORY: Record<TrendMetric, keyof StudentRiskData> = {
  score: 'scoreHistory', mood: 'moodHistory', anxiety: 'anxietyHistory', energy: 'energyHistory', sleep: 'sleepHistory',
};

/**
 * Desktop grid: select · aluno · 4 indicadores · evolução · ações.
 * Header and rows are separate grids, so every track must have a content-independent width
 * (no `auto`) or the columns drift apart.
 */
const GRID = 'lg:grid-cols-[16px_minmax(220px,1.6fr)_repeat(4,minmax(76px,1fr))_96px_148px]';

interface PendingQueueProps {
  students: StudentRiskData[];
  visibleCount: number;
  pendingByRisk: Record<RiskLevel, number>;
  search: string;
  onSearchChange: (term: string) => void;
  sort: PendingSort;
  onSortChange: (sort: PendingSort) => void;
  periodDays: number;
  classAverages: ClassAverages;
  nameOf: (patientId: string) => string;
  selectedIds: Set<string>;
  onToggleSelect: (patientId: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onBatchTriage: () => void;
  onTriage: (student: StudentRiskData) => void;
  onOpenHistory: (student: StudentRiskData) => void;
  onQuickNote: (student: StudentRiskData, note: string) => Promise<void>;
  /** Internal team notes per student; they never move the student out of the queue. */
  noteCountOf: (patientId: string) => number;
  notesOf?: (patientId: string) => QuickNoteHistoryItem[];
  onOpenNotes: (student: StudentRiskData) => void;
  footer?: ReactNode;
}

export function PendingQueue(props: PendingQueueProps) {
  const { students, visibleCount, pendingByRisk, search, sort, periodDays, selectedIds } = props;
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('score');
  const totalPending = pendingByRisk.critical;
  const allSelected = students.length > 0 && selectedIds.size === students.length;
  const filtered = search.trim() !== '';

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header + controls */}
      <div className="space-y-4 border-b px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Alunos aguardando triagem</h3>
          <p className="text-sm text-muted-foreground">
            {students.length} {students.length === 1 ? 'aluno' : 'alunos'}
            {' '}· nível <span className="font-medium text-foreground">Sinal elevado</span>
            {' '}· ordenados por <span className="lowercase">{PENDING_SORT_LABEL[sort]}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive-foreground" />Sinal elevado {totalPending}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número (ex.: 52)"
              value={search}
              onChange={(e) => props.onSearchChange(e.target.value)}
              className="h-9 pl-8 pr-8"
              aria-label="Buscar aluno"
            />
            {search && (
              <button type="button" onClick={() => props.onSearchChange('')} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={sort} onValueChange={(v) => props.onSortChange(v as PendingSort)}>
            <SelectTrigger className="h-9 w-[180px]" aria-label="Ordenar">
              <span className="text-muted-foreground">Ordenar:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PENDING_SORT_LABEL) as PendingSort[]).map((k) => <SelectItem key={k} value={k}>{PENDING_SORT_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
            <span className="inline-block h-3 w-0.5 rounded-full bg-foreground/60" /> média da turma · valores coloridos estão fora da faixa saudável
          </span>
        </div>
      </div>

      {students.length > 0 && (
        <>
          {/* Column header (desktop) */}
          <div className={`sticky top-14 z-[5] hidden items-center gap-x-5 border-b border-l-4 border-l-transparent bg-card/95 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur lg:grid ${GRID}`}>
            <Checkbox
              checked={allSelected ? true : selectedIds.size > 0 ? 'indeterminate' : false}
              onCheckedChange={props.onToggleSelectAll}
              aria-label="Selecionar todos"
            />
            <span>Aluno · motivo</span>
            {METRIC_KEYS.map((k) => (
              <Tooltip key={k}>
                <TooltipTrigger asChild><span className="cursor-help">{METRIC_LABEL[k]}</span></TooltipTrigger>
                <TooltipContent className="text-xs">Média em {periodDays} dias · {METRIC_HINT[k]}</TooltipContent>
              </Tooltip>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="inline-flex items-center gap-0.5 uppercase tracking-wider hover:text-foreground">
                  Evolução <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(TREND_LABEL) as TrendMetric[]).map((k) => (
                  <DropdownMenuItem key={k} onClick={() => setTrendMetric(k)} className={trendMetric === k ? 'bg-accent' : ''}>
                    <span className="text-xs">{TREND_LABEL[k]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-right">Ações</span>
          </div>
          {/* Select all (mobile) */}
          <label className="flex items-center gap-2 border-b px-5 py-2 text-xs text-muted-foreground lg:hidden">
            <Checkbox checked={allSelected ? true : selectedIds.size > 0 ? 'indeterminate' : false} onCheckedChange={props.onToggleSelectAll} />
            Selecionar todos ({students.length})
          </label>

          <ul className="divide-y">
            {students.slice(0, visibleCount).map((student) => (
              <PendingRow
                key={student.patientId}
                student={student}
                name={props.nameOf(student.patientId)}
                periodDays={periodDays}
                classAverages={props.classAverages}
                trendMetric={trendMetric}
                selected={selectedIds.has(student.patientId)}
                onToggleSelect={() => props.onToggleSelect(student.patientId)}
                onTriage={() => props.onTriage(student)}
                onOpenHistory={() => props.onOpenHistory(student)}
                onQuickNote={(note) => props.onQuickNote(student, note)}
                noteCount={props.noteCountOf(student.patientId)}
                notes={props.notesOf?.(student.patientId) ?? []}
                onOpenNotes={() => props.onOpenNotes(student)}
              />
            ))}
          </ul>
          {props.footer}
        </>
      )}

      {students.length === 0 && (
        filtered && totalPending > 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? <>Nenhum aluno encontrado para “{search}”.</>
                : <>Nenhum aluno com sinal elevado aguardando triagem.</>}
            </p>
            <Button variant="outline" size="sm" onClick={() => props.onSearchChange('')}>
              Ver todos os {totalPending} pendentes
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-green-500/70" />
            Nenhum aluno com sinal elevado aguardando triagem.
          </div>
        )
      )}

      {/* Floating bulk-action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-10 flex justify-center px-4 pb-4">
          <div className="flex items-center gap-3 rounded-full border bg-background/95 py-1.5 pl-4 pr-1.5 shadow-lg backdrop-blur">
            <span className="text-sm font-medium tabular-nums">
              {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" className="h-8" onClick={props.onClearSelection}>Limpar</Button>
            <Button size="sm" className="h-8 rounded-full" onClick={props.onBatchTriage}>Triar selecionados</Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PendingRowProps {
  student: StudentRiskData;
  name: string;
  periodDays: number;
  classAverages: ClassAverages;
  trendMetric: TrendMetric;
  selected: boolean;
  onToggleSelect: () => void;
  onTriage: () => void;
  onOpenHistory: () => void;
  onQuickNote: (note: string) => Promise<void>;
  noteCount: number;
  notes: QuickNoteHistoryItem[];
  onOpenNotes: () => void;
}

function PendingRow({ student, name, periodDays, classAverages, trendMetric, selected, onToggleSelect, onTriage, onOpenHistory, onQuickNote, noteCount, notes, onOpenNotes }: PendingRowProps) {
  const meta = RISK_META[student.riskLevel];
  const reasons = riskReasons(student);
  const driverKeys = new Set(riskDrivers(student).filter((d) => d.band !== 'attention').map((d) => d.key));
  const flag = student.criticalKeywordFlag;

  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-3 border-l-4 px-5 py-4 transition-colors ${meta.border} ${GRID} lg:items-center lg:gap-x-5 ${selected ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
    >
      <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label={`Selecionar ${name}`} className="mt-1 lg:mt-0" />

      {/* Identity + why */}
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button type="button" onClick={onOpenHistory} className="truncate text-left text-base font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            {name}
          </button>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${meta.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
          </span>
          {flag && (
            <Badge
              variant={flag.severity === 'grave' ? 'destructive' : 'secondary'}
              className="gap-1 text-[11px]"
              title={`Sinal separado das notas; não é diagnóstico. ${flag.hits} registro(s) com termos sensíveis · último em ${new Date(flag.lastDate + 'T12:00:00').toLocaleDateString('pt-BR')}. O texto do aluno não é exibido.`}
            >
              <AlertTriangle className="h-3 w-3" />{TEXT_SIGNAL_LABEL}
            </Badge>
          )}
          <Badge variant="outline" className="text-[11px] font-normal">{CARE_LABELS[careStatus(student.lastTriageStatus)]}</Badge>
          {student.lastTriageStatus === 'pending' && student.riskLevel !== 'critical' && (
            <Badge variant="outline" className="text-[11px] font-normal">Pendência anterior ao período</Badge>
          )}
        </div>
        {reasons.length > 0 && <p className="text-xs text-foreground/80">{reasons.join(' · ')}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <DiaryEngagement entries={student.entryCount} periodDays={periodDays} />
          {student.lastEntryDate && (
            <span className="text-[11px] text-muted-foreground">
              {student.validCount ?? student.entryCount} registro(s) válido(s) · último em {new Date(student.lastEntryDate + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          )}
          {noteCount > 0 && (
            <button type="button" onClick={onOpenNotes} className="inline-flex items-center gap-1 rounded-sm text-[11px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MessageSquare className="h-3 w-3" />
              {noteCount} {noteCount === 1 ? 'nota da equipe' : 'notas da equipe'}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-start justify-end gap-1 lg:order-last lg:items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onOpenHistory} aria-label="Ver histórico">
              <History className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Ver histórico</TooltipContent>
        </Tooltip>
        <QuickNotePopover riskLevel={student.riskLevel} subjectName={name} reasons={reasons} onSave={onQuickNote} history={notes} />
        <Button size="sm" className="h-8 px-4" onClick={onTriage}>{triageActionLabel(student.lastTriageId)}</Button>
      </div>

      {/* Indicators: own row on mobile, grid cells on desktop */}
      <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:contents">
        {METRIC_KEYS.map((key) => (
          <MetricCell
            key={key}
            metric={key}
            value={metricValue(student, key)}
            classAvg={classAverages[key]}
            emphasize={driverKeys.has(key)}
          />
        ))}
      </div>

      <div className="hidden lg:block">
        <Sparkline data={student[TREND_HISTORY[trendMetric]] as number[] | undefined} metric={trendMetric} />
      </div>
    </li>
  );
}

function DiaryEngagement({ entries, periodDays }: { entries: number; periodDays: number }) {
  const rate = periodDays > 0 ? Math.min(1, entries / periodDays) : 0;
  const low = rate < 0.3;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex cursor-help items-center gap-1.5 text-[11px] ${low ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'}`}>
          <BookOpen className="h-3 w-3" />
          Diário em {entries} de {periodDays} dias
          <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
            <span className={`block h-full rounded-full ${low ? 'bg-yellow-500' : 'bg-primary/60'}`} style={{ width: `${rate * 100}%` }} />
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] text-xs">
        Engajamento de {Math.round(rate * 100)}% no período.{low && ' Poucos registros: os indicadores podem não refletir bem a situação do aluno.'}
      </TooltipContent>
    </Tooltip>
  );
}

function MetricCell({ metric, value, classAvg, emphasize }: { metric: MetricKey; value: number | null; classAvg: number | null; emphasize: boolean }) {
  const Icon = METRIC_ICON[metric];
  const label = (
    <span className="flex items-center gap-1 text-xs text-muted-foreground lg:hidden">
      <Icon className="h-3 w-3" />{METRIC_LABEL[metric]}
    </span>
  );
  if (value == null) {
    return (
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">{label}<span className="text-sm text-muted-foreground">—</span></div>
        <div className="h-1.5 rounded-full bg-muted" />
      </div>
    );
  }

  const band = metricBand(value, metric);
  const pct = ((value - 1) / 4) * 100;
  const avgPct = classAvg != null ? ((classAvg - 1) / 4) * 100 : null;
  const diff = classAvg != null ? value - classAvg : null;
  const worse = diff != null && (HIGHER_IS_WORSE[metric] ? diff > 0.05 : diff < -0.05);
  const better = diff != null && (HIGHER_IS_WORSE[metric] ? diff < -0.05 : diff > 0.05);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="min-w-0 cursor-help space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 lg:justify-start">
            {label}
            <span className="flex items-baseline gap-1.5">
              <span className={`text-sm tabular-nums ${emphasize ? 'font-bold' : 'font-medium'} ${BAND_TEXT[band]}`}>{value.toFixed(1)}</span>
              {diff != null && (
                <span className={`text-[11px] tabular-nums ${worse ? 'text-red-600 dark:text-red-400' : better ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {diff > 0 ? '+' : diff < 0 ? '−' : '±'}{Math.abs(diff).toFixed(1)}
                </span>
              )}
            </span>
          </div>
          <div className="relative h-1.5 rounded-full bg-muted">
            <div className={`h-full rounded-full ${BAND_FILL[band]}`} style={{ width: `${Math.max(pct, 4)}%` }} />
            {avgPct != null && (
              <span className="absolute -top-[3px] h-3 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60" style={{ left: `${avgPct}%` }} />
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">{METRIC_LABEL[metric]}: {value.toFixed(1)} <span className="font-normal text-muted-foreground">({METRIC_HINT[metric]})</span></p>
        {classAvg != null && diff != null && (
          <p className="text-muted-foreground">
            Média da turma {classAvg.toFixed(1)} · {Math.abs(diff) < 0.05 ? 'igual à média' : `${worse ? 'pior' : 'melhor'} que a média`}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function Sparkline({ data = [], metric }: { data?: number[]; metric: TrendMetric }) {
  if (data.length < 2) return <span className="text-[11px] text-muted-foreground">Poucos registros</span>;
  const w = 96, h = 32, pad = 4;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v: number) => pad + ((5 - v) / 4) * (h - pad * 2);
  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const last = data[data.length - 1];
  const band = metricBand(last, metric === 'score' ? 'mood' : metric);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <svg width={w} height={h} className="cursor-help overflow-visible" role="img" aria-label={`Evolução de ${TREND_LABEL[metric]}`}>
          <line x1={pad} x2={w - pad} y1={y(3)} y2={y(3)} className="stroke-border" strokeDasharray="2 3" />
          <polyline points={points} fill="none" className="stroke-muted-foreground" strokeOpacity={0.7} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(data.length - 1)} cy={y(last)} r={3} fill={BAND_HEX[band]} />
        </svg>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        {TREND_LABEL[metric]}: {data[0].toFixed(1)} → {last.toFixed(1)} em {data.length} registros (linha tracejada = 3)
      </TooltipContent>
    </Tooltip>
  );
}
