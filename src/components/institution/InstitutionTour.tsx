import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TourStep } from '@/hooks/useInstitutionTour';
import type { PortalNavItem } from '@/features/institution/portal/PortalSidebar';

interface InstitutionTourProps {
  showTour: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | undefined;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  goToStep?: (i: number) => void;
  navItems: PortalNavItem[];
  onSelectSection: (id: string) => void;
  institutionName?: string;
}

const HIGHLIGHT = ['ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background', 'animate-pulse'];

export const InstitutionTour = ({
  showTour, currentStep, totalSteps, currentStepData, nextStep, prevStep, skipTour, goToStep,
  navItems, onSelectSection, institutionName,
}: InstitutionTourProps) => {
  const navigate = useNavigate();
  const step = currentStepData;
  const items = (step?.navIds ?? []).map((id) => navItems.find((n) => n.id === id)).filter(Boolean) as PortalNavItem[];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  // Destaca os itens correspondentes no menu lateral (desktop).
  useEffect(() => {
    if (!showTour || !step) return;
    const els = step.navIds.flatMap((id) => Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="nav-${id}"]`)));
    els.forEach((el) => el.classList.add(...HIGHLIGHT));
    return () => els.forEach((el) => el.classList.remove(...HIGHLIGHT));
  }, [showTour, step]);

  const open = (item: PortalNavItem) => {
    skipTour();
    if (item.href) navigate(item.href);
    else { onSelectSection(item.id); window.scrollTo(0, 0); }
  };

  if (!step) return null;
  const HeroIcon = items[0]?.icon ?? (isFirst ? ShieldCheck : Sparkles);

  return (
    <Dialog open={showTour} onOpenChange={(o) => { if (!o) skipTour(); }}>
      <DialogContent className="max-w-lg overflow-hidden p-0 lg:left-[calc(50%+8rem)]">
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-6 pb-5 pt-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" aria-hidden />
          <div key={step.id} className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <HeroIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{step.group} · {currentStep + 1}/{totalSteps}</p>
                {isFirst && institutionName && <p className="text-xs text-muted-foreground">{institutionName}</p>}
              </div>
            </div>
            <DialogTitle className="text-xl">{step.title}</DialogTitle>
            <DialogDescription className="mt-1.5 text-sm leading-relaxed">{step.description}</DialogDescription>
          </div>
        </div>

        <div key={`${step.id}-body`} className="space-y-2 px-6 animate-in fade-in duration-500">
          {step.highlights && (
            <ul className="grid gap-2">
              {step.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" />{h}
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 && (
            <div className={cn('grid gap-2', isLast ? 'grid-cols-2' : 'grid-cols-1')}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => open(item)}
                    className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                      {!isLast && 'Abrir agora'}<ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <div className="flex gap-1.5" role="tablist" aria-label="Etapas do tour">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Etapa ${i + 1}`}
                onClick={() => goToStep?.(i)}
                className={cn('h-2 rounded-full transition-all', i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60')}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isLast && <Button variant="ghost" size="sm" onClick={skipTour}>Pular</Button>}
            {!isFirst && <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevStep} aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Button>}
            <Button size="sm" onClick={nextStep}>
              {isLast ? 'Começar' : 'Próximo'}{!isLast && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
