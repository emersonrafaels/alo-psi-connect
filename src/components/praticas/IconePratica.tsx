import {
  Wind, HeartPulse, Eye, Activity, Sparkles, Mountain, Heart, Moon,
  Flower2, Sun, CloudRain, Waves, Leaf, Cloud, Brain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Wind, HeartPulse, Eye, Activity, Sparkles, Mountain, Heart, Moon,
  Flower2, Sun, CloudRain, Waves, Leaf, Cloud, Brain,
};

export const ICON_OPTIONS = Object.keys(MAP);

export const IconePratica = ({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) => {
  const Cmp = (name && MAP[name]) || Sparkles;
  return <Cmp className={className} />;
};
