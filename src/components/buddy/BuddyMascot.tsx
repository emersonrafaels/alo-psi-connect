import React from "react";
import BuddyCharacter from "@/components/hero/BuddyCharacter";
import { cn } from "@/lib/utils";

interface BuddyMascotProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  bubbleClassName?: string;
}

export function BuddyMascot({ size = "md", message, className, bubbleClassName }: BuddyMascotProps) {
  return (
    <div className={cn("flex items-start gap-2 sm:gap-3 min-w-0 w-full", className)}>
      <div className="shrink-0">
        <BuddyCharacter size={size} animated />
      </div>
      {message && (
        <div
          role="status"
          className={cn(
            "relative rounded-2xl bg-primary/10 border border-primary/20 px-3 py-2 sm:px-4 sm:py-3 text-sm text-foreground leading-relaxed flex-1 min-w-0 [overflow-wrap:anywhere]",
            bubbleClassName
          )}
        >
          <span className="absolute -left-2 top-4 h-3 w-3 rotate-45 bg-primary/10 border-l border-b border-primary/20" />
          {message}
        </div>
      )}
    </div>
  );
}

export default BuddyMascot;
