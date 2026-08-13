import React from 'react';
import buddyGif from '@/assets/buddy/placeholder-buddy.gif';
import buddyMain from '@/assets/buddy-main.png';
import buddyChat from '@/assets/buddy-chat.png';
import buddyArms from '@/assets/buddy/buddy-arms.png';
import buddyThink from '@/assets/buddy/buddy-think.png';
import buddyLGPD from '@/assets/buddy/buddy-lgpd.png';

export type BuddyVariant = 'default' | 'main' | 'chat' | 'placeholder' | 'arms' | 'think' |'lgpd';

interface BuddyProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  alt?: string;
  className?: string;
  variant?: BuddyVariant;
  src?: string;
}

const sizeMap: Record<string, number> = {
  sm: 48,
  md: 96,
  lg: 160,
};

const variantMap: Record<BuddyVariant, string> = {
  default: buddyMain,
  main: buddyMain,
  chat: buddyChat,
  placeholder: buddyGif,
  arms : buddyArms,
  think : buddyThink,
  lgpd : buddyLGPD

};

export default function BuddyCharacter({
  size = 'md',
  animated = false,
  alt,
  className,
  variant = 'default',
  src,
}: BuddyProps) {
  const px = sizeMap[size] || sizeMap['md'];
  const finalAlt = alt || 'Buddy — companheiro acolhedor da Rede Bem‑Estar';
  const imageSrc = src || variantMap[variant] || buddyMain;

  return (
    <img
      src={imageSrc}
      alt={finalAlt}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={`${animated ? 'buddy-animated' : ''} ${className || ''}`}
    />
  );
}
