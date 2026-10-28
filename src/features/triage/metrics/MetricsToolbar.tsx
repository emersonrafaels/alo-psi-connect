import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Boxes, Building2, Calendar, LayoutDashboard, Siren, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Risk } from '../priorities';
import { PRIORITY_META, type TriagePriority } from '../triagePlan';
import { PRIORITIES, type MetricsSelection, type WeekBucket } from './teamMetrics';
import { RISK_HEX, RISK_LABEL, SCENE_RISKS, type Scene3D } from './three/sceneData';

export type MetricsMode = 'dashboard' | '3d';

const PERIOD_OPTIONS = [
  { value: 7, label: 'Última semana (7d)' },
  { value: 15, label: 'Quinzena (15d)' },
  { value: 30, label: 'Último mês (30d)' },
  { value: 60, label: '2 meses (60d)' },
  { value: 90, label: 'Trimestre (90d)' },
];

interface Option<T extends string> { value: T; label: string; icon?: typeof Boxes }

/** Segmented control backed by radio semantics. */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-muted p-1">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {Icon && <Icon className="h-4 w-4" />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

const chip = (active: boolean) =>
  `inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    active ? 'border-foreground bg-foreground text-background' : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'}`;

const FilterLabel = ({ children }: { children: string }) => (
  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</span>
);

interface MetricsToolbarProps {
  mode: MetricsMode;
  onModeChange: (mode: MetricsMode) => void;
  periodDays: number;
  onPeriodChange?: (days: number) => void;
  weeks: WeekBucket[];
  selection: MetricsSelection | null;
  onSelectionChange: (selection: MetricsSelection | null) => void;
  scene: Scene3D;
  onSceneChange: (scene: Scene3D) => void;
  /** Campus: risk levels whose windows light up. */
  risks: Set<Risk>;
  onRisksChange: (risks: Set<Risk>) => void;
  /** Campus: dim every building without Sinal elevado students waiting for triage. */
  highlightPending: boolean;
  onHighlightPendingChange: (on: boolean) => void;
}

/** Top of the Métricas page: dashboard / 3D switch and every filter, kept visible while scrolling. */
export function MetricsToolbar(props: MetricsToolbarProps) {
  const { mode, periodDays, weeks, selection, scene, risks, highlightPending } = props;
  const campus = mode === '3d' && scene === 'campus';
  const setSel = (patch: MetricsSelection) => {
    const next = { ...selection, ...patch };
    props.onSelectionChange(next.weekStart || next.priority ? next : null);
  };
  const hasFilters = campus ? risks.size < SCENE_RISKS.length || highlightPending : !!selection;
  const clear = () => {
    if (campus) { props.onRisksChange(new Set(SCENE_RISKS)); props.onHighlightPendingChange(false); }
    else props.onSelectionChange(null);
  };
  const toggleRisk = (r: Risk) => {
    const next = new Set(risks);
    if (next.has(r) && next.size > 1) next.delete(r); else next.add(r);
    props.onRisksChange(next);
  };

  return (
    <div className="sticky top-14 z-[5] space-y-3 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Modo de visualização"
          value={mode}
          onChange={props.onModeChange}
          options={[{ value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { value: '3d', label: '3D', icon: Boxes }]}
        />
        {mode === '3d' && (
          <Segmented
            label="Cena 3D"
            value={scene}
            onChange={props.onSceneChange}
            options={[{ value: 'volume', label: 'Volume da equipe', icon: Boxes }, { value: 'campus', label: 'Campus', icon: Building2 }]}
          />
        )}
        <span className="ml-auto text-xs text-muted-foreground">Atualizado às {format(new Date(), 'HH:mm')}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3">
        {props.onPeriodChange && (
          <div className="flex items-center gap-2">
            <FilterLabel>Período</FilterLabel>
            <Select value={String(periodDays)} onValueChange={(v) => props.onPeriodChange?.(Number(v))}>
              <SelectTrigger className="h-8 w-[180px]" aria-label="Período analisado">
                <Calendar className="mr-1 h-4 w-4 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>{PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{format(subDays(new Date(), periodDays), 'dd/MM')} – {format(new Date(), 'dd/MM')}</span>
          </div>
        )}

        {!campus && (
          <>
            <div className="flex items-center gap-2">
              <FilterLabel>Semana</FilterLabel>
              <Select value={selection?.weekStart ?? 'all'} onValueChange={(v) => setSel({ weekStart: v === 'all' ? undefined : v })}>
                <SelectTrigger className="h-8 w-[170px]" aria-label="Semana"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas (período)</SelectItem>
                  {[...weeks].reverse().map((w) => (
                    <SelectItem key={w.key} value={w.key}>
                      {format(w.start, 'dd/MM', { locale: ptBR })} – {format(w.end, 'dd/MM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Prioridade">
              <FilterLabel>Prioridade</FilterLabel>
              <button type="button" role="radio" aria-checked={!selection?.priority} className={chip(!selection?.priority)} onClick={() => setSel({ priority: undefined })}>Todas</button>
              {PRIORITIES.map((p: TriagePriority) => {
                const active = selection?.priority === p;
                return (
                  <button key={p} type="button" role="radio" aria-checked={active} className={chip(active)} onClick={() => setSel({ priority: active ? undefined : p })}>
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_META[p].dot}`} />{PRIORITY_META[p].label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {campus && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterLabel>Janelas acesas</FilterLabel>
              {SCENE_RISKS.map((r) => (
                <button key={r} type="button" className={chip(risks.has(r))} onClick={() => toggleRisk(r)} aria-pressed={risks.has(r)}>
                  <span className="h-2 w-2 rounded-full" style={{ background: RISK_HEX[r] }} />{RISK_LABEL[r]}
                </button>
              ))}
            </div>
            <button type="button" className={chip(highlightPending)} aria-pressed={highlightPending} onClick={() => props.onHighlightPendingChange(!highlightPending)}>
              <Siren className="h-3.5 w-3.5" />Destacar Sinal elevado aguardando triagem
            </button>
          </>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={clear}>
            <X className="h-3.5 w-3.5" />Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
