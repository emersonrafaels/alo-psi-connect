import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  completed: boolean;
}

interface TimelineProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
}

export const TimelineProgress = ({ currentStep, totalSteps, onStepClick }: TimelineProgressProps) => {
  const isMobile = useIsMobile();
  
  const steps: Step[] = [
    { number: 1, title: 'Dados Pessoais', completed: currentStep > 1 },
    { number: 2, title: 'Profissão', completed: currentStep > 2 },
    { number: 3, title: 'Perfil', completed: currentStep > 3 },
    { number: 4, title: 'Resumo', completed: currentStep > 4 },
    { number: 5, title: 'Especialidades', completed: currentStep > 5 },
    { number: 6, title: 'Horários', completed: currentStep > 6 },
    { number: 7, title: 'Credenciais', completed: currentStep > 7 },
    { number: 8, title: 'Revisão', completed: currentStep > 8 }
  ];

  // LAYOUT MOBILE: Vertical compacto
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Barra de progresso visual */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">
            Passo {currentStep} de {totalSteps}
          </span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        
        {/* Steps em chips horizontais (scroll) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => onStepClick(step.number)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all",
                step.completed 
                  ? "bg-primary/10 text-primary"
                  : currentStep === step.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="font-medium">{step.number}</span>
              )}
              <span>{step.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // LAYOUT DESKTOP: Timeline horizontal
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={step.number} className="flex flex-col items-center relative flex-1">
          {/* Linha de conexão entre steps */}
          {index < totalSteps - 1 && (
            <div 
              className={cn(
                "absolute top-4 left-1/2 h-0.5 -z-10 transition-colors",
                step.completed ? "bg-primary" : "bg-muted"
              )} 
              style={{ width: '100%' }}
            />
          )}
          
          {/* Círculo do step */}
          <button
            onClick={() => onStepClick(step.number)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all hover:scale-105 mb-2",
              step.completed 
                ? 'bg-primary text-primary-foreground' 
                : currentStep === step.number
                ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {step.completed ? (
              <Check className="h-4 w-4" />
            ) : (
              step.number
            )}
          </button>
          
          {/* Nome do step */}
          <span 
            onClick={() => onStepClick(step.number)}
            className={cn(
              "text-xs text-center cursor-pointer transition-colors",
              step.completed || currentStep === step.number 
                ? 'text-primary font-medium' 
                : 'text-muted-foreground'
            )}
          >
            {step.title}
          </span>
        </div>
      ))}
    </div>
  );
};
