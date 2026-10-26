import { useMemo, useState, useEffect } from 'react';
import { Eye, RotateCcw, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StudentRiskData } from '@/hooks/useStudentTriage';
import { emptyStudentFilters, filterStudents, type StudentFilters } from './studentFilters';

const riskLabels: Record<string, string> = { critical: 'Em Risco', alert: 'Alerta', attention: 'Atenção', healthy: 'Estável', no_data: 'Sem dados' };
const statusLabels: Record<string, string> = { pending: 'Pendente', triaged: 'Triado', in_progress: 'Em andamento', resolved: 'Concluído' };
const controls: { key: keyof StudentFilters; label: string; options: [string, string][] }[] = [
  { key: 'risk', label: 'Nível de risco', options: [['all', 'Todos os níveis'], ...Object.entries(riskLabels)] },
  { key: 'status', label: 'Status da triagem', options: [['all', 'Todos os status'], ['none', 'Sem triagem'], ['pending', 'Pendente'], ['active', 'Em acompanhamento'], ['resolved', 'Concluído']] },
  { key: 'activity', label: 'Diário no período', options: [['all', 'Todos os registros'], ['with', 'Com registros'], ['without', 'Sem registros']] },
  { key: 'signal', label: 'Sinais de acompanhamento', options: [['all', 'Todos os sinais'], ['keywords', 'Palavras de risco detectadas'], ['overdue', 'Follow-up vencido']] },
];

export function AllStudents({ students, nameOf, overdueIds, periodDays, risk, onRiskChange, onOpenHistory }: {
  students: StudentRiskData[]; nameOf: (id: string) => string; overdueIds: Set<string>; periodDays: number;
  risk: string; onRiskChange: (risk: string) => void; onOpenHistory: (student: StudentRiskData) => void;
}) {
  const [filters, setFilters] = useState(emptyStudentFilters);
  const [pageSize, setPageSize] = useState(25);
  const [visibleCount, setVisibleCount] = useState(25);
  useEffect(() => { setVisibleCount(pageSize); }, [risk, periodDays, pageSize]);
  const effectiveFilters = { ...filters, risk };
  const filtered = useMemo(() => filterStudents(students, { ...filters, risk }, nameOf, overdueIds), [students, filters, risk, nameOf, overdueIds]);
  const update = (key: keyof StudentFilters, value: string) => {
    if (key === 'risk') onRiskChange(value);
    else setFilters((current) => ({ ...current, [key]: value }));
    setVisibleCount(pageSize);
  };
  const reset = () => { setFilters(emptyStudentFilters); onRiskChange('all'); setVisibleCount(pageSize); };
  return (
    <section className="space-y-4" aria-label="Todos os alunos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-primary" />Todos os alunos <Badge variant="secondary">{filtered.length} / {students.length}</Badge></h2>
        <span className="text-xs text-muted-foreground">Indicadores dos últimos {periodDays} dias</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {controls.map(({ key, label, options }) => (
          <label key={key} className="space-y-1.5 text-xs font-medium">
            <span>{label}</span>
            <Select value={effectiveFilters[key]} onValueChange={(value) => update(key, value)}>
              <SelectTrigger aria-label={label} className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent>
            </Select>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar aluno anonimizado" placeholder="Buscar Aluno #..." className="pl-9" value={filters.search} onChange={(event) => update('search', event.target.value)} /></div>
        <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Limpar filtros</Button>
      </div>
      <div className="divide-y border-y">
        {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Nenhum aluno encontrado com estes filtros.</p>}
        {filtered.slice(0, visibleCount).map((student) => (
          <div key={student.patientId} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0 space-y-2">
              <Button variant="link" className="h-auto p-0 text-base font-semibold" onClick={() => onOpenHistory(student)}>{nameOf(student.patientId)}</Button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={student.riskLevel === 'critical' ? 'destructive' : 'outline'}>{riskLabels[student.riskLevel]}</Badge>
                <Badge variant="secondary">{student.lastTriageStatus ? statusLabels[student.lastTriageStatus] ?? 'Sem triagem' : 'Sem triagem'}</Badge>
                <span className="text-xs text-muted-foreground">{student.entryCount} registros no período</span>
                {overdueIds.has(student.patientId) && <Badge variant="destructive">Follow-up vencido</Badge>}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onOpenHistory(student)}><Eye className="mr-2 h-4 w-4" />Ver histórico</Button>
          </div>
        ))}
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