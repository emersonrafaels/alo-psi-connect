import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Eye, RotateCcw, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StudentRiskData } from '@/hooks/useStudentTriage';
import { buildPath, LEVEL_LABELS, type AcademicLevel, type AcademicUnit } from '@/features/academic/hierarchy';
import {
  AGE_RANGES,
  GENDER_LABELS,
  ageRangeOf,
  emptyStudentFilters,
  filterStudents,
  genderKeyOf,
  type AcademicPath,
  type StudentFilters,
  type StudentMultiFilter,
} from './studentFilters';

const riskLabels: Record<string, string> = { critical: 'Em Risco', alert: 'Alerta', attention: 'Atenção', healthy: 'Estável', no_data: 'Sem dados' };
const statusLabels: Record<string, string> = { pending: 'Pendente', triaged: 'Triado', in_progress: 'Em andamento', resolved: 'Concluído' };

type Control = { key: StudentMultiFilter; label: string; all: string; options: [string, string][] };

const baseControls: Control[] = [
  { key: 'risk', label: 'Nível de risco', all: 'Todos os níveis', options: Object.entries(riskLabels) },
  { key: 'status', label: 'Status da triagem', all: 'Todos os status', options: [['none', 'Sem triagem'], ['pending', 'Pendente'], ['active', 'Em acompanhamento'], ['resolved', 'Concluído']] },
  { key: 'activity', label: 'Diário no período', all: 'Todos os registros', options: [['with', 'Com registros'], ['without', 'Sem registros']] },
  { key: 'signal', label: 'Sinais de acompanhamento', all: 'Todos os sinais', options: [['keywords', 'Palavras de risco detectadas'], ['overdue', 'Follow-up vencido']] },
];

const withSelection = (filters: StudentFilters, key: StudentMultiFilter, value: string[]): StudentFilters => ({ ...filters, [key]: value });

function MultiSelect({ control, selected, counts, onToggle, onClear }: {
  control: Control; selected: string[]; counts: Record<string, number>;
  onToggle: (value: string) => void; onClear: () => void;
}) {
  const summary = selected.length === 0 ? control.all
    : selected.length === 1 ? (control.options.find(([value]) => value === selected[0])?.[1] ?? selected[0])
      : `${selected.length} selecionados`;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2 px-3 font-normal" aria-label={`${control.label}: ${summary}`}>
          <span className="min-w-0 truncate text-left">
            <span className="text-muted-foreground">{control.label}: </span>
            <span className={selected.length ? 'font-medium text-foreground' : ''}>{summary}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] p-2">
        <p className="px-2 pb-1 pt-0.5 text-xs font-medium text-muted-foreground">{control.label} · selecione um ou mais</p>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {control.options.map(([value, text]) => {
            const checked = selected.includes(value);
            const id = `${control.key}-${value}`;
            return (
              <div key={value} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(value)} />
                <label htmlFor={id} className="flex-1 cursor-pointer text-sm">{text}</label>
                <span className="text-xs tabular-nums text-muted-foreground">{counts[value] ?? 0}</span>
              </div>
            );
          })}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-center text-xs" onClick={onClear}>Limpar seleção</Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FilterGrid({ title, controls, filters, counts, onToggle, onClear }: {
  title: string; controls: Control[]; filters: StudentFilters; counts: Record<string, Record<string, number>>;
  onToggle: (key: StudentMultiFilter, value: string) => void; onClear: (key: StudentMultiFilter) => void;
}) {
  if (controls.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {controls.map((control) => (
          <MultiSelect key={control.key} control={control} selected={filters[control.key]} counts={counts[control.key] ?? {}}
            onToggle={(value) => onToggle(control.key, value)} onClear={() => onClear(control.key)} />
        ))}
      </div>
    </div>
  );
}

