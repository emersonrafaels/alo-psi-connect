import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  className?: string;
}

export const ProgressIndicator = ({ 
  currentStep, 
  totalSteps, 
  stepLabels, 
  className 
}: ProgressIndicatorProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    {
                      "bg-primary text-primary-foreground": isActive || isCompleted,
                      "bg-muted text-muted-foreground": !isActive && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                {stepLabels && stepLabels[index] && (
                  <span className={cn(
                    "text-xs mt-1 text-center",
                    {
                      "text-primary font-medium": isActive,
                      "text-muted-foreground": !isActive,
                    }
                  )}>
                    {stepLabels[index]}
                  </span>
                )}
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    {
                      "bg-primary": isCompleted,
                      "bg-muted": !isCompleted,
                    }
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Passo {currentStep} de {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}% concluído</span>
      </div>
    </div>
  );
};