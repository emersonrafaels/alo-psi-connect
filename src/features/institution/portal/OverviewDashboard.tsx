import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, Users, TrendingUp, HeartHandshake, type LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useInstitutionExecutiveSummary } from '@/hooks/useInstitutionExecutiveSummary';

interface Props {
  institutionName?: string;
  totalStudents: number;
  activeStudents: number;
  totalProfessionals: number;
  activeProfessionals: number;
  buildPath: (path: string) => string;
  institutionId?: string;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

function Kpi({ icon: Icon, label, value, hint, to }: { icon: LucideIcon; label: string; value: string; hint: string; to: string }) {
  return (
    <Link to={to} className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="rounded-xl bg-primary/10 p-2 text-primary transition-transform group-hover:scale-110 group-hover:rotate-6">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        Ver detalhes <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function OverviewDashboard({ institutionName, totalStudents, activeStudents, totalProfessionals, activeProfessionals, buildPath, institutionId }: Props) {
  const { data: summary } = useInstitutionExecutiveSummary(institutionId);
  const weekActive = summary?.activeStudentsWeek ?? 0;
  const engagementPct = Math.round((summary?.engagementRate ?? 0) * 100);
  const profRate = totalProfessionals ? Math.round((activeProfessionals / totalProfessionals) * 100) : 0;
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-foreground/10" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-primary-foreground/5" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm capitalize opacity-80">{today}</p>
            <h2 className="mt-1 text-xl font-semibold md:text-2xl">
              {institutionName ?? 'Portal institucional'}
            </h2>
            <p className="mt-6 text-5xl font-bold tabular-nums tracking-tight md:text-6xl">{fmt(totalStudents)}</p>
            <p className="text-sm opacity-80">alunos vinculados</p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              {weekActive > 0 ? (
                <>
                  <span>{fmt(weekActive)} alunos engajados nos últimos 7 dias</span>
                  <span className="font-semibold tabular-nums">{engagementPct}% de engajamento</span>
                </>
              ) : (
                <span>{summary ? 'Sem atividade registrada nesta semana' : 'Carregando engajamento…'}</span>
              )}
            </div>
            <Progress value={Math.min(100, engagementPct)} className="h-2 bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
          </div>
        </div>
      </section>

      <div data-tour="summary-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={GraduationCap} label="Alunos ativos" value={fmt(activeStudents)} hint={`de ${fmt(totalStudents)} vinculados`} to={buildPath('/portal-institucional/alunos')} />
        <Kpi icon={Users} label="Profissionais ativos" value={fmt(activeProfessionals)} hint={`de ${fmt(totalProfessionals)} vinculados`} to={buildPath('/portal-institucional/profissionais')} />
        <Kpi icon={TrendingUp} label="Taxa de atividade" value={`${profRate}%`} hint="profissionais ativos" to={buildPath('/portal-institucional/profissionais')} />
        <Kpi icon={HeartHandshake} label="Apoios" value="Biblioteca" hint="Gerencie os apoios da instituição" to={buildPath('/portal-institucional/apoios')} />
      </div>
    </div>
  );
}
