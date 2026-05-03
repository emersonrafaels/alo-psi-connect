import { useEffect } from 'react';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import { getEmotionColor } from '@/utils/moodSeriesBuilder';
import { getDefaultEmoji } from '@/utils/emotionFormatters';
import { cn } from '@/lib/utils';

interface Props {
  configs: EmotionConfig[];
  selected: string[];
  onChange: (next: string[]) => void;
  storageKey?: string;
  max?: number;
}

export const EmotionMultiSelect = ({ configs, selected, onChange, storageKey, max = 6 }: Props) => {
  // Persist to localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(selected));
    } catch {}
  }, [selected, storageKey]);

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      if (selected.length >= max) {
        onChange([...selected.slice(1), key]);
      } else {
        onChange([...selected, key]);
      }
    }
  };

  if (configs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {configs.map((c, idx) => {
        const isOn = selected.includes(c.emotion_type);
        const color = getEmotionColor(configs, c.emotion_type, idx);
        const midEmoji =
          c.emoji_set?.[Math.round((c.scale_min + c.scale_max) / 2).toString()] ||
          getDefaultEmoji(c.emotion_type);
        return (
          <button
            key={c.emotion_type}
            type="button"
            role="switch"
            aria-checked={isOn}
            onClick={() => toggle(c.emotion_type)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              isOn
                ? 'border-transparent text-white shadow-sm'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
            )}
            style={isOn ? { backgroundColor: color } : undefined}
          >
            <span aria-hidden>{midEmoji}</span>
            <span>{c.display_name}</span>
            {isOn && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-white/80"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export function loadSelection(storageKey: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return parsed;
    }
  } catch {}
  return fallback;
}
