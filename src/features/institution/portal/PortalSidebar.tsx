import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, BarChart3, Heart, ClipboardList, StickyNote, Brain, Sparkles,
  Users, Briefcase, HeartHandshake, Ticket, LineChart, ArrowUpRight, Menu, Radar, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface PortalNavItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: string;
  href?: string;
  tour?: string;
}

export function buildPortalNav(build: (p: string) => string, canViewStudentBuddy: boolean): PortalNavItem[] {
  const items: PortalNavItem[] = [
    { id: 'overview', label: 'Visão Geral', description: 'Resumo da instituição e atalhos principais.', icon: LayoutDashboard, group: 'Painel' },
    { id: 'metrics', label: 'Métricas', description: 'Uso da plataforma, sessões e engajamento.', icon: BarChart3, group: 'Painel' },
    { id: 'wellbeing', label: 'Diário Emocional', description: 'Indicadores agregados e anonimizados do diário.', icon: Heart, group: 'Painel', tour: 'wellbeing-tab' },
    { id: 'triage-page', label: 'Triagem', description: '', icon: ClipboardList, group: 'Cuidado', href: build('/portal-institucional/triagem') },
    { id: 'messages-page', label: 'Mensagens', description: '', icon: Mail, group: 'Cuidado', href: build('/portal-institucional/mensagens') },
    { id: 'notes', label: 'Notas', description: 'Anotações internas da equipe institucional.', icon: StickyNote, group: 'Cuidado' },
    { id: 'buddy', label: 'Buddy', description: 'Insights do Buddy sobre a instituição.', icon: Brain, group: 'Cuidado' },
  ];
  if (canViewStudentBuddy) {
    items.push({ id: 'student-buddy', label: 'Buddy dos Alunos', description: 'Conversas do Buddy liberadas pelo admin.', icon: Sparkles, group: 'Cuidado' });
  }
  items.push(
    { id: 'students-page', label: 'Alunos', description: '', icon: Users, group: 'Gestão', href: build('/portal-institucional/alunos') },
    { id: 'professionals-page', label: 'Profissionais', description: '', icon: Briefcase, group: 'Gestão', href: build('/portal-institucional/profissionais') },
    { id: 'supports-page', label: 'Apoios', description: '', icon: HeartHandshake, group: 'Gestão', href: build('/portal-institucional/apoios') },
    { id: 'coupons', label: 'Cupons', description: 'Gere e acompanhe códigos de acesso.', icon: Ticket, group: 'Gestão' },
    { id: 'radar-page', label: 'Radar Institucional', description: 'Diagnóstico consultivo do bem-estar e da maturidade institucional.', icon: Radar, group: 'Gestão', href: build('/portal-institucional/radar') },
    { id: 'comparator-page', label: 'Comparador', description: '', icon: LineChart, group: 'Análises', href: build('/portal-institucional/comparador') },
  );
  return items;
}

interface Props {
  items: PortalNavItem[];
  active: string;
  onSelect: (id: string) => void;
}

function NavList({ items, active, onSelect, onDone }: Props & { onDone?: () => void }) {
  const groups = Array.from(new Set(items.map((i) => i.group)));
  return (
    <nav aria-label="Seções do portal" className="space-y-4 [&>div+div]:border-t [&>div+div]:pt-4" data-tour="tabs">
      {groups.map((g) => (
        <div key={g}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
          <ul className="space-y-0.5">
            {items.filter((i) => i.group === g).map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              const cls = cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30' : 'text-foreground/80 hover:bg-primary/10 hover:text-primary',
              );
              const content = (
                <>
                  <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-110', isActive ? '' : 'text-primary')} />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.href && <ArrowUpRight className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
                </>
              );
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link to={item.href} className={cls} onClick={onDone}>{content}</Link>
                  ) : (
                    <button
                      type="button"
                      className={cls}
                      aria-current={isActive ? 'page' : undefined}
                      data-tour={item.tour}
                      onClick={() => { onSelect(item.id); onDone?.(); }}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PortalSidebar(props: Props) {
  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div className="sticky top-24 rounded-2xl border bg-card p-3 shadow-md max-h-[calc(100vh-7rem)] overflow-y-auto">
        <NavList {...props} />
      </div>
    </aside>
  );
}

export function PortalMobileNav(props: Props) {
  const [open, setOpen] = useState(false);
  const current = props.items.find((i) => i.id === props.active);
  return (
    <div className="lg:hidden mb-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Menu className="h-4 w-4" />
            Menu · <span className="font-semibold">{current?.label}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Portal Institucional</SheetTitle></SheetHeader>
          <NavList {...props} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
