import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Radar as RadarIcon, Search, ExternalLink, PlusCircle, BarChart3 } from 'lucide-react';
import { useInstitutionRadarList } from '@/hooks/useInstitutionRadar';
import { useInstitutions } from '@/hooks/useInstitutions';
import { PAINS } from '@/data/radarCatalog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RadarInstitutional() {
  const { data: list = [], isLoading } = useInstitutionRadarList();
  const { institutions } = useInstitutions();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [institutionId, setInstitutionId] = useState<string>('all');

  const filtered = useMemo(() => {
    return list.filter(d => {
      if (status !== 'all' && d.status !== status) return false;
      if (institutionId !== 'all' && d.institution_id !== institutionId) return false;
      if (q) {
        const name = d.educational_institutions?.name?.toLowerCase() ?? '';
        const resp = (d.respondent_name ?? '').toLowerCase();
        if (!name.includes(q.toLowerCase()) && !resp.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [list, q, status, institutionId]);

  // Agregações
  const submitted = list.filter(d => d.status === 'submitted');
  const avgScore = submitted.length ? Math.round(submitted.reduce((s, d) => s + Number(d.overall_score ?? 0), 0) / submitted.length) : 0;

  const painFreq = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of submitted) {
      for (const p of (d.pains ?? [])) map.set(p, (map.get(p) ?? 0) + 1);
    }
    const total = submitted.length || 1;
    return [...map.entries()]
      .map(([id, n]) => ({ id, title: PAINS.find(x => x.id === id)?.title ?? id, pct: Math.round((n / total) * 100), n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 6);
  }, [submitted]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <RadarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Radar Institucional</h1>
            <p className="text-sm text-muted-foreground">Diagnósticos consultivos por IES.</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total de diagnósticos</div><div className="text-3xl font-bold">{list.length}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Submetidos</div><div className="text-3xl font-bold">{submitted.length}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Rascunhos</div><div className="text-3xl font-bold">{list.length - submitted.length}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Maturidade média</div><div className="text-3xl font-bold text-primary">{avgScore}<span className="text-lg text-muted-foreground">/100</span></div></CardContent></Card>
      </div>

      {/* Dores agregadas */}
      {painFreq.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" /> Dores mais frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {painFreq.map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{p.title}</span>
                  <span className="text-muted-foreground">{p.pct}% ({p.n})</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros + lista */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base flex-1">Diagnósticos</CardTitle>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por instituição ou respondente" className="pl-9 w-[260px]" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="submitted">Submetidos</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
                <SelectItem value="archived">Arquivados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={institutionId} onValueChange={setInstitutionId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Instituição" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as instituições</SelectItem>
                {institutions?.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum diagnóstico encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Respondente</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.educational_institutions?.name ?? d.institution_snapshot?.name ?? '—'}</TableCell>
                    <TableCell>v{d.version}</TableCell>
                    <TableCell>
                      <Badge variant={d.status === 'submitted' ? 'default' : 'outline'}>
                        {d.status === 'submitted' ? 'Submetido' : d.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{d.respondent_name ?? '—'}</TableCell>
                    <TableCell>{d.overall_score != null ? <span className="font-semibold text-primary">{Math.round(Number(d.overall_score))}</span> : '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(d.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/admin/radar-institucional/${d.id}`}><ExternalLink className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
