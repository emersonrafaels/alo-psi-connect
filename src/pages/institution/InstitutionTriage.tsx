import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, ShieldAlert, ListChecks, BarChart3, Clock, PanelLeft } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentTriageTab } from '@/components/institution/StudentTriageTab';

const SECTIONS = [
  { id: 'triage-risk', label: 'Visão de risco', icon: ShieldAlert },
  { id: 'triage-followups', label: 'Follow-ups vencidos', icon: Clock },
  { id: 'triage-metrics', label: 'Métricas da triagem', icon: BarChart3 },
  { id: 'triage-queue', label: 'Fila de triagem', icon: ListChecks },
] as const;

export default function InstitutionTriage() {
  const { tenant } = useTenant();
  const { userInstitutions, isLoading } = useInstitutionAccess();
  const inst = userInstitutions[0] as any;
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const backTo = buildTenantPath(tenant?.slug, '/portal-institucional');

  const go = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background transition-all ${collapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center gap-2 border-b px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ClipboardList className="h-4 w-4" /></div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Triagem</p>
              <p className="truncate text-sm font-semibold">{inst?.educational_institutions?.name ?? 'Instituição'}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {!collapsed && <p className="px-2 pb-1 pt-2 text-xs text-muted-foreground">Seções</p>}
          {SECTIONS.map(({ id, label, icon: I }) => (
            <button key={id} onClick={() => go(id)} title={label}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${active === id ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${collapsed ? 'justify-center' : ''}`}>
              <I className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t p-2">
          <Link to={backTo} title="Voltar ao Portal Institucional"
            className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? 'justify-center' : ''}`}>
            <ArrowLeft className="h-4 w-4 shrink-0" />{!collapsed && <span>Voltar ao Portal Institucional</span>}
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)} aria-label="Recolher menu"><PanelLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Triagem de alunos</span>
          <Button asChild variant="outline" size="sm" className="ml-auto"><Link to={backTo}><ArrowLeft className="h-4 w-4 mr-1" />Portal Institucional</Link></Button>
        </header>
        <main className="flex-1 space-y-6 p-4 md:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Triagem de alunos</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">Acompanhe níveis de risco, follow-ups e a fila de triagem. Alunos são exibidos de forma anonimizada.</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : inst?.institution_id ? (
            <StudentTriageTab institutionId={inst.institution_id} />
          ) : (
            <p className="py-12 text-center text-muted-foreground">Nenhuma instituição vinculada para exibir triagem.</p>
          )}
        </main>
      </div>
    </div>
  );
}
