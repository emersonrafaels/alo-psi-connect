import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface AnxietySliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  className?: string
}

const anxietyEmojis = {
  1: "😌",
  2: "🙂",
  3: "😐",
  4: "😰",
  5: "😨"
}

const anxietyLabels = {
  1: "Muito Calmo",
  2: "Calmo",
  3: "Neutro", 
  4: "Ansioso",
  5: "Muito Ansioso"
}

const getAnxietyColor = (value: number) => {
  if (value <= 1) return "hsl(var(--success))"
  if (value <= 2) return "hsl(var(--primary))"
  if (value <= 3) return "hsl(var(--muted-foreground))"
  if (value <= 4) return "hsl(var(--warning))"
  return "hsl(var(--destructive))"
}

const WavePattern = ({ intensity }: { intensity: number }) => {
  const waveCount = Math.max(1, intensity)
  const amplitude = intensity * 2
  
  return (
    <div className="relative w-12 h-8 overflow-hidden">
      {Array.from({ length: waveCount }).map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 border-2 rounded-full animate-pulse"
          style={{
            borderColor: getAnxietyColor(intensity),
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${2 - (intensity * 0.2)}s`,
            transform: `scale(${1 + i * 0.2})`,
            opacity: 0.6 - (i * 0.1)
          }}
        />
      ))}
      <div 
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: getAnxietyColor(intensity) }}
      />
    </div>
  )
}

export const AnxietySlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  AnxietySliderProps
>(({ className, value, onValueChange, ...props }, ref) => {
  const currentValue = value[0] || 3
  const currentEmoji = anxietyEmojis[currentValue as keyof typeof anxietyEmojis]
  const currentLabel = anxietyLabels[currentValue as keyof typeof anxietyLabels]
  const currentColor = getAnxietyColor(currentValue)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-3">
        <span className="text-4xl transition-transform duration-200 hover:scale-110">
          {currentEmoji}
        </span>
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
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 dark:from-green-900/20 dark:via-yellow-900/20 dark:to-red-900/20">
          <SliderPrimitive.Range 
            className="absolute h-full rounded-full transition-colors duration-200"
            style={{ 
              background: `linear-gradient(to right, hsl(var(--success)), ${currentColor})`
            }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className="block h-6 w-6 rounded-full border-2 bg-background shadow-lg ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110"
          style={{ borderColor: currentColor }}
        />
      </SliderPrimitive.Root>
      
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>😌 Muito Calmo</span>
        <span>😐 Neutro</span>
        <span>😨 Muito Ansioso</span>
      </div>
    </div>
  )
})

AnxietySlider.displayName = "AnxietySlider"