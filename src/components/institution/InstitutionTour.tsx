import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TOUR_STEPS } from '@/hooks/useInstitutionTour';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
}

interface InstitutionTourProps {
  showTour: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | undefined;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

export const InstitutionTour = ({
  showTour,
  currentStep,
  totalSteps,
  currentStepData,
  nextStep,
  prevStep,
  skipTour,
}: InstitutionTourProps) => {
  if (!showTour || !currentStepData) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Dialog open={showTour} onOpenChange={(open) => !open && skipTour()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {totalSteps}
            </span>
          </div>
          <DialogTitle>{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1.5 mt-4" />

        <DialogFooter className="flex-row justify-between gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTour}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Pular
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {isLastStep ? (
                'Começar'
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
