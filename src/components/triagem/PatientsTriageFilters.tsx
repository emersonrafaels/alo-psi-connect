import { useMemo } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import type { PatientOverviewRow } from '@/hooks/useAdminPatientsOverview';

export interface TriageFilters {
  generos: string[];
  ageRange: string; // 'all' | 'lt18' | '18-24' | '25-34' | '35-49' | '50plus'
  institutions: string[];
  diaryMin: string;
  diaryMax: string;
  sessionsMin: string;
  sessionsMax: string;
  appointmentsMin: string;
  appointmentsMax: string;
  isStudent: string; // 'all' | 'yes' | 'no'
  lastLogin: string; // 'all' | 'never' | '7' | '30' | 'over30'
  createdWithin: string; // 'all' | '7' | '30' | '90' | '365'
  hasDiary: string; // 'all' | 'yes' | 'no'
  scales: string; // 'all' | 'complete' | 'incomplete' | 'none'
  iseuBand: string; // 'all' | 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'none'
}

export const defaultFilters: TriageFilters = {
  generos: [],
  ageRange: 'all',
  institutions: [],
  diaryMin: '',
  diaryMax: '',
  sessionsMin: '',
  sessionsMax: '',
  appointmentsMin: '',
  appointmentsMax: '',
  isStudent: 'all',
  lastLogin: 'all',
  createdWithin: 'all',
  hasDiary: 'all',
  scales: 'all',
  iseuBand: 'all',
};

export const countActive = (f: TriageFilters): number => {
  let c = 0;
  if (f.generos.length) c++;
  if (f.ageRange !== 'all') c++;
  if (f.institutions.length) c++;
  if (f.diaryMin || f.diaryMax) c++;
  if (f.sessionsMin || f.sessionsMax) c++;
  if (f.appointmentsMin || f.appointmentsMax) c++;
  if (f.isStudent !== 'all') c++;
  if (f.lastLogin !== 'all') c++;
  if (f.createdWithin !== 'all') c++;
  if (f.hasDiary !== 'all') c++;
  if (f.scales !== 'all') c++;
  if (f.iseuBand !== 'all') c++;
  return c;
};


const GENERO_OPTIONS = ['Feminino', 'Masculino', 'Não-binário', 'Outro', 'Não informado'];

interface Props {
  filters: TriageFilters;
  onChange: (f: TriageFilters) => void;
  availableInstitutions: string[];
}

