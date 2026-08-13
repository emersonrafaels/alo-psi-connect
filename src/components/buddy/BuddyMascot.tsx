import React from "react";
import BuddyCharacter, { type BuddyVariant } from "@/components/hero/BuddyCharacter";
import { cn } from "@/lib/utils";

interface BuddyMascotProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  bubbleClassName?: string;
  /** Force vertical stacking of character + bubble (useful in narrow sidebars). */
  stack?: boolean;
  variant?: BuddyVariant;
  animated?: boolean;
}

export function BuddyMascot({
  size = "md",
  message,
  className,
  bubbleClassName,
  stack = false,
  variant = "main",
  animated = false,
}: BuddyMascotProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 sm:gap-3 min-w-0 max-w-full w-full",
        stack ? "flex-col" : "flex-col min-[440px]:flex-row",
        className
      )}
    >
      <div className={cn("shrink-0", stack && "self-center")}>
        <BuddyCharacter size={size} variant={variant} animated={animated} />
      </div>
      {message && (
        <div
          role="status"
          className={cn(
            "relative w-full max-w-full rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm sm:px-4 sm:py-3 flex-1 min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] [hyphens:auto]",
            bubbleClassName
          )}
        >
          {!stack && (
            <span className="hidden min-[440px]:block absolute -left-2 top-4 h-3 w-3 rotate-45 border-l border-b border-primary/20 bg-primary/10" />
          )}
          {message}
        </div>
      )}
    </div>
  );
}

export default BuddyMascot;
