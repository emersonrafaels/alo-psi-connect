import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface MoodSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  className?: string
}

const moodEmojis = {
  1: "😭",
  2: "😢", 
  3: "😔",
  4: "😐",
  5: "😐",
  6: "🙂",
  7: "😊",
  8: "😄",
  9: "😆",
  10: "🤩"
}

const moodLabels = {
  1: "Muito Triste",
  2: "Triste",
  3: "Desanimado",
  4: "Preocupado", 
  5: "Neutro",
  6: "Ok",
  7: "Bem",
  8: "Feliz",
  9: "Muito Feliz",
  10: "Radiante"
}

const getMoodColor = (value: number) => {
  if (value <= 2) return "hsl(var(--destructive))"
  if (value <= 4) return "hsl(var(--warning))"
  if (value <= 6) return "hsl(var(--muted-foreground))"
  if (value <= 8) return "hsl(var(--primary))"
  return "hsl(var(--success))"
}

export const MoodSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  MoodSliderProps
>(({ className, value, onValueChange, ...props }, ref) => {
  const currentValue = value[0] || 5
  const currentEmoji = moodEmojis[currentValue as keyof typeof moodEmojis]
  const currentLabel = moodLabels[currentValue as keyof typeof moodLabels]
  const currentColor = getMoodColor(currentValue)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-3">
        <span className="text-4xl transition-transform duration-200 hover:scale-110">
          {currentEmoji}
        </span>
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: currentColor }}>
            {currentValue}/10
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
        max={10}
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
        <span>😭 Muito Triste</span>
        <span>😐 Neutro</span>
        <span>🤩 Radiante</span>
      </div>
    </div>
  )
})

MoodSlider.displayName = "MoodSlider"