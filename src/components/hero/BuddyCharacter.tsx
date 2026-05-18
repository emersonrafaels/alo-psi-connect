import React from 'react';
import buddySvg from '@/assets/buddy/placeholder-buddy.svg';

interface BuddyProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  alt?: string;
  className?: string;
}

const sizeMap: Record<string, number> = {
  sm: 48,
  md: 96,
  lg: 160,
};

export default function BuddyCharacter({ size = 'md', animated = true, alt, className }: BuddyProps) {
  const px = sizeMap[size] || sizeMap['md'];
  const finalAlt = alt || 'Buddy — companheiro acolhedor da Rede Bem‑Estar';
  return (
    // decorative by default; allow className for positioning
    <img
      src={buddySvg}
      alt={finalAlt}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={`${animated ? 'buddy-animated' : ''} ${className || ''}`}
    />
  );
}
