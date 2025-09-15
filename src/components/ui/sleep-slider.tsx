import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface SleepSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  className?: string
}

const sleepEmojis = {
  1: "😵",
  2: "😴",
  3: "😐",
  4: "😊",
  5: "😴✨"
}

const sleepLabels = {
  1: "Muito Ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom", 
  5: "Excelente"
}

const getSleepColor = (value: number) => {
  if (value <= 1) return "hsl(var(--destructive))"
  if (value <= 2) return "hsl(var(--warning))"
  if (value <= 3) return "hsl(var(--muted-foreground))"
  if (value <= 4) return "hsl(var(--primary))"
  return "hsl(var(--success))"
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex space-x-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-lg transition-all duration-200 ${
            i < rating 
              ? 'text-yellow-400 scale-110' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}

export const SleepSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SleepSliderProps
>(({ className, value, onValueChange, ...props }, ref) => {
  const currentValue = value[0] || 3
  const currentEmoji = sleepEmojis[currentValue as keyof typeof sleepEmojis]
  const currentLabel = sleepLabels[currentValue as keyof typeof sleepLabels]
  const currentColor = getSleepColor(currentValue)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-3">
        <span className="text-4xl transition-transform duration-200 hover:scale-110">
          {currentEmoji}
        </span>
        <div className="transition-transform duration-200 hover:scale-105">
          <StarRating rating={currentValue} />
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
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-red-200 via-blue-200 to-purple-200 dark:from-red-900/20 dark:via-blue-900/20 dark:to-purple-900/20">
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
        <span>😵 Muito Ruim</span>
        <span>😐 Regular</span>
        <span>😴✨ Excelente</span>
      </div>
    </div>
  )
})

SleepSlider.displayName = "SleepSlider"