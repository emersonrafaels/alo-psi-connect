import {
  Heart, Puzzle, GraduationCap, Building2, HeartHandshake, Wallet, Utensils, Bus,
  Accessibility, Briefcase, BookOpen, Users2, Users, ShieldCheck, Sparkles, Leaf,
  MessageCircle, NotebookPen, Moon, Route, Stethoscope, Clock, Gift, Bookmark,
  Headphones, Flower2, ClipboardCheck, Library, Calendar, Home, Globe, LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  heart: Heart,
  puzzle: Puzzle,
  graduation: GraduationCap,
  building: Building2,
  hands: HeartHandshake,
  wallet: Wallet,
  food: Utensils,
  bus: Bus,
  accessibility: Accessibility,
  briefcase: Briefcase,
  book: BookOpen,
  family: Users2,
  users: Users,
  shield: ShieldCheck,
  sparkles: Sparkles,
  leaf: Leaf,
  chat: MessageCircle,
  journal: NotebookPen,
  moon: Moon,
  path: Route,
  medical: Stethoscope,
  clock: Clock,
  gift: Gift,
  bookmark: Bookmark,
  headset: Headphones,
  lotus: Flower2,
  check: ClipboardCheck,
  library: Library,
  calendar: Calendar,
  home: Home,
  platform: Globe,
  grid: LayoutGrid,
};

export const SUPPORT_ICON_OPTIONS = Object.keys(MAP);

export const SupportIcon = ({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) => {
  const Cmp = (name && MAP[name]) || Sparkles;
  return <Cmp className={className} />;
};
