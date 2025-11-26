import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  label: string
  number: number
}

interface RescheduleStepIndicatorProps {
  currentStep: 'appointment' | 'professional' | 'datetime'
  onStepClick?: (step: 'appointment' | 'professional' | 'datetime') => void
}

const steps: Step[] = [
  { id: 'appointment', label: 'Consulta', number: 1 },
  { id: 'professional', label: 'Profissional', number: 2 },
  { id: 'datetime', label: 'Data/Hora', number: 3 },
]

export const RescheduleStepIndicator = ({ currentStep, onStepClick }: RescheduleStepIndicatorProps) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  return (
    <>
      {/* Desktop: Horizontal */}
      <div className="hidden md:flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable = status === 'completed'
          
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick?.(step.id as any)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 transition-all",
                  isClickable && "cursor-pointer hover:scale-105"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    status === 'completed' && "bg-green-500 text-white",
                    status === 'current' && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    status === 'pending' && "bg-muted text-muted-foreground"
                  )}
                >
                  {status === 'completed' ? <Check className="h-5 w-5" /> : step.number}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    status === 'current' && "text-primary",
                    status === 'completed' && "text-foreground",
                    status === 'pending' && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-4 transition-colors",
                    status === 'completed' ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: Pills */}
      <div className="flex md:hidden items-center justify-center gap-2 mb-6 px-4">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          
          return (
            <div
              key={step.id}
              className={cn(
                "flex-1 h-2 rounded-full transition-all",
                status === 'completed' && "bg-green-500",
                status === 'current' && "bg-primary",
                status === 'pending' && "bg-muted"
              )}
            />
          )
        })}
      </div>
    </>
  )
}
