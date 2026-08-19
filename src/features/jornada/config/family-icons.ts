import { Circle, Droplet, Shield, Star, Sun, Waves, Zap, type LucideIcon } from "lucide-react";

/** Ícone de linha de cada família emocional da Roda. */
export const FAMILY_ICONS: Record<string, LucideIcon> = {
  raiva: Zap,
  medo: Shield,
  tristeza: Droplet,
  alegria: Sun,
  surpresa: Star,
  nojo: Waves,
};

export const getFamilyIcon = (familyId?: string | null): LucideIcon =>
  (familyId && FAMILY_ICONS[familyId]) || Circle;
