import { TourOverlay } from '@/components/ui/tour-overlay';

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
  return (
    <TourOverlay
      show={showTour}
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepData={currentStepData}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={skipTour}
    />
  );
};
