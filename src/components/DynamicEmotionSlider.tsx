import React from 'react';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { EmotionConfig } from '@/hooks/useEmotionConfig';

interface DynamicEmotionSliderProps {
  emotionConfig: EmotionConfig;
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
}

export const DynamicEmotionSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DynamicEmotionSliderProps
>(({ emotionConfig, value, onValueChange, className }, ref) => {
  const currentValue = value[0] || emotionConfig.scale_min;
  const emoji = emotionConfig.emoji_set[currentValue.toString()] || '😐';
  
  const getColor = (val: number) => {
    const range = emotionConfig.scale_max - emotionConfig.scale_min;
    const normalized = (val - emotionConfig.scale_min) / range;
    
    if (normalized <= 0.33) return emotionConfig.color_scheme.low;
    if (normalized <= 0.66) return emotionConfig.color_scheme.mid;
    return emotionConfig.color_scheme.high;
  };

  const currentColor = getColor(currentValue);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">{emotionConfig.display_name}</h3>
          {emotionConfig.description && (
            <p className="text-sm text-muted-foreground">{emotionConfig.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{emoji}</span>
          <span 
            className="text-2xl font-bold"
            style={{ color: currentColor }}
          >
            {currentValue}
          </span>
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
        min={emotionConfig.scale_min}
        max={emotionConfig.scale_max}
        step={1}
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range 
            className="absolute h-full transition-colors"
            style={{ backgroundColor: currentColor }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className="block h-6 w-6 rounded-full border-2 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          style={{ borderColor: currentColor }}
        />
      </SliderPrimitive.Root>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {emotionConfig.emoji_set[emotionConfig.scale_min.toString()]} {emotionConfig.scale_min}
        </span>
        <span className="flex items-center gap-1">
          {emotionConfig.emoji_set[emotionConfig.scale_max.toString()]} {emotionConfig.scale_max}
        </span>
      </div>
    </div>
  );
});

DynamicEmotionSlider.displayName = "DynamicEmotionSlider";