export function AllStudents({ students, nameOf, overdueIds, periodDays, risk, onRiskChange, onOpenHistory, units = [], levels = [], placements, showHeading = true }: {
  students: StudentRiskData[]; nameOf: (id: string) => string; overdueIds: Set<string>; periodDays: number;
  risk: string; onRiskChange: (risk: string) => void; onOpenHistory: (student: StudentRiskData) => void;
  units?: AcademicUnit[]; levels?: AcademicLevel[]; placements?: Map<string, string>; showHeading?: boolean;
}) {
  const [filters, setFilters] = useState<StudentFilters>(() => ({ ...emptyStudentFilters, risk: risk && risk !== 'all' ? [risk] : [] }));
  const [pageSize, setPageSize] = useState(25);
  const [visibleCount, setVisibleCount] = useState(25);
  const lastRiskEmit = useRef(risk);

  // The queue keeps a single risk in the URL; adopt it only when it arrives from outside this view.
  useEffect(() => {
    if (risk === lastRiskEmit.current) return;
    lastRiskEmit.current = risk;
    setFilters((current) => ({ ...current, risk: risk === 'all' ? [] : [risk] }));
  }, [risk]);

  useEffect(() => { setVisibleCount(pageSize); }, [filters, periodDays, pageSize]);

  // Academic path per student, derived from the class placement up through the active hierarchy.
  const academicOf = useMemo(() => {
    if (!placements || units.length === 0) return undefined;
    const cache = new Map<string, AcademicPath>();
    return (patientId: string): AcademicPath | undefined => {
      const cached = cache.get(patientId);
      if (cached) return cached;
      const classId = placements.get(patientId);
      if (!classId) return undefined;
      const path: AcademicPath = {};
      buildPath(classId, units, levels).forEach((unit) => { path[unit.level] = unit.name; });
      cache.set(patientId, path);
      return path;
    };
  }, [placements, units, levels]);

  const academicControls = useMemo<Control[]>(() => {
    if (units.length === 0) return [];
    return levels
      .map((level) => {
        const options: [string, string][] = [...new Set(units.filter((u) => u.level === level).map((u) => u.name))]
          .sort((a, b) => a.localeCompare(b, 'pt-BR'))
          .map((name) => [name, name]);
        return { key: level as StudentMultiFilter, label: LEVEL_LABELS[level], all: `Todas as opções`, options };
      })
      .filter((control) => control.options.length > 0);
  }, [units, levels]);

  const cadastralControls = useMemo<Control[]>(() => {
    const genders = [...new Set(students.map((s) => genderKeyOf(s.gender)))];
    const genderOptions: [string, string][] = Object.keys(GENDER_LABELS)
      .filter((key) => genders.includes(key))
      .map((key) => [key, GENDER_LABELS[key]]);
    return [
      { key: 'gender', label: 'Gênero', all: 'Todos os gêneros', options: genderOptions },
      { key: 'ageRange', label: 'Faixa etária', all: 'Todas as idades', options: AGE_RANGES.map((range) => [range.id, range.label]) },
    ];
  }, [students]);

  const allControls = useMemo(() => [...baseControls, ...academicControls, ...cadastralControls], [academicControls, cadastralControls]);

  const filtered = useMemo(() => filterStudents(students, filters, nameOf, overdueIds, academicOf), [students, filters, nameOf, overdueIds, academicOf]);
  const counts = useMemo(() => Object.fromEntries(allControls.map((control) => {
    const base = filterStudents(students, withSelection(filters, control.key, []), nameOf, overdueIds, academicOf);
    return [control.key, Object.fromEntries(control.options.map(([value]) => [value, filterStudents(base, withSelection(filters, control.key, [value]), nameOf, overdueIds, academicOf).length]))];
  })), [allControls, students, filters, nameOf, overdueIds, academicOf]);

  const toggle = (key: StudentMultiFilter, value: string) => {
    const current = filters[key];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    if (key === 'risk') {
      const emitted = next.length === 1 ? next[0] : 'all';
      lastRiskEmit.current = emitted;
      onRiskChange(emitted);
    }
    setFilters((currentFilters) => withSelection(currentFilters, key, next));
  };
  const reset = () => {
    setFilters(emptyStudentFilters);
    lastRiskEmit.current = 'all';
    onRiskChange('all');
    setVisibleCount(pageSize);
  };

  return (
    <section className="space-y-4" aria-label="Todos os alunos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showHeading ? (
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-primary" />Todos os alunos <Badge variant="secondary">{filtered.length} / {students.length}</Badge></h2>
        ) : (
          <span className="text-sm text-muted-foreground">{filtered.length} de {students.length} alunos</span>
        )}
        <span className="text-xs text-muted-foreground">Indicadores dos últimos {periodDays} dias</span>
      </div>
      <FilterGrid title="Triagem e registros" controls={baseControls} filters={filters} counts={counts} onToggle={toggle}
        onClear={(key) => setFilters((current) => withSelection(current, key, []))} />
      {academicControls.length > 0 && (
        <FilterGrid title="Estrutura acadêmica" controls={academicControls} filters={filters} counts={counts} onToggle={toggle}
          onClear={(key) => setFilters((current) => withSelection(current, key, []))} />
      )}
      <FilterGrid title="Dados cadastrais" controls={cadastralControls} filters={filters} counts={counts} onToggle={toggle}
        onClear={(key) => setFilters((current) => withSelection(current, key, []))} />
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar aluno anonimizado" placeholder="Buscar Aluno #..." className="pl-9" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></div>
        <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Limpar filtros</Button>
      </div>
      <div className="divide-y border-y">
        {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Nenhum aluno encontrado com estes filtros.</p>}
        {filtered.slice(0, visibleCount).map((student) => {
          const path = academicOf?.(student.patientId);
          const pathText = path ? [path.unit, path.course, path.shift, path.class].filter(Boolean).join(' · ') : null;
          return (
            <div key={student.patientId} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0 space-y-2">
                <Button variant="link" className="h-auto p-0 text-base font-semibold" onClick={() => onOpenHistory(student)}>{nameOf(student.patientId)}</Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={student.riskLevel === 'critical' ? 'destructive' : 'outline'}>{riskLabels[student.riskLevel]}</Badge>
                  <Badge variant="secondary">{student.lastTriageStatus ? statusLabels[student.lastTriageStatus] ?? 'Sem triagem' : 'Sem triagem'}</Badge>
                  <span className="text-xs text-muted-foreground">{student.entryCount} registros no período</span>
                  {overdueIds.has(student.patientId) && <Badge variant="destructive">Follow-up vencido</Badge>}
                </div>
                {pathText && <p className="text-xs text-muted-foreground">{pathText}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => onOpenHistory(student)}><Eye className="mr-2 h-4 w-4" />Ver histórico</Button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Exibindo {Math.min(visibleCount, filtered.length)} de {filtered.length} alunos</span>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setVisibleCount(Number(value)); }}>
            <SelectTrigger aria-label="Alunos por vez" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 25, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} por vez</SelectItem>)}</SelectContent>
          </Select>
          {visibleCount < filtered.length && <Button variant="outline" size="sm" onClick={() => setVisibleCount((count) => count + pageSize)}>Ver mais</Button>}
        </div>
      </div>
    </section>
  );
}
