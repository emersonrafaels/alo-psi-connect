import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { Battery, BatteryLow } from "lucide-react"

interface EnergySliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  className?: string
}

const energyLabels = {
  1: "Exausto",
  2: "Cansado", 
  3: "Normal",
  4: "Energizado",
  5: "Muito Energizado"
}

const getEnergyColor = (value: number) => {
  if (value <= 1) return "hsl(var(--destructive))"
  if (value <= 2) return "hsl(var(--warning))"
  if (value <= 3) return "hsl(var(--muted-foreground))"
  if (value <= 4) return "hsl(var(--primary))"
  return "hsl(var(--success))"
}

const BatteryIcon = ({ level }: { level: number }) => {
  const fillPercentage = (level / 5) * 100
  
  return (
    <div className="relative">
      <Battery className="h-8 w-8" />
      <div 
        className="absolute bottom-1 left-1 rounded-sm transition-all duration-300"
        style={{
          width: `${Math.max(fillPercentage - 20, 0)}%`,
          height: '60%',
          backgroundColor: getEnergyColor(level),
          opacity: 0.8
        }}
      />
    </div>
  )
}

export const EnergySlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  EnergySliderProps
>(({ className, value, onValueChange, ...props }, ref) => {
  const currentValue = value[0] || 3
  const currentLabel = energyLabels[currentValue as keyof typeof energyLabels]
  const currentColor = getEnergyColor(currentValue)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-3">
        <div className="transition-transform duration-200 hover:scale-110" style={{ color: currentColor }}>
          <BatteryIcon level={currentValue} />
        </div>
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: currentColor }}>
            {currentValue}/5
          </div>
          <div className="text-sm text-muted-foreground">
            {currentLabel}
          </div>
        </div>
      </div>
      
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        value={value}
        onValueChange={onValueChange}
        min={1}
        max={5}
        step={1}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 dark:from-red-900/20 dark:via-yellow-900/20 dark:to-green-900/20">
          <SliderPrimitive.Range 
            className="absolute h-full rounded-full transition-colors duration-200"
            style={{ 
              background: `linear-gradient(to right, hsl(var(--destructive)), ${currentColor})`
            }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className="block h-6 w-6 rounded-full border-2 bg-background shadow-lg ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110"
          style={{ borderColor: currentColor }}
        />
      </SliderPrimitive.Root>
      
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>🪫 Exausto</span>
        <span>🔋 Normal</span>
        <span>⚡ Energizado</span>
      </div>
    </div>
  )
})

EnergySlider.displayName = "EnergySlider"