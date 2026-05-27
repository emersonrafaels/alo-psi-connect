import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Download, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdminPatientsOverview, type PatientOverviewRow } from '@/hooks/useAdminPatientsOverview';
import { usePatientFullViewAccess } from '@/hooks/usePatientFullViewAccess';
import { PatientFullViewDrawer } from '@/components/admin/PatientFullViewDrawer';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PatientsTriageFilters, { defaultFilters, applyTriageFilters, type TriageFilters } from './PatientsTriageFilters';

const fmt = (iso?: string | null) => {
  if (!iso) return '—';
  try { return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR }); } catch { return iso; }
};
const ageFrom = (iso?: string | null) => {
  if (!iso) return null;
  try {
    const d = parseISO(iso);
    return Math.floor(differenceInDays(new Date(), d) / 365.25);
  } catch { return null; }
};
const lastLoginBadge = (iso?: string | null) => {
  if (!iso) return <Badge variant="outline" className="text-xs">Nunca</Badge>;
  const days = differenceInDays(new Date(), parseISO(iso));
  if (days <= 7) return <Badge className="text-xs bg-green-600">{days}d</Badge>;
  if (days <= 30) return <Badge variant="secondary" className="text-xs">{days}d</Badge>;
  return <Badge variant="outline" className="text-xs">{days}d</Badge>;
};

const toCSV = (rows: PatientOverviewRow[]) => {
  const headers = [
    'Nome', 'Email', 'Idade', 'Gênero', 'Estudante', 'Instituições',
    'Criado em', 'Último login', 'Diário (total)', 'Diário (30d)',
    'Encontros futuros', 'Encontros passados', 'Consultas futuras', 'Consultas passadas',
  ];
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [
    r.nome, r.email, ageFrom(r.data_nascimento) ?? '', r.genero,
    r.eh_estudante ? 'Sim' : 'Não',
    r.institutions.map((i) => i.name).join('; '),
    r.created_at, r.last_sign_in_at,
    r.mood.total, r.mood.last30,
    r.sessions.upcoming, r.sessions.past,
    r.appointments.upcoming, r.appointments.past,
  ].map(escape).join(','));
  return [headers.map(escape).join(','), ...lines].join('\n');
};

interface Props {
  title?: string;
  subtitle?: string;
  redirectOnDenied?: string;
}

export default function PatientsTriageView({
  title = 'Listagem Completa de Pacientes',
  subtitle = 'Visão consolidada de todos os pacientes da plataforma.',
  redirectOnDenied = '/admin',
}: Props) {
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading } = usePatientFullViewAccess();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<TriageFilters>(defaultFilters);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useAdminPatientsOverview({
    search: debounced,
    page,
    pageSize: 50,
  });

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () => (data?.rows ? applyTriageFilters(data.rows, filters) : []),
    [data, filters],
  );

  const availableInstitutions = useMemo(() => {
    const set = new Set<string>();
    data?.rows?.forEach((r) => r.institutions.forEach((i) => set.add(i.name)));
    return Array.from(set).sort();
  }, [data]);

  const pageCount = useMemo(
    () => (data ? Math.ceil(data.total / data.pageSize) : 0),
    [data],
  );

  if (accessLoading) {
    return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!hasAccess) {
    navigate(redirectOnDenied, { replace: true });
    return null;
  }

  const exportCSV = () => {
    if (!filteredRows.length) return;
    const csv = toCSV(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pacientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Idade/Gênero</TableHead>
              <TableHead>Instituições</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead>Último login</TableHead>
              <TableHead className="text-center">Diário<br/><span className="text-xs font-normal">(30d/total)</span></TableHead>
              <TableHead className="text-center">Encontros<br/><span className="text-xs font-normal">(fut/pas)</span></TableHead>
              <TableHead className="text-center">Consultas<br/><span className="text-xs font-normal">(fut/pas)</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">
                <Loader2 className="h-5 w-5 animate-spin inline" />
              </TableCell></TableRow>
            ) : data?.rows?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum paciente encontrado.
              </TableCell></TableRow>
            ) : (
              data?.rows?.map((r) => (
                <TableRow
                  key={r.profile_id}
                  className="cursor-pointer"
                  onClick={() => setSelectedProfileId(r.profile_id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.foto_perfil_url || undefined} />
                        <AvatarFallback>{r.nome?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ageFrom(r.data_nascimento) ?? '—'} {r.genero && <span className="text-xs text-muted-foreground">· {r.genero}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {r.institutions.slice(0, 2).map((i, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{i.name}</Badge>
                      ))}
                      {r.institutions.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{r.institutions.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{fmt(r.created_at)}</TableCell>
                  <TableCell>{lastLoginBadge(r.last_sign_in_at)}</TableCell>
                  <TableCell className="text-center text-sm">
                    {r.mood.last30}/{r.mood.total}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {r.sessions.upcoming}/{r.sessions.past}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {r.appointments.upcoming}/{r.appointments.past}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total} pacientes · página {page + 1} de {pageCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      <PatientFullViewDrawer
        profileId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  );
}
