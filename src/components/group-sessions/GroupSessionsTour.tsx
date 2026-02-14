import { TourOverlay } from '@/components/ui/tour-overlay';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
}

interface GroupSessionsTourProps {
  showTour: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | undefined;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

export const GroupSessionsTour = ({
  showTour,
  currentStep,
  totalSteps,
  currentStepData,
  nextStep,
  prevStep,
  skipTour,
}: GroupSessionsTourProps) => {
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