export default function PatientsTriageFilters({ filters, onChange, availableInstitutions }: Props) {
  const active = countActive(filters);
  const set = <K extends keyof TriageFilters>(key: K, value: TriageFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleArr = (key: 'generos' | 'institutions', val: string) => {
    const arr = filters[key];
    set(key, arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />

      {/* Gênero */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Gênero {filters.generos.length > 0 && <Badge variant="secondary" className="ml-2">{filters.generos.length}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start">
          <div className="space-y-2">
            {GENERO_OPTIONS.map((g) => (
              <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={filters.generos.includes(g)} onCheckedChange={() => toggleArr('generos', g)} />
                {g}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Idade */}
      <Select value={filters.ageRange} onValueChange={(v) => set('ageRange', v)}>
        <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Idade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda idade</SelectItem>
          <SelectItem value="lt18">Menor de 18</SelectItem>
          <SelectItem value="18-24">18–24</SelectItem>
          <SelectItem value="25-34">25–34</SelectItem>
          <SelectItem value="35-49">35–49</SelectItem>
          <SelectItem value="50plus">50+</SelectItem>
        </SelectContent>
      </Select>

      {/* Instituição */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Instituição {filters.institutions.length > 0 && <Badge variant="secondary" className="ml-2">{filters.institutions.length}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 max-h-80 overflow-auto" align="start">
          <div className="space-y-2">
            {availableInstitutions.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma instituição disponível</p>
            )}
            {availableInstitutions.map((i) => (
              <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={filters.institutions.includes(i)} onCheckedChange={() => toggleArr('institutions', i)} />
                <span className="truncate">{i}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Range numéricos */}
      <RangeFilter
        label="Diário (30d)"
        min={filters.diaryMin} max={filters.diaryMax}
        onMin={(v) => set('diaryMin', v)} onMax={(v) => set('diaryMax', v)}
      />
      <RangeFilter
        label="Encontros"
        min={filters.sessionsMin} max={filters.sessionsMax}
        onMin={(v) => set('sessionsMin', v)} onMax={(v) => set('sessionsMax', v)}
      />
      <RangeFilter
        label="Consultas"
        min={filters.appointmentsMin} max={filters.appointmentsMax}
        onMin={(v) => set('appointmentsMin', v)} onMax={(v) => set('appointmentsMax', v)}
      />

      {/* Estudante */}
      <Select value={filters.isStudent} onValueChange={(v) => set('isStudent', v)}>
        <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Estudante: todos</SelectItem>
          <SelectItem value="yes">Estudante: sim</SelectItem>
          <SelectItem value="no">Estudante: não</SelectItem>
        </SelectContent>
      </Select>

      {/* Último login */}
      <Select value={filters.lastLogin} onValueChange={(v) => set('lastLogin', v)}>
        <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Login: todos</SelectItem>
          <SelectItem value="never">Nunca logou</SelectItem>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="over30">Mais de 30 dias</SelectItem>
        </SelectContent>
      </Select>

      {/* Criado em */}
      <Select value={filters.createdWithin} onValueChange={(v) => set('createdWithin', v)}>
        <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Criado: todos</SelectItem>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
          <SelectItem value="365">Último ano</SelectItem>
        </SelectContent>
      </Select>

      {/* Tem diário */}
      <Select value={filters.hasDiary} onValueChange={(v) => set('hasDiary', v)}>
        <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Diário: todos</SelectItem>
          <SelectItem value="yes">Com diário</SelectItem>
          <SelectItem value="no">Sem diário</SelectItem>
        </SelectContent>
      </Select>

      {/* Escalas */}
      <Select value={filters.scales} onValueChange={(v) => set('scales', v)}>
        <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Escalas: todos</SelectItem>
          <SelectItem value="complete">Escalas: completas</SelectItem>
          <SelectItem value="incomplete">Escalas: incompletas</SelectItem>
          <SelectItem value="none">Escalas: nenhuma</SelectItem>
        </SelectContent>
      </Select>

      {/* ISEU-RBE */}
      <Select value={filters.iseuBand} onValueChange={(v) => set('iseuBand', v)}>
        <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ISEU: todos</SelectItem>
          <SelectItem value="verde">ISEU: Equilíbrio</SelectItem>
          <SelectItem value="amarelo">ISEU: Atenção leve</SelectItem>
          <SelectItem value="laranja">ISEU: Risco moderado</SelectItem>
          <SelectItem value="vermelho">ISEU: Risco elevado</SelectItem>
          <SelectItem value="none">ISEU: sem cálculo</SelectItem>
        </SelectContent>
      </Select>


      {active > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange(defaultFilters)} className="gap-1">
          <X className="h-3 w-3" /> Limpar ({active})
        </Button>
      )}
    </div>
  );
}

function RangeFilter({
  label, min, max, onMin, onMax,
}: { label: string; min: string; max: string; onMin: (v: string) => void; onMax: (v: string) => void }) {
  const active = !!(min || max);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {label}{active && <Badge variant="secondary" className="ml-2">{min || '0'}–{max || '∞'}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Mínimo</Label>
            <Input type="number" min="0" value={min} onChange={(e) => onMin(e.target.value)} className="h-8" />
          </div>
          <div>
            <Label className="text-xs">Máximo</Label>
            <Input type="number" min="0" value={max} onChange={(e) => onMax(e.target.value)} className="h-8" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const applyTriageFilters = (rows: PatientOverviewRow[], f: TriageFilters): PatientOverviewRow[] => {
  const ageOf = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  };
  const daysSince = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (24 * 3600 * 1000));
  };
  const inRange = (n: number, min: string, max: string) => {
    if (min && n < Number(min)) return false;
    if (max && n > Number(max)) return false;
    return true;
  };

  return rows.filter((r) => {
    if (f.generos.length && !f.generos.includes(r.genero || 'Não informado')) return false;

    if (f.ageRange !== 'all') {
      const age = ageOf(r.data_nascimento);
      if (age === null) return false;
      if (f.ageRange === 'lt18' && age >= 18) return false;
      if (f.ageRange === '18-24' && (age < 18 || age > 24)) return false;
      if (f.ageRange === '25-34' && (age < 25 || age > 34)) return false;
      if (f.ageRange === '35-49' && (age < 35 || age > 49)) return false;
      if (f.ageRange === '50plus' && age < 50) return false;
    }

    if (f.institutions.length) {
      const names = r.institutions.map((i) => i.name);
      if (!f.institutions.some((i) => names.includes(i))) return false;
    }

    if (!inRange(r.mood.last30, f.diaryMin, f.diaryMax)) return false;
    if (!inRange(r.sessions.upcoming + r.sessions.past, f.sessionsMin, f.sessionsMax)) return false;
    if (!inRange(r.appointments.upcoming + r.appointments.past, f.appointmentsMin, f.appointmentsMax)) return false;

    if (f.isStudent === 'yes' && !r.eh_estudante) return false;
    if (f.isStudent === 'no' && r.eh_estudante) return false;

    if (f.lastLogin !== 'all') {
      const d = daysSince(r.last_sign_in_at);
      if (f.lastLogin === 'never' && d !== null) return false;
      if (f.lastLogin === '7' && (d === null || d > 7)) return false;
      if (f.lastLogin === '30' && (d === null || d > 30)) return false;
      if (f.lastLogin === 'over30' && (d === null || d <= 30)) return false;
    }

    if (f.createdWithin !== 'all') {
      const d = daysSince(r.created_at);
      const limit = Number(f.createdWithin);
      if (d === null || d > limit) return false;
    }

    if (f.hasDiary === 'yes' && r.mood.total === 0) return false;
    if (f.hasDiary === 'no' && r.mood.total > 0) return false;

    return true;
  });
};
