import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PRIORITY_META, type TriagePriority } from '../triagePlan';
import { PRIORITIES, type Breakdowns, type Outcomes } from './teamMetrics';
import { fmt, pct } from './format';

/** Single-series bar list: one hue, value at the tip, label in text ink (dataviz: text never wears the data color). */
export function BarList({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="font-medium tabular-nums">{r.value}</span>
          </div>
          <div className="h-2 rounded-r-[4px] bg-muted">
            <div className="h-full rounded-r-[4px] bg-[#2a78d6] dark:bg-[#3987e5]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** With `onSelect`, rows act as a priority filter; without it the table is read-only. */
export function PriorityTable({ data, selected, onSelect }: { data: Breakdowns['byPriority']; selected?: TriagePriority; onSelect?: (p: TriagePriority | undefined) => void }) {
  const maxCreated = Math.max(...PRIORITIES.map((p) => data[p].created), 1);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prioridade</TableHead>
          <TableHead className="text-right">Novas</TableHead>
          <TableHead className="text-right">Resolvidas</TableHead>
          <TableHead className="text-right">Em andamento</TableHead>
          <TableHead className="text-right">Mediana até resolver</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {PRIORITIES.map((p) => {
          const row = data[p];
          const active = selected === p;
          return (
            <TableRow
              key={p}
              onClick={onSelect ? () => onSelect(active ? undefined : p) : undefined}
              className={`${onSelect ? 'cursor-pointer' : ''} ${active ? 'bg-primary/5' : ''} ${selected && !active ? 'opacity-50' : ''}`}
              aria-selected={onSelect ? active : undefined}
            >
              <TableCell>
                <span className="flex items-center gap-2 font-medium">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_META[p].dot}`} />{PRIORITY_META[p].label}
                </span>
                <span className="mt-1 block h-1.5 max-w-[140px] rounded-r-[4px] bg-muted">
                  <span className={`block h-full rounded-r-[4px] ${PRIORITY_META[p].dot}`} style={{ width: `${(row.created / maxCreated) * 100}%` }} />
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.created}</TableCell>
              <TableCell className="text-right tabular-nums">{row.resolved}</TableCell>
              <TableCell className="text-right tabular-nums">{row.open}</TableCell>
              <TableCell className="text-right tabular-nums">{row.medianDays != null ? `${fmt(row.medianDays)} d` : '—'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Diverging stack: improved (blue) ↔ unchanged (neutral gray) ↔ worse (red), separated by 2px surface gaps. */
const OUTCOME_SEGMENTS = [
  { key: 'improved', label: 'Melhorou de nível', swatch: 'bg-[#2a78d6] dark:bg-[#3987e5]' },
  { key: 'stable', label: 'Mesmo nível', swatch: 'bg-[#a8a7a0] dark:bg-[#6b6a65]' },
  { key: 'worsened', label: 'Piorou de nível', swatch: 'bg-[#e34948] dark:bg-[#e66767]' },
] as const;

export function OutcomesBar({ outcomes, reopened, resolved }: { outcomes: Outcomes; reopened: number; resolved: number }) {
  const known = outcomes.improved + outcomes.stable + outcomes.worsened;
  if (outcomes.total === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma triagem foi resolvida neste período.</p>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Dos <strong>{outcomes.total}</strong> alunos com triagem resolvida no período,{' '}
        <strong>{outcomes.improved}</strong> melhoraram de nível de risco, <strong>{outcomes.stable}</strong> estão no mesmo nível
        e <strong>{outcomes.worsened}</strong> pioraram.
      </p>
      {known > 0 && (
        <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" role="img"
          aria-label={OUTCOME_SEGMENTS.map((s) => `${s.label}: ${outcomes[s.key]}`).join(', ')}>
          {OUTCOME_SEGMENTS.filter((s) => outcomes[s.key] > 0).map((s) => (
            <div key={s.key} className={s.swatch} style={{ width: `${(outcomes[s.key] / known) * 100}%` }} title={`${s.label}: ${outcomes[s.key]}`} />
          ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {OUTCOME_SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.swatch}`} />
            {s.label} <span className="font-medium text-foreground tabular-nums">{outcomes[s.key]} ({pct(outcomes[s.key], known)}%)</span>
          </li>
        ))}
        {outcomes.noData > 0 && <li>{outcomes.noData} sem registros recentes para comparar</li>}
      </ul>
      <p className="border-t pt-3 text-xs text-muted-foreground">
        Compara o nível de risco no momento da triagem com o nível atual do aluno.
        {' '}Reaberturas no período: <span className="font-medium text-foreground">{reopened}</span>
        {resolved > 0 && <> ({pct(reopened, resolved)}% das resolvidas)</>}.
      </p>
    </div>
  );
}

type TeamKey = 'name' | 'triaged' | 'resolved' | 'open' | 'medianDays';
const TEAM_COLUMNS: { key: TeamKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Pessoa', numeric: false },
  { key: 'triaged', label: 'Triagens', numeric: true },
  { key: 'resolved', label: 'Resolvidas', numeric: true },
  { key: 'open', label: 'Em andamento', numeric: true },
  { key: 'medianDays', label: 'Mediana até resolver', numeric: true },
];

export function TeamTable({ rows }: { rows: Breakdowns['team'] }) {
  const [sort, setSort] = useState<{ key: TeamKey; dir: 1 | -1 }>({ key: 'triaged', dir: -1 });
  const [showAll, setShowAll] = useState(false);
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma atividade da equipe neste recorte.</p>;

  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    if (av == null) return 1;
    if (bv == null) return -1;
    return (typeof av === 'string' ? av.localeCompare(bv as string, 'pt-BR') : (av as number) - (bv as number)) * sort.dir;
  });
  const visible = showAll ? sorted : sorted.slice(0, 8);

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            {TEAM_COLUMNS.map((c) => {
              const active = sort.key === c.key;
              return (
                <TableHead key={c.key} className={c.numeric ? 'text-right' : ''} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => setSort(active ? { key: c.key, dir: sort.dir === 1 ? -1 : 1 } : { key: c.key, dir: c.numeric ? -1 : 1 })}
                    className={`inline-flex items-center gap-1 hover:text-foreground ${active ? 'text-foreground' : ''}`}
                  >
                    {c.label}
                    {active && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((r) => (
            <TableRow key={r.name}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-right tabular-nums">{r.triaged}</TableCell>
              <TableCell className="text-right tabular-nums">{r.resolved}</TableCell>
              <TableCell className="text-right tabular-nums">{r.open}</TableCell>
              <TableCell className="text-right tabular-nums">{r.medianDays != null ? `${fmt(r.medianDays)} d` : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 8 && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
          {showAll ? 'Mostrar menos' : `Ver todas as ${rows.length} pessoas`}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Resolvidas e em andamento contam as triagens que a própria pessoa registrou.</p>
    </div>
  );
}
