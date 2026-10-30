import { usePortalFreshData } from '@/features/institution/usePortalFreshData';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, LayoutDashboard, ListChecks, BarChart3, Clock, PanelLeft, Flame, Users } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { Button } from '@/components/ui/button';
import { LogoLoader } from '@/components/ui/logo-loader';
import { StudentTriageTab, type TriageView } from '@/components/institution/StudentTriageTab';

// "Todos os alunos" is a queue sub-tab, not a new view, so it shares the "fila" view with a tab hint.
const ALL_STUDENTS_TAB = 'todos_alunos';

const SECTIONS: { id: TriageView; tab?: string; label: string; hint: string; icon: typeof Clock }[] = [
  { id: 'resumo', label: 'Resumo', hint: 'Números e o que fazer agora', icon: LayoutDashboard },
  { id: 'prioridades', label: 'Prioridades', hint: 'Alunos mais urgentes', icon: Flame },
  { id: 'followups', label: 'Follow-ups', hint: 'Vencidos e próximos', icon: Clock },
  { id: 'fila', label: 'Fila de triagem', hint: 'Para triar, andamento e histórico', icon: ListChecks },
  { id: 'fila', tab: ALL_STUDENTS_TAB, label: 'Todos os alunos', hint: 'Todos os níveis e filtros', icon: Users },
  { id: 'metricas', label: 'Métricas', hint: 'Desempenho da equipe', icon: BarChart3 },
];

export default function InstitutionTriage() {
  usePortalFreshData();
  const { tenant } = useTenant();
  const { userInstitutions, isLoading } = useInstitutionAccess();
  const inst = userInstitutions[0] as any;
  const [collapsed, setCollapsed] = useState(false);
  const [params, setParams] = useSearchParams();
  const view = (SECTIONS.find((s) => s.id === params.get('view'))?.id ?? 'resumo') as TriageView;
  const activeTab = params.get('tab');
  const backTo = buildTenantPath(tenant?.slug, '/portal-institucional');

  const go = (v: TriageView, extra?: { risk?: string; tab?: string }) => {
    const next = new URLSearchParams({ view: v });
    if (extra?.risk) next.set('risk', extra.risk);
    if (extra?.tab) next.set('tab', extra.tab);
    // Filter changes within a view replace the entry, so Back leaves the view instead of stepping through filters.
    setParams(next, { replace: v === view });
  };

  // The queue keeps its own sub-tab sticky when the user clicks back to "Fila de triagem".
  const openSection = (section: (typeof SECTIONS)[number]) => {
    if (section.tab) return go(section.id, { tab: section.tab });
    if (section.id === 'fila' && activeTab && activeTab !== ALL_STUDENTS_TAB) return go('fila', { tab: activeTab });
    return go(section.id);
  };
  const isSectionActive = (section: (typeof SECTIONS)[number]) =>
    view === section.id && (section.tab ? activeTab === section.tab : activeTab !== ALL_STUDENTS_TAB);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center gap-2 border-b px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ClipboardList className="h-4 w-4" /></div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Triagem</p>
              <p className="truncate text-sm font-semibold">{inst?.educational_institutions?.name ?? 'Instituição'}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-2" aria-label="Seções da triagem">
          {SECTIONS.map((section) => {
            const { id, label, hint, icon: I } = section;
            const active = isSectionActive(section);
            return (
              <button key={`${id}:${section.tab ?? ''}`} onClick={() => openSection(section)} title={label} aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${collapsed ? 'justify-center' : ''}`}>
                <I className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="min-w-0">
                    <span className={`block ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                    <span className="block truncate text-[11px] opacity-80">{hint}</span>
                  </span>
                )}
              </button>
            );
          })}
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
          <span className="text-sm text-muted-foreground">Triagem de alunos · <span className="text-foreground">{(SECTIONS.find(isSectionActive) ?? SECTIONS.find((s) => s.id === view))?.label}</span></span>
          <Button asChild variant="outline" size="sm" className="ml-auto"><Link to={backTo}><ArrowLeft className="h-4 w-4 mr-1" />Portal Institucional</Link></Button>
        </header>
        <main className="flex-1 space-y-6 p-4 md:p-8">
          {isLoading ? (
            <LogoLoader className="min-h-[40vh]" />
          ) : inst?.institution_id ? (
            <StudentTriageTab
              institutionId={inst.institution_id}
              view={view}
              initialRisk={params.get('risk')}
              initialTab={params.get('tab')}
              onNavigate={go}
            />
          ) : (
            <p className="py-12 text-center text-muted-foreground">Nenhuma instituição vinculada para exibir triagem.</p>
          )}
        </main>
      </div>
    </div>
  );
}
